import { env } from '@/lib/env'
import { get, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { plans, type Plan } from './data'
import { estimateTotal, type ServiceType, type Town } from './pricing'

export type QuoteRequest = {
  planId: string
  serviceType: ServiceType
  town: Town
}

export type QuoteReceipt = {
  id: string
  /** Human-readable reference a family can quote when they phone the provider. */
  reference: string
  /** Authoritative total computed by the server; the client-side figure is only a preview. */
  estimatedTotal: number
}

const MOCK_SUBMIT_LATENCY_MS = 600

export function listPlans(signal?: AbortSignal): Promise<Plan[]> {
  return env.useMock ? mockResponse(plans) : get<Plan[]>('/plans', { signal })
}

export function submitQuoteRequest(request: QuoteRequest): Promise<QuoteReceipt> {
  if (!env.useMock) return post<QuoteReceipt>('/quote-requests', request)

  const plan = plans.find((candidate) => candidate.id === request.planId)
  if (!plan) return Promise.reject(new Error(`Unknown plan "${request.planId}"`))

  const reference = `SAMPLE-${Math.floor(1000 + Math.random() * 9000)}`
  return mockResponse(
    { id: reference.toLowerCase(), reference, estimatedTotal: estimateTotal(plan, request.town, request.serviceType) },
    MOCK_SUBMIT_LATENCY_MS,
  )
}
