import type { ServiceType, Town } from './pricing'

export type QuoteRequest = {
  planId: string
  serviceType: ServiceType
  town: Town
  estimatedTotal: number
}

/**
 * Prototype stand-in for the quote endpoint. Swap the body for a real `fetch` call
 * and the form keeps working: it only depends on this signature.
 */
export async function submitQuoteRequest(_request: QuoteRequest): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 600))
}
