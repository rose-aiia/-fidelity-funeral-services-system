// How an order moves from "placed" to "delivered", shared by the browser mock and scripts/mock-api.mjs so the two
// behave identically. Pure: time is passed in. Only relative `.ts` imports (Node loads this file directly).
import { maskPhone } from '../../lib/phone.ts'
import { marketplaceItems, type DeliveryDetails, type NewOrder, type Order, type OrderStatus, type PaymentInput } from './data.ts'
import { priceLines, type PricedLine } from './pricing.ts'
import { normaliseEcocash } from './validation.ts'

/** How long an EcoCash prompt takes to be answered, in the simulation. */
export const PAYMENT_DELAY_MS = 4000
/** After payment, how long until each stage, in the simulation. */
export const STAGE_DELAYS_MS = { confirmed: 20_000, in_progress: 60_000, delivered: 150_000 } as const
/** This EcoCash number is always declined, so the failure path can be demonstrated. */
export const DECLINED_ECOCASH = '+263780000000'

type Settlement = {
  startedAt: string
  /** EcoCash answers on its own after a delay; Paynow waits for the hosted page's result. */
  auto: boolean
  willFail: boolean
  attempt: number
}

/** An order as the server stores it: the public order plus what never leaves the server. */
export type OrderRecord = Order & {
  ownerId: string
  /** Orders made through the API progress on a timer; seeded history doesn't. */
  simulate: boolean
  settle: Settlement
}

const ORDER = ['awaiting_payment', 'payment_failed', 'paid', 'confirmed', 'in_progress', 'delivered'] as const
const rank = (status: OrderStatus) => ORDER.indexOf(status as (typeof ORDER)[number])

const iso = (time: number) => new Date(time).toISOString()

export function toPublicOrder(record: OrderRecord): Order {
  const { ownerId: _owner, simulate: _simulate, settle: _settle, ...order } = record
  return order
}

function settlementFor(payment: PaymentInput, now: number, attempt: number): Settlement {
  const ecocash = payment.method === 'ecocash'
  return {
    startedAt: iso(now),
    auto: ecocash,
    willFail: ecocash && normaliseEcocash(payment.ecocashNumber ?? '') === DECLINED_ECOCASH,
    attempt,
  }
}

function paymentFor(order: Pick<Order, 'reference' | 'total'>, payment: PaymentInput, attempt: number): Order['payment'] {
  const number = payment.method === 'ecocash' ? normaliseEcocash(payment.ecocashNumber ?? '') : null
  return {
    method: payment.method,
    status: 'pending',
    reference: `${order.reference}-P${attempt}`,
    amount: order.total,
    ...(number && { ecocashNumber: maskPhone(number) }),
  }
}

type CreateInput = {
  ownerId: string
  id: string
  reference: string
  input: NewOrder
  now: number
  simulate?: boolean
  catalogue?: typeof marketplaceItems
}

/** Prices and creates an order awaiting payment, or returns the reasons it can't be priced. */
export function createOrderRecord({ ownerId, id, reference, input, now, simulate = true, catalogue = marketplaceItems }: CreateInput) {
  const priced = priceLines(input.lines, catalogue)
  if (!priced.ok) return priced

  const base = {
    reference,
    total: priced.total,
  }
  const record: OrderRecord = {
    id,
    reference,
    ownerId,
    simulate,
    status: 'awaiting_payment',
    lines: priced.lines.map(({ fulfilment: _fulfilment, ...line }: PricedLine) => line),
    subtotal: priced.subtotal,
    deliveryFee: priced.deliveryFee,
    total: priced.total,
    delivery: normaliseDelivery(input.delivery),
    payment: paymentFor(base, input.payment, 1),
    events: [{ at: iso(now), label: 'Order placed' }],
    ...(input.inMemoryOf?.trim() && { inMemoryOf: input.inMemoryOf.trim().slice(0, 80) }),
    createdAt: iso(now),
    settle: settlementFor(input.payment, now, 1),
  }
  return { ok: true as const, record }
}

function normaliseDelivery(delivery: DeliveryDetails): DeliveryDetails {
  return {
    recipientName: delivery.recipientName.trim(),
    phone: delivery.phone,
    town: delivery.town,
    address: delivery.address.trim(),
    ...(delivery.neededBy && { neededBy: delivery.neededBy }),
    ...(delivery.note?.trim() && { note: delivery.note.trim() }),
  }
}

/** Tries paying again, or with another method, after a failed or abandoned attempt. */
export function startPayment(record: OrderRecord, payment: PaymentInput, now: number): OrderRecord {
  if (record.status !== 'awaiting_payment' && record.status !== 'payment_failed') return record
  const attempt = record.settle.attempt + 1
  return {
    ...record,
    status: 'awaiting_payment',
    payment: paymentFor(record, payment, attempt),
    events: [...record.events, { at: iso(now), label: 'Payment requested' }],
    settle: settlementFor(payment, now, attempt),
  }
}

