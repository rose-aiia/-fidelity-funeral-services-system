import { ApiError } from '@/lib/api-error'
import { writeInactiveProviders } from '@/lib/mock-flags'
import { normalisePhone } from '@/lib/phone'
import type { User } from '@/features/auth'
// The mock server is one server: the staff portal reads and updates the other features' mock tables directly.
// Everything here is loaded on demand, so a live build never fetches it.
import * as authStore from '@/features/auth/mock-store'
import * as accountStore from '@/features/account/mock-store'
import * as shopStore from '@/features/marketplace/mock-store'
import * as memorialStore from '@/features/memorials/mock-store'
import { marketplaceItems, type Order, type OrderStatus } from '@/features/marketplace/data'
import { applyOrderStatus, ORDER_TRANSITIONS, toPublicOrder } from '@/features/marketplace/order-flow'
import { assignRequest, completeRequest, respondToAssignment, sortForTriage, isUrgent } from '@/features/account/request-flow'
import type { AssistanceRequest, RequestStatus } from '@/features/account/data'
import type {
  AdminCustomer,
  AdminCustomerDetail,
  AdminOrder,
  AdminProvider,
  AdminRequest,
  AssignmentResponse,
  AssignRequestInput,
  AuditEntry,
  CustomerRef,
  NewProvider,
  Overview,
  ProviderRecord,
} from './data'
import {
  auditEntry,
  buildOverview,
  earnedValue,
  isSharedOrder,
  orderActionsFor,
  orderTouchesProvider,
  providerIdFor,
  requestActionsFor,
  scopeOrderForProvider,
  validateNewProvider,
  type PortalRole,
} from './logic'
import { seedProviders } from './providers-seed'

const PROVIDERS_KEY = 'fidelity.mock.providers'
const AUDIT_KEY = 'fidelity.mock.audit'
const ADMIN_ACTOR = 'Zimbabwe Funeral Service'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the change lasts until the page is closed.
  }
}

const providers = (): ProviderRecord[] => readJson<ProviderRecord[] | null>(PROVIDERS_KEY, null) ?? seedProviders()

function saveProviders(list: ProviderRecord[]) {
  writeJson(PROVIDERS_KEY, list)
  // The shop reads this flag to hide products of providers that are switched off.
  writeInactiveProviders(list.filter((provider) => !provider.isActive).map((provider) => provider.id))
}

const HOUR_MS = 3_600_000

function seedAudit(): AuditEntry[] {
  const now = Date.now()
  const admin = { name: 'Nomsa Ndlovu', role: 'admin' }
  return [
    auditEntry('a-seed-3', now - 2 * HOUR_MS, admin, 'assign', 'request', 'AR-1049', 'Assigned AR-1049 to Harare Funeral Care'),
    auditEntry('a-seed-2', now - 26 * HOUR_MS, { name: 'Farai Chigumba', role: 'provider' }, 'update', 'order', 'FS-1033', 'Moved FS-1033 to Confirmed'),
    auditEntry('a-seed-1', now - 40 * HOUR_MS, admin, 'update', 'provider', 'Fine Print Zimbabwe', 'Added Fine Print Zimbabwe to the directory'),
  ]
}

const readAudit = (): AuditEntry[] => readJson<AuditEntry[] | null>(AUDIT_KEY, null) ?? seedAudit()
let auditCounter = 0

function record(actor: User, action: AuditEntry['action'], entityType: AuditEntry['entityType'], entityRef: string, summary: string) {
  const entry = auditEntry(`a-${Date.now().toString(36)}-${auditCounter++}`, Date.now(), { name: actor.name, role: actor.role }, action, entityType, entityRef, summary)
  writeJson(AUDIT_KEY, [entry, ...readAudit()].slice(0, 100))
}

const forbidden = () => new ApiError(403, 'forbidden', 'You don’t have access to that')
const notFound = () => new ApiError(404, 'not_found', 'Not found')

type Staff = { user: User; role: PortalRole; provider?: ProviderRecord }

