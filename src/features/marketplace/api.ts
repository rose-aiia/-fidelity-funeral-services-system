import { readSessionUser } from '@/features/auth'
import { ApiError } from '@/lib/api-error'
import { env } from '@/lib/env'
import { get, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { marketplaceItems, type MarketplaceItem, type NewOrder, type Order, type PaymentInput } from './data'

const MOCK_READ_LATENCY_MS = 350
const MOCK_WRITE_LATENCY_MS = 700

const mockServer = () => import('./mock-store')

function mockUserId(): string {
  const user = readSessionUser()
  if (!user) throw new ApiError(401, 'unauthenticated', 'Not signed in')
  return user.id
}

const orderPath = (id: string) => `/me/orders/${encodeURIComponent(id)}`

export function listMarketplaceItems(signal?: AbortSignal): Promise<MarketplaceItem[]> {
  return env.useMock ? mockResponse(marketplaceItems) : get<MarketplaceItem[]>('/marketplace/items', { signal })
}

export async function listOrders(signal?: AbortSignal): Promise<Order[]> {
  if (!env.useMock) return get<Order[]>('/me/orders', { signal })
  const server = await mockServer()
  return mockResponse(server.listOrders(mockUserId()), MOCK_READ_LATENCY_MS)
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  if (!env.useMock) return get<Order>(orderPath(id), { signal })
  const server = await mockServer()
  return mockResponse(server.getOrder(mockUserId(), id), 120)
}

export async function createOrder(input: NewOrder): Promise<Order> {
  if (!env.useMock) return post<Order>('/me/orders', input)
  const server = await mockServer()
  return mockResponse(server.createOrder(mockUserId(), input), MOCK_WRITE_LATENCY_MS)
}

export async function payOrder(id: string, payment: PaymentInput): Promise<Order> {
  if (!env.useMock) return post<Order>(`${orderPath(id)}/payment`, payment)
  const server = await mockServer()
  return mockResponse(server.payOrder(mockUserId(), id, payment), MOCK_WRITE_LATENCY_MS)
}

/** Mock mode only: the outcome the shopper chose on the simulated Paynow page. */
export async function resolveHostedPayment(id: string, outcome: 'paid' | 'failed'): Promise<Order> {
  if (!env.useMock) throw new ApiError(404, 'not_found', 'There is no simulated payment page in live mode')
  const server = await mockServer()
  return mockResponse(server.resolveHostedPayment(mockUserId(), id, outcome), 500)
}