/** Settles a pending payment. Called by `advanceOrder` for EcoCash, and by the Paynow demo page. */
export function resolvePayment(record: OrderRecord, outcome: 'paid' | 'failed', at: number): OrderRecord {
  if (record.payment.status !== 'pending') return record

  if (outcome === 'paid') {
    return {
      ...record,
      status: 'paid',
      payment: { ...record.payment, status: 'paid', paidAt: iso(at) },
      events: [...record.events, { at: iso(at), label: 'Payment received' }],
    }
  }
  return {
    ...record,
    status: 'payment_failed',
    payment: {
      ...record.payment,
      status: 'failed',
      failureReason: record.payment.method === 'ecocash' ? 'Insufficient funds in the EcoCash wallet' : 'The payment was declined',
    },
    events: [...record.events, { at: iso(at), label: 'Payment didn’t go through' }],
  }
}

const providersLabel = (record: OrderRecord) => {
  const providers = [...new Set(record.lines.map((line) => line.provider).filter(Boolean))]
  return providers.length === 1 ? providers[0]! : 'our providers'
}

/** Brings an order up to date with `now`: answers a pending EcoCash prompt, then moves a paid order along. */
export function advanceOrder(record: OrderRecord, now: number): OrderRecord {
  let current = record

  if (current.payment.status === 'pending' && current.settle.auto) {
    const due = Date.parse(current.settle.startedAt) + PAYMENT_DELAY_MS
    if (now >= due) current = resolvePayment(current, current.settle.willFail ? 'failed' : 'paid', due)
  }

  if (!current.simulate || !current.payment.paidAt) return current

  const paidAt = Date.parse(current.payment.paidAt)
  const stages: [Exclude<OrderStatus, 'awaiting_payment' | 'payment_failed' | 'paid' | 'cancelled'>, string][] = [
    ['confirmed', `Confirmed by ${providersLabel(current)}`],
    ['in_progress', 'Being prepared'],
    ['delivered', 'Delivered'],
  ]
  for (const [status, label] of stages) {
    const due = paidAt + STAGE_DELAYS_MS[status]
    if (rank(current.status) < rank(status) && now >= due) {
      current = { ...current, status, events: [...current.events, { at: iso(due), label }] }
    }
  }
  return current
}

/** What an order can be moved to next by a person (administrator or provider). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['cancelled'],
  payment_failed: ['cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export type TransitionResult =
  | { ok: true; record: OrderRecord }
  | { ok: false; code: 'invalid_transition' }

const MANUAL_LABELS: Record<string, string> = {
  confirmed: 'Confirmed by',
  in_progress: 'Preparation started by',
  delivered: 'Delivered by',
  cancelled: 'Cancelled by',
}

/**
 * A person moves an order along. From then on it is theirs to manage, so the demo timer stops. `actor` is who
 * did it, shown in the order's history ("Confirmed by Msasa Florists").
 */
export function applyOrderStatus(record: OrderRecord, status: OrderStatus, actor: string, now: number): TransitionResult {
  if (!ORDER_TRANSITIONS[record.status].includes(status)) return { ok: false, code: 'invalid_transition' }
  return {
    ok: true,
    record: {
      ...record,
      status,
      simulate: false,
      events: [...record.events, { at: iso(now), label: `${MANUAL_LABELS[status] ?? 'Updated by'} ${actor}` }],
    },
  }
}


type SeedOrder = {
  ownerId: string
  id: string
  reference: string
  ageHours: number
  input: NewOrder
  /** Where the order stands. `payment_failed` leaves the payment declined; the others are paid. */
  status: OrderStatus
  /** Steps after payment, as [hours after payment, label]. */
  steps?: [number, string][]
}

const delivery = (name: string, phone: string, town: string, address: string): DeliveryDetails => ({
  recipientName: name,
  phone,
  town,
  address,
})