function staffFor(user: User | null): Staff {
  if (!user) throw new ApiError(401, 'unauthenticated', 'Not signed in')
  if (user.role !== 'admin' && user.role !== 'provider') throw forbidden()
  const provider = user.role === 'provider' ? providers().find((candidate) => candidate.id === user.providerId) : undefined
  if (user.role === 'provider' && !provider) throw forbidden()
  return { user, role: user.role, provider }
}

function adminOnly(user: User | null): Staff {
  const staff = staffFor(user)
  if (staff.role !== 'admin') throw forbidden()
  return staff
}

// ------------------------------------------------------------------- data

type World = {
  users: User[]
  requests: { userId: string; request: AssistanceRequest }[]
  orders: { userId: string; order: Order }[]
}

function world(): World {
  return {
    users: authStore.listUsers(),
    requests: accountStore.listAllRequests(),
    orders: shopStore.listAllOrderRecords().map((record) => ({ userId: record.ownerId, order: toPublicOrder(record) })),
  }
}

const ref = (user: User | undefined): CustomerRef => ({ id: user?.id ?? 'unknown', name: user?.name ?? 'Unknown customer', phone: user?.phone ?? '' })

function toAdminRequest(entry: { userId: string; request: AssistanceRequest }, staff: Staff, users: User[]): AdminRequest {
  const user = users.find((candidate) => candidate.id === entry.userId)
  const policy = accountStore.getPolicy(entry.userId)
  return {
    ...entry.request,
    customer: { ...ref(user), ...(policy && { policyNumber: policy.number, policyStatus: policy.status }) },
    urgent: isUrgent(entry.request),
    actions: requestActionsFor(entry.request, staff.role, staff.provider?.id),
  }
}

/** A provider sees only the requests handed to them. */
const visibleRequests = (w: World, staff: Staff) =>
  staff.role === 'admin' ? w.requests : w.requests.filter(({ request }) => request.assignment?.providerId === staff.provider?.id)

function toAdminOrder(entry: { userId: string; order: Order }, staff: Staff, users: User[]): AdminOrder {
  const providerName = staff.provider?.name
  const scoped = staff.role === 'provider' && providerName
  return {
    ...(scoped ? scopeOrderForProvider(entry.order, providerName) : entry.order),
    customer: ref(users.find((candidate) => candidate.id === entry.userId)),
    scoped: Boolean(scoped),
    shared: isSharedOrder(entry.order, providerName),
    actions: orderActionsFor(entry.order, staff.role, providerName),
  }
}

const visibleOrders = (w: World, staff: Staff) =>
  staff.role === 'admin' ? w.orders : w.orders.filter(({ order }) => staff.provider && orderTouchesProvider(order, staff.provider.name))

// ----------------------------------------------------------------- reading

export async function getOverview(user: User | null): Promise<Overview> {
  const staff = staffFor(user)
  const w = world()
  const requests = visibleRequests(w, staff)
  const orders = visibleOrders(w, staff).map(({ order }) => order)
  return buildOverview({
    role: staff.role,
    providerId: staff.provider?.id,
    providerName: staff.provider?.name,
    requests: requests.map(({ request }) => request),
    orders,
    customerCount: w.users.filter((candidate) => candidate.role === 'customer').length,
    activeProviders: providers().filter((provider) => provider.isActive).length,
    customerNames: Object.fromEntries(w.users.map((candidate) => [candidate.id, candidate.name])),
    requestOwners: Object.fromEntries(w.requests.map(({ userId, request }) => [request.id, userId])),
  })
}

export async function listRequests(user: User | null, status?: RequestStatus): Promise<AdminRequest[]> {
  const staff = staffFor(user)
  const w = world()
  const owners = new Map(visibleRequests(w, staff).map((entry) => [entry.request.id, entry]))
  const sorted = sortForTriage([...owners.values()].map((entry) => entry.request))
  return sorted
    .filter((request) => !status || request.status === status)
    .map((request) => toAdminRequest(owners.get(request.id)!, staff, w.users))
}

function findRequest(w: World, staff: Staff, id: string) {
  const entry = visibleRequests(w, staff).find(({ request }) => request.id === id)
  if (!entry) throw notFound()
  return entry
}

export async function getRequest(user: User | null, id: string): Promise<AdminRequest> {
  const staff = staffFor(user)
  const w = world()
  return toAdminRequest(findRequest(w, staff, id), staff, w.users)
}

