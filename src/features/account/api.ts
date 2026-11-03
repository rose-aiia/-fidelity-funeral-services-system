import { ApiError } from '@/lib/api-error'
import { env } from '@/lib/env'
import { get, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { readSessionUser } from '@/features/auth'
import type { AssistanceRequest, LinkPolicyInput, NewRequest, Policy } from './data'

const MOCK_READ_LATENCY_MS = 600
const MOCK_WRITE_LATENCY_MS = 700

const mockServer = () => import('./mock-store')

function mockUserId(): string {
  const user = readSessionUser()
  if (!user) throw new ApiError(401, 'unauthenticated', 'Not signed in')
  return user.id
}

/** The signed-in user's policy, or null if they haven't linked one. */
export async function getPolicy(signal?: AbortSignal): Promise<Policy | null> {
  if (!env.useMock) return (await get<Policy | undefined>('/me/policy', { signal })) ?? null
  const server = await mockServer()
  return mockResponse(server.getPolicy(mockUserId()), MOCK_READ_LATENCY_MS)
}

export async function linkPolicy(input: LinkPolicyInput): Promise<Policy> {
  if (!env.useMock) return post<Policy>('/me/policy', input)
  const server = await mockServer()
  const policy = server.linkPolicy(mockUserId(), input.policyNumber, input.idNumber)
  return mockResponse(policy, MOCK_WRITE_LATENCY_MS)
}

export async function listRequests(signal?: AbortSignal): Promise<AssistanceRequest[]> {
  if (!env.useMock) return get<AssistanceRequest[]>('/me/requests', { signal })
  const server = await mockServer()
  return mockResponse(server.listRequests(mockUserId()), MOCK_READ_LATENCY_MS)
}

export async function createRequest(input: NewRequest): Promise<AssistanceRequest> {
  if (!env.useMock) return post<AssistanceRequest>('/me/requests', input)
  const server = await mockServer()
  return mockResponse(server.createRequest(mockUserId(), input), MOCK_WRITE_LATENCY_MS)
}
