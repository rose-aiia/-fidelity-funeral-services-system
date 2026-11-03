// What each kind of staff member may see and do, and the numbers on their overview. Pure: shared by the browser
// mock and scripts/mock-api.mjs, and enforced by the server in production. Only relative `.ts` imports.
import { normalisePhone } from '../../lib/phone.ts'
import type { AssistanceRequest } from '../account/data.ts'
import { isOpen, isUrgent, providerActions } from '../account/request-flow.ts'
import { activeCatalogue, providerIdFor } from '../marketplace/catalogue.ts'
import type { Order, OrderStatus } from '../marketplace/data.ts'
import { ORDER_TRANSITIONS } from '../marketplace/order-flow.ts'
import type { AttentionItem, AuditEntry, NewProvider, Overview, OverviewStat, RequestAction } from './data.ts'

export type PortalRole = 'admin' | 'provider'

export { activeCatalogue, providerIdFor }

// ------------------------------------------------------------------ orders

export const orderProviderNames = (order: Pick<Order, 'lines'>): string[] => [
  ...new Set(order.lines.map((line) => line.provider).filter((name): name is string => Boolean(name))),
]

export const orderTouchesProvider = (order: Pick<Order, 'lines'>, providerName: string): boolean =>
  order.lines.some((line) => line.provider === providerName)

/** Other providers are involved too, so only an administrator can move the whole order along. */
export const isSharedOrder = (order: Pick<Order, 'lines'>, providerName?: string): boolean => {
  const names = orderProviderNames(order)
  return providerName ? names.some((name) => name !== providerName) : names.length > 1
}

/** A provider sees only their own lines, and their share of the money (delivery stays with the platform). */
export function scopeOrderForProvider(order: Order, providerName: string): Order {
  const lines = order.lines.filter((line) => line.provider === providerName)
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  return { ...order, lines, subtotal, deliveryFee: 0, total: subtotal }
}

/** The statuses `role` may move this order to right now. A provider only manages orders that are wholly theirs. */
export function orderActionsFor(order: Order, role: PortalRole, providerName?: string): OrderStatus[] {
  const next = ORDER_TRANSITIONS[order.status]
  if (role === 'admin') return next
  if (!providerName || !orderTouchesProvider(order, providerName) || isSharedOrder(order, providerName)) return []
  return next.filter((status) => status !== 'cancelled')
}

/** Money that has actually arrived: paid orders that haven't been cancelled. */
export const earnedValue = (order: Pick<Order, 'status' | 'payment' | 'total'>): number =>
  order.payment.status === 'paid' && order.status !== 'cancelled' ? order.total : 0

// ---------------------------------------------------------------- requests

/** What `role` may do with a request right now. */
export function requestActionsFor(request: AssistanceRequest, role: PortalRole, providerId?: string): RequestAction[] {
  if (role === 'admin') return isOpen(request) ? ['assign', 'completed'] : []
  if (!providerId || request.assignment?.providerId !== providerId) return []
  return providerActions(request)
}

// ----------------------------------------------------------------- overview

type OverviewInput = {
  role: PortalRole
  providerId?: string
  /** For `provider` users: their business name, which decides which lines and orders are theirs. */
  providerName?: string
  /** Already limited to what the caller may see. */
  requests: AssistanceRequest[]
  /** Orders the caller may see, NOT yet scoped: shared orders have to be recognisable. */
  orders: Order[]
  customerCount: number
  activeProviders: number
  /** Ids of the requests that need attention, with the customer's name, for labelling. */
  customerNames: Record<string, string>
  /** Maps a request id to its owner, so attention items can name the family. */
  requestOwners: Record<string, string>
}

const ORDER_STATUSES: OrderStatus[] = ['awaiting_payment', 'payment_failed', 'paid', 'confirmed', 'in_progress', 'delivered', 'cancelled']

const excerpt = (text: string, length = 70) => (text.length > length ? `${text.slice(0, length).trimEnd()}…` : text)

