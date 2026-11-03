// Types for the staff portal. Importable from Node (scripts/mock-api.mjs): only relative `.ts` imports.
import type { AssistanceRequest, Policy } from '../account/data.ts'
import type { Order, OrderStatus } from '../marketplace/data.ts'

/** A funeral service provider or marketplace partner, as the administrator keeps them. */
export type ProviderRecord = {
  id: string
  name: string
  /** What they do: `Funeral director`, `Florist`, `Monument mason`... */
  providerType: string
  contactPerson: string
  /** E.164. */
  phone: string
  email?: string
  city: string
  province: string
  description?: string
  /** Inactive providers receive no new assignments and their products are hidden from the marketplace. */
  isActive: boolean
  /** ISO timestamp. */
  createdAt: string
}

export type NewProvider = {
  name: string
  providerType: string
  contactPerson: string
  phone: string
  email?: string
  city: string
  province?: string
  description?: string
}

export type ProviderUpdate = { isActive: boolean }

export type AdminProvider = ProviderRecord & {
  productCount: number
  /** Requests handed to them that they haven't finished. */
  openAssignments: number
  completedAssignments: number
  /** Orders that include one of their products. */
  orderCount: number
  /** Paid value of their share of orders, whole US dollars. */
  revenue: number
}

export type CustomerRef = { id: string; name: string; phone: string }

export type RequestAction = 'assign' | 'accepted' | 'declined' | 'completed'

export type AdminRequest = AssistanceRequest & {
  customer: CustomerRef & { policyNumber?: string; policyStatus?: Policy['status'] }
  /** Nobody has taken it on, and a family has lost someone. */
  urgent: boolean
  /** What the person asking may do with it right now. */
  actions: RequestAction[]
}

export type AssignRequestInput = { providerId: string; note?: string }

export type AssignmentResponse = { status: 'accepted' | 'declined' | 'completed' }

export type AdminOrder = Order & {
  customer: CustomerRef
  /** Lines and totals show only the asking provider's share of the order. */
  scoped: boolean
  /** The statuses the person asking may move it to right now. */
  actions: OrderStatus[]
  /** Other providers are involved, so the administrator coordinates it. */
  shared: boolean
}

export type OrderStatusInput = { status: OrderStatus }

export type AdminCustomer = CustomerRef & {
  email?: string
  policyNumber?: string
  policyStatus?: Policy['status']
  requestCount: number
  openRequests: number
  orderCount: number
  memorialCount: number
  /** Paid orders, whole US dollars. */
  totalSpend: number
}

export type AdminCustomerDetail = AdminCustomer & {
  policy?: Policy
  requests: AssistanceRequest[]
  orders: Order[]
  memorials: { id: string; name: string; published: boolean; pendingTributes: number }[]
}

export type AuditEntry = {
  id: string
  /** ISO timestamp. */
  at: string
  actorName: string
  actorRole: string
  action: 'create' | 'update' | 'assign'
  entityType: 'request' | 'order' | 'provider'
  /** What it is, for people: `AR-1051`, `FS-1035`, `Harare Funeral Care`. */
  entityRef: string
  summary: string
}

export type PortalPage = 'overview' | 'requests' | 'orders' | 'customers' | 'providers' | 'activity'

export type OverviewStat = {
  id: string
  label: string
  value: number
  /** Show the value as money. */
  money?: boolean
  hint?: string
  tone?: 'default' | 'alert' | 'good'
}

export type AttentionItem = {
  id: string
  label: string
  detail: string
  tone: 'alert' | 'warning' | 'info'
  /** Where to go to deal with it. */
  target: { page: PortalPage; id?: string }
}

export type Overview = {
  stats: OverviewStat[]
  attention: AttentionItem[]
  ordersByStatus: { status: OrderStatus; count: number }[]
  requestsOpen: number
}
