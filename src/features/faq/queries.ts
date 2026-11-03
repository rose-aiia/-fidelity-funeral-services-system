import { queryOptions, useQuery } from '@tanstack/react-query'
import { seedInMockMode } from '@/lib/mock'
import { listFaqs } from './api'
import { faqs } from './data'

const faqsQuery = queryOptions({
  queryKey: ['faqs'],
  queryFn: ({ signal }) => listFaqs(signal),
  initialData: seedInMockMode(faqs),
})

export const useFaqs = () => useQuery(faqsQuery)