export async function listOrders(user: User | null, status?: OrderStatus): Promise<AdminOrder[]> {
  const staff = staffFor(user)
  const w = world()
  return visibleOrders(w, staff)
    .filter(({ order }) => !status || order.status === status)
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt))
    .map((entry) => toAdminOrder(entry, staff, w.users))
}

// ----------------------------------------------------------------- changing

export async function assign(user: User | null, id: string, input: AssignRequestInput): Promise<AdminRequest> {
  const staff = adminOnly(user)
  const w = world()
  const entry = findRequest(w, staff, id)

  const provider = providers().find((candidate) => candidate.id === input.providerId)
  if (!provider) throw new ApiError(422, 'validation_failed', 'The request is invalid', { providerId: 'Choose a provider' })
  if (!provider.isActive) throw new ApiError(409, 'provider_inactive', 'That provider is switched off')

  const result = assignRequest(entry.request, { id: provider.id, name: provider.name }, input.note, Date.now())
  if (!result.ok) throw new ApiError(409, result.code, 'This request is already complete')

  accountStore.saveRequest(entry.userId, result.request)
  record(staff.user, 'assign', 'request', entry.request.reference, `Assigned ${entry.request.reference} to ${provider.name}`)
  return toAdminRequest({ userId: entry.userId, request: result.request }, staff, w.users)
}

const RESPONSE_LABEL = { accepted: 'Accepted', declined: 'Declined', completed: 'Completed' } as const

