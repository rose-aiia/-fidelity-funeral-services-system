import { describe, expect, it } from 'vitest'
import { addLine, lineKey, removeLine, setLineQuantity, summariseCart } from './cart-logic'
import { MAX_QUANTITY, marketplaceItems, type CartLine, type NewOrder } from './data'
import {
  advanceOrder,
  createOrderRecord,
  DECLINED_ECOCASH,
  PAYMENT_DELAY_MS,
  resolvePayment,
  seedOrderRecords,
  startPayment,
  STAGE_DELAYS_MS,
  toPublicOrder,
} from './order-flow'
import { DELIVERY_FEE, priceLines, resolveOptions } from './pricing'
import { hasErrors, normaliseEcocash, validateDelivery, validatePayment } from './validation'

const item = (id: string) => marketplaceItems.find((candidate) => candidate.id === id)!
let counter = 0
const newId = () => `id-${counter++}`

describe('options and pricing', () => {
  it('fills in defaults and adds option deltas', () => {
    const plaque = item('granite-plaque')
    expect(resolveOptions(plaque, {})?.delta).toBe(0)
    expect(resolveOptions(plaque, { material: 'marble', size: 'large' })).toMatchObject({
      delta: 250,
      labels: ['White marble', 'Large, 60 × 40 cm'],
    })
  })

  it('rejects an option the item does not offer', () => {
    expect(resolveOptions(item('granite-plaque'), { material: 'gold' })).toBeNull()
    expect(resolveOptions(item('granite-plaque'), { colour: 'red' })).toBeNull()
  })

  it('prices a delivery order with the delivery fee', () => {
    const result = priceLines([{ itemId: 'wreath-package', options: { size: 'large' }, quantity: 2 }], marketplaceItems)
    expect(result).toMatchObject({ ok: true, subtotal: 480, deliveryFee: DELIVERY_FEE, total: 505 })
  })

  it('does not charge delivery when everything is a service', () => {
    const result = priceLines([{ itemId: 'marquee-hire', options: {}, quantity: 1 }], marketplaceItems)
    expect(result).toMatchObject({ ok: true, deliveryFee: 0, total: 680 })
  })

  it('refuses tampered or incomplete lines', () => {
    const bad = (line: object) => priceLines([{ options: {}, quantity: 1, ...line } as never], marketplaceItems)
    expect(bad({ itemId: 'nope' })).toMatchObject({ ok: false })
    expect(bad({ itemId: 'wreath-package', quantity: MAX_QUANTITY + 1 })).toMatchObject({ ok: false })
    expect(bad({ itemId: 'wreath-package', quantity: 1.5 })).toMatchObject({ ok: false })
    expect(bad({ itemId: 'granite-plaque' })).toMatchObject({ ok: false }) // engraving wording is required
    expect(bad({ itemId: 'marquee-hire', personalisation: 'hello' })).toMatchObject({ ok: false })
    expect(priceLines([], marketplaceItems)).toMatchObject({ ok: false })
  })
})

describe('cart', () => {
  const base = { itemId: 'wreath-package', options: { size: 'standard' }, quantity: 1 }

  it('merges identical lines and keeps different ones apart', () => {
    let lines: CartLine[] = []
    lines = addLine(lines, base, newId)
    lines = addLine(lines, base, newId)
    lines = addLine(lines, { ...base, options: { size: 'large' } }, newId)
    lines = addLine(lines, { ...base, personalisation: 'With love' }, newId)
    expect(lines.map((line) => line.quantity)).toEqual([2, 1, 1])
  })

  it('treats option order as irrelevant', () => {
    expect(lineKey({ itemId: 'x', options: { a: '1', b: '2' } })).toBe(lineKey({ itemId: 'x', options: { b: '2', a: '1' } }))
  })

  it('caps quantity, and removes a line when it reaches zero', () => {
    let lines = addLine([], { ...base, quantity: 99 }, newId)
    expect(lines[0]!.quantity).toBe(MAX_QUANTITY)
    lines = setLineQuantity(lines, lines[0]!.id, 0)
    expect(lines).toEqual([])
    expect(removeLine([{ id: 'a', ...base }], 'a')).toEqual([])
  })

  it('summarises with delivery, and flags lines whose item is gone', () => {
    const lines: CartLine[] = [
      { id: '1', itemId: 'wreath-package', options: { size: 'premium' }, quantity: 1 },
      { id: '2', itemId: 'discontinued', options: {}, quantity: 1 },
    ]
    const summary = summariseCart(lines, marketplaceItems)
    expect(summary).toMatchObject({ count: 1, subtotal: 320, deliveryFee: DELIVERY_FEE, total: 345 })
    expect(summary.unavailable.map((line) => line.id)).toEqual(['2'])
  })
})

