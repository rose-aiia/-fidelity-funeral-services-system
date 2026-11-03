import { readSessionUser } from '@/features/auth'
import type { RequestStatus } from '@/features/account/data'
import type { OrderStatus } from '@/features/marketplace/data'
import { env } from '@/lib/env'
import { get, patch, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import type {
  AdminCustomer,
  AdminCustomerDetail,
  AdminOrder,
  AdminProvider,
  AdminRequest,
  AssignmentResponse,
  AssignRequestInput,
  AuditEntry,
  NewProvider,
  Overview,
} from './data'

const MOCK_READ_LATENCY_MS = 300
const MOCK_WRITE_LATENCY_MS = 450

const mockServer = () => import('./mock-store')

/** Mock mode answers as whoever is signed in; the real server decides that from the session cookie. */
const me = () => readSessionUser()

const enc = encodeURIComponent
const query = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value)
  return entries.length ? `?${new URLSearchParams(entries as [string, string][])}` : ''
}

export async function getOverview(signal?: AbortSignal): Promise<Overview> {
  if (!env.useMock) return get<Overview>('/admin/overview', { signal })
  const server = await mockServer()
  return mockResponse(await server.getOverview(me()), MOCK_READ_LATENCY_MS)
}

export async function listRequests(status?: RequestStatus, signal?: AbortSignal): Promise<AdminRequest[]> {
  if (!env.useMock) return get<AdminRequest[]>(`/admin/requests${query({ status })}`, { signal })
  const server = await mockServer()
  return mockResponse(await server.listRequests(me(), status), MOCK_READ_LATENCY_MS)
}

export async function assignRequest(id: string, input: AssignRequestInput): Promise<AdminRequest> {
  if (!env.useMock) return post<AdminRequest>(`/admin/requests/${enc(id)}/assignment`, input)
  const server = await mockServer()
  return mockResponse(await server.assign(me(), id, input), MOCK_WRITE_LATENCY_MS)
}

export async function respondToRequest(id: string, response: AssignmentResponse): Promise<AdminRequest> {
  if (!env.useMock) return patch<AdminRequest>(`/admin/requests/${enc(id)}/assignment`, response)
  const server = await mockServer()
  return mockResponse(await server.respond(me(), id, response), MOCK_WRITE_LATENCY_MS)
}

export async function listOrders(status?: OrderStatus, signal?: AbortSignal): Promise<AdminOrder[]> {
  if (!env.useMock) return get<AdminOrder[]>(`/admin/orders${query({ status })}`, { signal })
  const server = await mockServer()
  return mockResponse(await server.listOrders(me(), status), MOCK_READ_LATENCY_MS)
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  if (!env.useMock) return patch<AdminOrder>(`/admin/orders/${enc(id)}`, { status })
  const server = await mockServer()
  return mockResponse(await server.updateOrder(me(), id, status), MOCK_WRITE_LATENCY_MS)
}

export async function listCustomers(signal?: AbortSignal): Promise<AdminCustomer[]> {
  if (!env.useMock) return get<AdminCustomer[]>('/admin/customers', { signal })
  const server = await mockServer()
  return mockResponse(await server.listCustomers(me()), MOCK_READ_LATENCY_MS)
}

export async function getCustomer(id: string, signal?: AbortSignal): Promise<AdminCustomerDetail> {
  if (!env.useMock) return get<AdminCustomerDetail>(`/admin/customers/${enc(id)}`, { signal })
  const server = await mockServer()
  return mockResponse(await server.getCustomer(me(), id), MOCK_READ_LATENCY_MS)
}

export async function listProviders(signal?: AbortSignal): Promise<AdminProvider[]> {
  if (!env.useMock) return get<AdminProvider[]>('/admin/providers', { signal })
  const server = await mockServer()
  return mockResponse(await server.listProviders(me()), MOCK_READ_LATENCY_MS)
}

export async function createProvider(input: NewProvider): Promise<AdminProvider> {
  if (!env.useMock) return post<AdminProvider>('/admin/providers', input)
  const server = await mockServer()
  return mockResponse(await server.createProvider(me(), input), MOCK_WRITE_LATENCY_MS)
}

export async function setProviderActive(id: string, isActive: boolean): Promise<AdminProvider> {
  if (!env.useMock) return patch<AdminProvider>(`/admin/providers/${enc(id)}`, { isActive })
  const server = await mockServer()
  return mockResponse(await server.updateProvider(me(), id, isActive), MOCK_WRITE_LATENCY_MS)
}

export async function listActivity(signal?: AbortSignal): Promise<AuditEntry[]> {
  if (!env.useMock) return get<AuditEntry[]>('/admin/activity', { signal })
  const server = await mockServer()
  return mockResponse(await server.listActivity(me()), MOCK_READ_LATENCY_MS)
}