export function buildOverview(input: OverviewInput): Overview {
  const { role, requests } = input
  // A provider's numbers are about their own share; what they can act on excludes orders shared with others.
  const orders = role === 'provider' && input.providerName ? input.orders.map((order) => scopeOrderForProvider(order, input.providerName!)) : input.orders
  const actionable = input.orders.filter((order) => order.status === 'paid' && orderActionsFor(order, role, input.providerName).includes('confirmed'))
  const open = requests.filter(isOpen)
  const urgent = requests.filter(isUrgent)
  const toConfirm = role === 'provider' ? actionable : orders.filter((order) => order.status === 'paid')
  const waiting = requests.filter((request) => request.assignment?.status === 'assigned')
  const accepted = requests.filter((request) => request.assignment?.status === 'accepted')
  const revenue = orders.reduce((sum, order) => sum + earnedValue(order), 0)

  const stats: OverviewStat[] =
    role === 'admin'
      ? [
          { id: 'urgent', label: 'Urgent requests', value: urgent.length, hint: 'Bereavements nobody has taken on', tone: urgent.length > 0 ? 'alert' : 'good' },
          { id: 'open', label: 'Open requests', value: open.length },
          { id: 'to-confirm', label: 'Orders to confirm', value: toConfirm.length, tone: toConfirm.length > 0 ? 'alert' : 'good' },
          { id: 'revenue', label: 'Order revenue', value: revenue, money: true, hint: 'Paid, not cancelled' },
          { id: 'customers', label: 'Customers', value: input.customerCount },
          { id: 'providers', label: 'Active providers', value: input.activeProviders },
        ]
      : [
          { id: 'waiting', label: 'Waiting for you', value: waiting.length, hint: 'Requests to accept or decline', tone: waiting.length > 0 ? 'alert' : 'good' },
          { id: 'in-progress', label: 'In progress', value: accepted.length },
          { id: 'to-confirm', label: 'Orders to confirm', value: toConfirm.length, tone: toConfirm.length > 0 ? 'alert' : 'good' },
          { id: 'delivered', label: 'Orders delivered', value: orders.filter((order) => order.status === 'delivered').length },
          { id: 'revenue', label: 'Your share, paid', value: revenue, money: true },
        ]

  const attention: AttentionItem[] = []
  const family = (id: string) => input.customerNames[input.requestOwners[id] ?? ''] ?? 'A family'

  if (role === 'admin') {
    for (const request of urgent) {
      attention.push({
        id: `urgent-${request.id}`,
        label: `Urgent: ${request.reference} from ${family(request.id)}`,
        detail: request.assignment?.status === 'declined' ? `${request.assignment.providerName} declined it. Assign someone else.` : excerpt(request.message),
        tone: 'alert',
        target: { page: 'requests', id: request.id },
      })
    }
    for (const order of orders.filter((candidate) => candidate.status === 'paid' && isSharedOrder(candidate))) {
      attention.push({
        id: `shared-${order.id}`,
        label: `${order.reference} needs coordinating`,
        detail: `Paid order with ${orderProviderNames(order).join(' and ')}.`,
        tone: 'warning',
        target: { page: 'orders', id: order.id },
      })
    }
    for (const order of orders.filter((candidate) => candidate.status === 'payment_failed')) {
      attention.push({
        id: `failed-${order.id}`,
        label: `${order.reference}: payment failed`,
        detail: order.payment.failureReason ?? 'The customer may need a nudge to try again.',
        tone: 'info',
        target: { page: 'orders', id: order.id },
      })
    }
  } else {
    for (const request of waiting) {
      attention.push({
        id: `waiting-${request.id}`,
        label: `${request.reference} is waiting for your answer`,
        detail: request.assignment?.note ?? excerpt(request.message),
        tone: request.kind === 'bereavement' ? 'alert' : 'warning',
        target: { page: 'requests', id: request.id },
      })
    }
    for (const order of toConfirm) {
      attention.push({
        id: `confirm-${order.id}`,
        label: `${order.reference} is paid and ready to confirm`,
        detail: scopeOrderForProvider(order, input.providerName ?? '').lines.map((line) => line.title).join(', '),
        tone: 'warning',
        target: { page: 'orders', id: order.id },
      })
    }
  }

  return {
    stats,
    attention,
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: orders.filter((order) => order.status === status).length })).filter(
      (entry) => entry.count > 0,
    ),
    requestsOpen: open.length,
  }
}

// ----------------------------------------------------------------- providers

export type FieldErrors<Key extends string> = Partial<Record<Key, string>>

export function validateNewProvider(input: NewProvider): FieldErrors<'name' | 'providerType' | 'contactPerson' | 'phone' | 'email' | 'city'> {
  const errors: FieldErrors<'name' | 'providerType' | 'contactPerson' | 'phone' | 'email' | 'city'> = {}
  if (input.name.trim().length < 2) errors.name = 'Enter the provider’s name.'
  if (!input.providerType.trim()) errors.providerType = 'What kind of provider are they?'
  if (!input.contactPerson.trim()) errors.contactPerson = 'Who is the contact person?'
  if (!normalisePhone(input.phone)) errors.phone = 'Enter a Zimbabwean mobile number, for example 077 123 4567.'
  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address, or leave it blank.'
  if (!input.city.trim()) errors.city = 'Which town or city are they in?'
  return errors
}

// --------------------------------------------------------------------- audit

export function auditEntry(
  id: string,
  now: number,
  actor: { name: string; role: string },
  action: AuditEntry['action'],
  entityType: AuditEntry['entityType'],
  entityRef: string,
  summary: string,
): AuditEntry {
  return { id, at: new Date(now).toISOString(), actorName: actor.name, actorRole: actor.role, action, entityType, entityRef, summary }
}
