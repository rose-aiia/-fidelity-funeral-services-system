import { ApiError } from '@/lib/api-error'
import { readInactiveProviders } from '@/lib/mock-flags'
import { activeCatalogue } from './catalogue'
import { marketplaceItems, type NewOrder, type Order, type PaymentInput } from './data'
import {
  advanceOrder,
  createOrderRecord,
  resolvePayment,
  seedOrderRecords,
  startPayment,
  toPublicOrder,
  type OrderRecord,
} from './order-flow'
import { notifyOrder } from '@/features/alerts/mock-triggers'
import { hasErrors, validateDelivery, validatePayment } from './validation'

// The "server" behind order endpoints in mock mode. Orders persist in localStorage, seeded with a short
// history for the demo policyholder. The lifecycle itself lives in order-flow.ts, shared with mock-api.mjs.
// Loaded on demand (dynamic import) so a live build never fetches it.

const STORE_KEY = 'fidelity.mock.orders'

function read(): OrderRecord[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as OrderRecord[]
  } catch {
    // Unreadable storage: fall through to the seed.
  }
  return seedOrderRecords()
}

function write(records: OrderRecord[]): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(records))
  } catch {
    // Storage unavailable: orders only last for this page view.
  }
}

const notFound = () => new ApiError(404, 'not_found', 'No such order')

/** Brings every order up to date with the clock and saves any that moved. */
function load(): OrderRecord[] {
  const now = Date.now()
  const stored = read()
  const advanced = stored.map((record) => advanceOrder(record, now))
  if (advanced.some((record, index) => record !== stored[index])) {
    write(advanced)
    advanced.forEach((record, index) => { if (record.status !== stored[index].status) notifyOrder(record.ownerId, record) })
  }
  return advanced
}

const mine = (records: OrderRecord[], userId: string) => records.filter((record) => record.ownerId === userId)

function nextReference(records: OrderRecord[]): string {
  const highest = records.reduce((max, record) => Math.max(max, Number(record.reference.replace(/\D/g, '')) || 0), 1038)
  return `FS-${highest + 1}`
}

export function listOrders(userId: string): Order[] {
  return mine(load(), userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublicOrder)
}

export function getOrder(userId: string, id: string): Order {
  const record = mine(load(), userId).find((candidate) => candidate.id === id)
  if (!record) throw notFound()
  return toPublicOrder(record)
}

export function createOrder(userId: string, input: NewOrder): Order {
  const errors: Record<string, string> = {}
  for (const [field, message] of Object.entries(validateDelivery(input.delivery))) if (message) errors[`delivery.${field}`] = message
  for (const [field, message] of Object.entries(validatePayment(input.payment))) if (message) errors[`payment.${field}`] = message
  if (hasErrors(errors)) throw new ApiError(422, 'validation_failed', 'The order is invalid', errors)

  const records = load()
  const created = createOrderRecord({
    ownerId: userId,
    id: `o-${Date.now().toString(36)}`,
    reference: nextReference(records),
    input,
    now: Date.now(),
    catalogue: activeCatalogue(marketplaceItems, readInactiveProviders()),
  })
  if (!created.ok) throw new ApiError(422, 'validation_failed', 'The order is invalid', created.details)

  write([created.record, ...records])
  return toPublicOrder(created.record)
}

export function payOrder(userId: string, id: string, payment: PaymentInput): Order {
  const errors = validatePayment(payment)
  if (hasErrors(errors)) throw new ApiError(422, 'validation_failed', 'The payment is invalid', errors)

  const records = load()
  const record = mine(records, userId).find((candidate) => candidate.id === id)
  if (!record) throw notFound()
  if (record.status !== 'awaiting_payment' && record.status !== 'payment_failed') {
    throw new ApiError(409, 'order_not_payable', 'This order can’t be paid right now')
  }

  const next = startPayment(record, payment, Date.now())
  if (next.status !== record.status) notifyOrder(userId, next)
  write(records.map((candidate) => (candidate.id === id ? next : candidate)))
  return toPublicOrder(next)
}

/** Stands in for the Paynow hosted page: the shopper pays or cancels there, and the result comes back. */
export function resolveHostedPayment(userId: string, id: string, outcome: 'paid' | 'failed'): Order {
  const records = load()
  const record = mine(records, userId).find((candidate) => candidate.id === id)
  if (!record) throw notFound()

  const next = resolvePayment(record, outcome, Date.now())
  if (next.status !== record.status) notifyOrder(userId, next)
  write(records.map((candidate) => (candidate.id === id ? next : candidate)))
  return toPublicOrder(next)
}

// --- the staff portal reads and updates every customer's orders (the mock server is one server) ---

/** Every order, brought up to date with the clock. For the staff portal only. */
export const listAllOrderRecords = (): OrderRecord[] => load()

export function saveOrderRecord(record: OrderRecord): void {
  write(load().map((candidate) => (candidate.id === record.id ? record : candidate)))
}
