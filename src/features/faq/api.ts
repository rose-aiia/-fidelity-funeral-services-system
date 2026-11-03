import { env } from '@/lib/env'
import { get } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { faqs, type FaqItem } from './data'

export function listFaqs(signal?: AbortSignal): Promise<FaqItem[]> {
  return env.useMock ? mockResponse(faqs) : get<FaqItem[]>('/faqs', { signal })
}