describe('validation', () => {
  const delivery = { recipientName: 'Rutendo Moyo', phone: '0771234567', town: 'Bulawayo', address: '12 Fife Street' }

  it('accepts good delivery details and flags bad ones', () => {
    expect(hasErrors(validateDelivery(delivery))).toBe(false)
    const errors = validateDelivery({ ...delivery, phone: '123', town: 'Atlantis', address: 'x' })
    expect(Object.keys(errors).sort()).toEqual(['address', 'phone', 'town'])
  })

  it('rejects a needed-by date in the past', () => {
    const now = new Date('2026-06-10T00:00:00Z')
    expect(validateDelivery({ ...delivery, neededBy: '2026-06-01' }, now).neededBy).toBeDefined()
    expect(validateDelivery({ ...delivery, neededBy: '2026-06-10' }, now).neededBy).toBeUndefined()
  })

  it('EcoCash needs an Econet number', () => {
    expect(normaliseEcocash('077 123 4567')).toBe('+263771234567')
    expect(normaliseEcocash('0712345678')).toBeNull() // NetOne
    expect(hasErrors(validatePayment({ method: 'paynow' }))).toBe(false)
    expect(validatePayment({ method: 'ecocash', ecocashNumber: '071' }).ecocashNumber).toBeDefined()
    expect(validatePayment({ method: 'cash' as never }).method).toBeDefined()
  })
})

describe('order lifecycle', () => {
  const T0 = Date.parse('2026-06-01T10:00:00Z')
  const input = (ecocashNumber = '0771234567'): NewOrder => ({
    lines: [{ itemId: 'wreath-package', options: { size: 'standard' }, quantity: 1, personalisation: 'With love' }],
    delivery: { recipientName: 'Rutendo Moyo', phone: '+263771234567', town: 'Harare', address: 'St Mary’s Church' },
    payment: { method: 'ecocash', ecocashNumber },
  })
  const create = (ecocashNumber?: string) => {
    const created = createOrderRecord({ ownerId: 'u1', id: 'o1', reference: 'FS-2000', input: input(ecocashNumber), now: T0 })
    if (!created.ok) throw new Error('should price')
    return created.record
  }

  it('starts awaiting payment with a masked wallet number and server-computed totals', () => {
    const order = create()
    expect(order).toMatchObject({ status: 'awaiting_payment', subtotal: 180, deliveryFee: 25, total: 205 })
    expect(order.payment).toMatchObject({ status: 'pending', method: 'ecocash', ecocashNumber: '+263 77 ••• 4567', amount: 205 })
  })

  it('never leaks server-only fields', () => {
    const keys = Object.keys(toPublicOrder(create()))
    expect(keys).not.toContain('ownerId')
    expect(keys).not.toContain('settle')
    expect(keys).not.toContain('simulate')
  })

  it('stays pending until the EcoCash prompt is answered, then pays', () => {
    const order = create()
    expect(advanceOrder(order, T0 + PAYMENT_DELAY_MS - 1).payment.status).toBe('pending')
    const paid = advanceOrder(order, T0 + PAYMENT_DELAY_MS)
    expect(paid).toMatchObject({ status: 'paid', payment: { status: 'paid' } })
    expect(paid.events.map((event) => event.label)).toEqual(['Order placed', 'Payment received'])
  })

  it('walks a paid order through confirmed, in progress and delivered', () => {
    const paidAt = T0 + PAYMENT_DELAY_MS
    const order = create()
    expect(advanceOrder(order, paidAt + STAGE_DELAYS_MS.confirmed).status).toBe('confirmed')
    expect(advanceOrder(order, paidAt + STAGE_DELAYS_MS.in_progress).status).toBe('in_progress')
    const done = advanceOrder(order, paidAt + STAGE_DELAYS_MS.delivered + 1000)
    expect(done.status).toBe('delivered')
    expect(done.events.map((event) => event.label)).toEqual([
      'Order placed',
      'Payment received',
      'Confirmed by Msasa Florists',
      'Being prepared',
      'Delivered',
    ])
  })

  it('fails the declined number, and allows paying again with another', () => {
    const failed = advanceOrder(create(DECLINED_ECOCASH), T0 + PAYMENT_DELAY_MS)
    expect(failed).toMatchObject({ status: 'payment_failed', payment: { status: 'failed' } })
    expect(failed.payment.failureReason).toMatch(/Insufficient/)

    const retried = startPayment(failed, { method: 'ecocash', ecocashNumber: '0771234567' }, T0 + 10_000)
    expect(retried).toMatchObject({ status: 'awaiting_payment', payment: { status: 'pending', reference: 'FS-2000-P2' } })
    expect(advanceOrder(retried, T0 + 10_000 + PAYMENT_DELAY_MS).status).toBe('paid')
  })

  it('cannot restart payment on a paid order, or resolve one that is not pending', () => {
    const paid = advanceOrder(create(), T0 + PAYMENT_DELAY_MS)
    expect(startPayment(paid, { method: 'paynow' }, T0 + 99_999)).toBe(paid)
    expect(resolvePayment(paid, 'failed', T0 + 99_999)).toBe(paid)
  })

  it('Paynow waits for the hosted page instead of settling by itself', () => {
    const created = createOrderRecord({
      ownerId: 'u1',
      id: 'o2',
      reference: 'FS-2001',
      input: { ...input(), payment: { method: 'paynow' } },
      now: T0,
    })
    if (!created.ok) throw new Error('should price')
    expect(advanceOrder(created.record, T0 + 60_000).payment.status).toBe('pending')
    expect(resolvePayment(created.record, 'paid', T0 + 61_000).status).toBe('paid')
  })

  it('seeded history is stable: it does not move on its own', () => {
    const [delivered, inProgress] = seedOrderRecords(T0)
    expect([delivered!.status, inProgress!.status]).toEqual(['delivered', 'in_progress'])
    expect(advanceOrder(inProgress!, T0 + 10 * 86_400_000).status).toBe('in_progress')
  })
})