const seedOrderRows: SeedOrder[] = [
  {
    ownerId: 'u-moyo',
    id: 'o-seed-1',
    reference: 'FS-1017',
    ageHours: 40 * 24,
    status: 'delivered',
    steps: [
      [1, 'Confirmed by Msasa Florists'],
      [20, 'Being prepared'],
      [26, 'Delivered'],
    ],
    input: {
      lines: [{ itemId: 'wreath-package', options: { size: 'large' }, quantity: 1, personalisation: 'In loving memory of Mama. Forever in our hearts.' }],
      delivery: { ...delivery('St Mary’s Church office', '+263771234567', 'Bulawayo', 'Makokoba, Bulawayo'), neededBy: '2025-09-10' },
      payment: { method: 'ecocash', ecocashNumber: '+263771234567' },
      inMemoryOf: 'Grace Nyathi',
    },
  },
  {
    ownerId: 'u-moyo',
    id: 'o-seed-2',
    reference: 'FS-1038',
    ageHours: 48,
    status: 'in_progress',
    steps: [
      [2, 'Confirmed by Fine Print Zimbabwe'],
      [24, 'Being prepared'],
    ],
    input: {
      lines: [{ itemId: 'stationery-pack', options: { count: '100' }, quantity: 1, personalisation: 'In loving memory of Grace Nyathi' }],
      delivery: delivery('Rutendo Moyo', '+263771234567', 'Bulawayo', '12 Fife Street, Bulawayo'),
      payment: { method: 'paynow' },
    },
  },
  {
    ownerId: 'u-sibanda',
    id: 'o-seed-3',
    reference: 'FS-1035',
    ageHours: 3,
    status: 'paid',
    input: {
      lines: [{ itemId: 'wreath-package', options: { size: 'large' }, quantity: 1, personalisation: 'With deepest sympathy from the Sibanda family' }],
      delivery: delivery('Pastor Elias Ncube', '+263774100001', 'Harare', 'Glen View Methodist Church'),
      payment: { method: 'ecocash', ecocashNumber: '+263774100001' },
    },
  },
  {
    ownerId: 'u-chikore',
    id: 'o-seed-4',
    reference: 'FS-1033',
    ageHours: 30,
    status: 'confirmed',
    steps: [[3, 'Confirmed by Highveld Events']],
    input: {
      lines: [{ itemId: 'marquee-hire', options: { guests: '100' }, quantity: 1 }],
      delivery: delivery('Memory Chikore', '+263774100002', 'Mutare', '14 Herbert Chitepo Street'),
      payment: { method: 'paynow' },
    },
  },
  {
    ownerId: 'u-khumalo',
    id: 'o-seed-5',
    reference: 'FS-1031',
    ageHours: 20,
    status: 'payment_failed',
    input: {
      lines: [{ itemId: 'video-tribute', options: { length: '5' }, quantity: 1 }],
      delivery: delivery('Lindiwe Khumalo', '+263774100006', 'Bulawayo', 'Online delivery'),
      payment: { method: 'ecocash', ecocashNumber: '+263780000000' },
    },
  },
  {
    ownerId: 'u-dlamini',
    id: 'o-seed-6',
    reference: 'FS-1029',
    ageHours: 6 * 24,
    status: 'in_progress',
    steps: [
      [4, 'Confirmed by Bulawayo Stone Works'],
      [3 * 24, 'Preparation started by Bulawayo Stone Works'],
    ],
    input: {
      lines: [{ itemId: 'granite-plaque', options: { material: 'grey', size: 'standard' }, quantity: 1, personalisation: 'Samuel Dlamini\n1950 – 2026' }],
      delivery: delivery('Nomsa Dlamini', '+263774100003', 'Bulawayo', 'Athlone Cemetery'),
      payment: { method: 'ecocash', ecocashNumber: '+263774100003' },
    },
  },
  {
    ownerId: 'u-ndlovu',
    id: 'o-seed-7',
    reference: 'FS-1026',
    ageHours: 8,
    status: 'paid',
    input: {
      lines: [
        { itemId: 'wreath-package', options: { size: 'standard' }, quantity: 1, personalisation: 'From all of us, with love' },
        { itemId: 'stationery-pack', options: { count: '50' }, quantity: 1, personalisation: 'In loving memory of Gogo Ndlovu' },
      ],
      delivery: delivery('Thabo Ndlovu', '+263774100004', 'Gweru', '22 Fourth Street'),
      payment: { method: 'paynow' },
    },
  },
  {
    ownerId: 'u-phiri',
    id: 'o-seed-8',
    reference: 'FS-1022',
    ageHours: 12 * 24,
    status: 'delivered',
    steps: [
      [2, 'Confirmed by Safe Passage Logistics'],
      [48, 'Being prepared'],
      [9 * 24, 'Delivered'],
    ],
    input: {
      lines: [{ itemId: 'repatriation-coordination', options: { region: 'sadc' }, quantity: 1 }],
      delivery: delivery('Tendai Phiri', '+263774100005', 'Harare', 'Beitbridge border post'),
      payment: { method: 'ecocash', ecocashNumber: '+263774100005' },
    },
  },
]

/** Orders the built-in demo customers already have, dated relative to `now`. History doesn't move on its own. */
export function seedOrderRecords(now: number = Date.now()): OrderRecord[] {
  const records: OrderRecord[] = []
  for (const row of seedOrderRows) {
    const placedAt = now - row.ageHours * 3_600_000
    const created = createOrderRecord({
      ownerId: row.ownerId,
      id: row.id,
      reference: row.reference,
      now: placedAt,
      simulate: false,
      input: row.input,
    })
    if (!created.ok) continue

    if (row.status === 'payment_failed') {
      records.push(resolvePayment(created.record, 'failed', placedAt + 60_000))
      continue
    }
    const paidAt = placedAt + 60_000
    const paid = resolvePayment(created.record, 'paid', paidAt)
    records.push({
      ...paid,
      status: row.status,
      events: [...paid.events, ...(row.steps ?? []).map(([hours, label]) => ({ at: iso(paidAt + hours * 3_600_000), label }))],
    })
  }
  return records
}