export async function respond(user: User | null, id: string, response: AssignmentResponse): Promise<AdminRequest> {
  const staff = staffFor(user)
  const w = world()
  const entry = findRequest(w, staff, id)

  // Administrators can close a request; only the provider it was handed to can answer it.
  if (staff.role === 'admin' && response.status !== 'completed') throw forbidden()
  const result =
    staff.role === 'admin'
      ? completeRequest(entry.request, Date.now())
      : respondToAssignment(entry.request, response.status, Date.now())
  if (!result.ok) throw new ApiError(409, result.code, 'That isn’t possible right now')

  accountStore.saveRequest(entry.userId, result.request)
  record(staff.user, 'update', 'request', entry.request.reference, `${RESPONSE_LABEL[response.status]} ${entry.request.reference}`)
  return toAdminRequest({ userId: entry.userId, request: result.request }, staff, w.users)
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_failed: 'Payment failed',
  paid: 'Paid',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export async function updateOrder(user: User | null, id: string, status: OrderStatus): Promise<AdminOrder> {
  const staff = staffFor(user)
  const w = world()
  const entry = visibleOrders(w, staff).find(({ order }) => order.id === id)
  if (!entry) throw notFound()

  const legal = ORDER_TRANSITIONS[entry.order.status].includes(status)
  if (!legal) throw new ApiError(409, 'invalid_transition', 'That isn’t possible right now')
  if (!orderActionsFor(entry.order, staff.role, staff.provider?.name).includes(status)) throw forbidden()

  const stored = shopStore.listAllOrderRecords().find((candidate) => candidate.id === id)
  if (!stored) throw notFound()
  const result = applyOrderStatus(stored, status, staff.provider?.name ?? ADMIN_ACTOR, Date.now())
  if (!result.ok) throw new ApiError(409, result.code, 'That isn’t possible right now')

  shopStore.saveOrderRecord(result.record)
  record(staff.user, 'update', 'order', entry.order.reference, `Moved ${entry.order.reference} to ${STATUS_LABEL[status]}`)
  return toAdminOrder({ userId: entry.userId, order: toPublicOrder(result.record) }, staff, w.users)
}

// ----------------------------------------------------------------- customers

function customerRow(user: User, w: World): AdminCustomer {
  const requests = w.requests.filter((entry) => entry.userId === user.id).map((entry) => entry.request)
  const orders = w.orders.filter((entry) => entry.userId === user.id).map((entry) => entry.order)
  const policy = accountStore.getPolicy(user.id)
  return {
    ...ref(user),
    ...(user.email && { email: user.email }),
    ...(policy && { policyNumber: policy.number, policyStatus: policy.status }),
    requestCount: requests.length,
    openRequests: requests.filter((request) => request.status !== 'complete').length,
    orderCount: orders.length,
    memorialCount: memorialStore.listOwned(user.id).length,
    totalSpend: orders.reduce((sum, order) => sum + earnedValue(order), 0),
  }
}

export async function listCustomers(user: User | null): Promise<AdminCustomer[]> {
  adminOnly(user)
  const w = world()
  return w.users.filter((candidate) => candidate.role === 'customer').map((candidate) => customerRow(candidate, w))
}

export async function getCustomer(user: User | null, id: string): Promise<AdminCustomerDetail> {
  adminOnly(user)
  const w = world()
  const customer = w.users.find((candidate) => candidate.id === id && candidate.role === 'customer')
  if (!customer) throw notFound()
  return {
    ...customerRow(customer, w),
    ...(accountStore.getPolicy(id) && { policy: accountStore.getPolicy(id)! }),
    requests: w.requests.filter((entry) => entry.userId === id).map((entry) => entry.request),
    orders: w.orders.filter((entry) => entry.userId === id).map((entry) => entry.order),
    memorials: memorialStore.listOwned(id).map((memorial) => ({
      id: memorial.id,
      name: memorial.name,
      published: memorial.published,
      pendingTributes: memorial.pendingTributes,
    })),
  }
}

// ----------------------------------------------------------------- providers

function providerRow(provider: ProviderRecord, w: World): AdminProvider {
  const assignments = w.requests.map((entry) => entry.request).filter((request) => request.assignment?.providerId === provider.id)
  const orders = w.orders.map((entry) => entry.order).filter((order) => orderTouchesProvider(order, provider.name))
  return {
    ...provider,
    productCount: marketplaceItems.filter((item) => item.provider === provider.name).length,
    openAssignments: assignments.filter((request) => request.assignment?.status === 'assigned' || request.assignment?.status === 'accepted').length,
    completedAssignments: assignments.filter((request) => request.assignment?.status === 'completed').length,
    orderCount: orders.length,
    revenue: orders.reduce((sum, order) => sum + earnedValue(scopeOrderForProvider(order, provider.name)), 0),
  }
}

export async function listProviders(user: User | null): Promise<AdminProvider[]> {
  adminOnly(user)
  const w = world()
  return providers().map((provider) => providerRow(provider, w))
}

export async function createProvider(user: User | null, input: NewProvider): Promise<AdminProvider> {
  const staff = adminOnly(user)
  const errors: Record<string, string> = { ...validateNewProvider(input) } as Record<string, string>
  if (Object.keys(errors).length) throw new ApiError(422, 'validation_failed', 'The provider is invalid', errors)

  const id = providerIdFor(input.name)
  const existing = providers()
  if (existing.some((provider) => provider.id === id)) throw new ApiError(409, 'provider_exists', 'A provider with that name already exists')

  const created: ProviderRecord = {
    id,
    name: input.name.trim(),
    providerType: input.providerType.trim(),
    contactPerson: input.contactPerson.trim(),
    phone: normalisePhone(input.phone) ?? input.phone,
    ...(input.email?.trim() && { email: input.email.trim() }),
    city: input.city.trim(),
    province: input.province?.trim() || input.city.trim(),
    ...(input.description?.trim() && { description: input.description.trim() }),
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  saveProviders([...existing, created])
  record(staff.user, 'create', 'provider', created.name, `Added ${created.name} to the directory`)
  return providerRow(created, world())
}

export async function updateProvider(user: User | null, id: string, isActive: boolean): Promise<AdminProvider> {
  const staff = adminOnly(user)
  const list = providers()
  const existing = list.find((provider) => provider.id === id)
  if (!existing) throw notFound()

  const updated = { ...existing, isActive }
  saveProviders(list.map((provider) => (provider.id === id ? updated : provider)))
  record(staff.user, 'update', 'provider', updated.name, `${isActive ? 'Switched on' : 'Switched off'} ${updated.name}`)
  return providerRow(updated, world())
}

// ------------------------------------------------------------------ activity

export async function listActivity(user: User | null): Promise<AuditEntry[]> {
  adminOnly(user)
  return readAudit()
}
