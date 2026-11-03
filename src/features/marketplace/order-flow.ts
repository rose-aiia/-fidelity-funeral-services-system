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

const DAY_MS = 86_400_000

/** Orders the built-in demo policyholder already has, dated relative to `now`. */
export function seedOrderRecords(now: number = Date.now()): OrderRecord[] {
  const wreath = createOrderRecord({
    ownerId: 'u-moyo',
    id: 'o-seed-1',
    reference: 'FS-1017',
    now: now - 40 * DAY_MS,
    simulate: false,
    input: {
      lines: [{ itemId: 'wreath-package', options: { size: 'large' }, quantity: 1, personalisation: 'In loving memory of Mama. Forever in our hearts.' }],
      delivery: {
        recipientName: 'St Mary’s Church office',
        phone: '+263771234567',
        town: 'Bulawayo',
        address: 'Makokoba, Bulawayo',
        neededBy: '2025-09-10',
      },
      payment: { method: 'ecocash', ecocashNumber: '+263771234567' },
      inMemoryOf: 'Grace Nyathi',
    },
  })
  const stationery = createOrderRecord({
    ownerId: 'u-moyo',
    id: 'o-seed-2',
    reference: 'FS-1038',
    now: now - 2 * DAY_MS,
    simulate: false,
    input: {
      lines: [{ itemId: 'stationery-pack', options: { count: '100' }, quantity: 1, personalisation: 'In loving memory of Grace Nyathi' }],
      delivery: { recipientName: 'Rutendo Moyo', phone: '+263771234567', town: 'Bulawayo', address: '12 Fife Street, Bulawayo' },
      payment: { method: 'paynow' },
    },
  })
  if (!wreath.ok || !stationery.ok) return []

  const settled = (record: OrderRecord, at: number, status: OrderStatus, steps: [number, string][]): OrderRecord => {
    const paid = resolvePayment(record, 'paid', at + 60_000)
    return {
      ...paid,
      status,
      events: [...paid.events, ...steps.map(([offset, label]) => ({ at: iso(at + offset), label }))],
    }
  }

  return [
    settled(wreath.record, now - 40 * DAY_MS, 'delivered', [
      [3_600_000, 'Confirmed by Msasa Florists'],
      [20 * 3_600_000, 'Being prepared'],
      [26 * 3_600_000, 'Delivered'],
    ]),
    settled(stationery.record, now - 2 * DAY_MS, 'in_progress', [
      [2 * 3_600_000, 'Confirmed by Fine Print Zimbabwe'],
      [DAY_MS, 'Being prepared'],
    ]),
  ]
}
