import { queryOptions, useQuery } from '@tanstack/react-query'
import { seedInMockMode } from '@/lib/mock'
import { listPlans } from './api'
import { plans } from './data'

const plansQuery = queryOptions({
  queryKey: ['plans'],
  queryFn: ({ signal }) => listPlans(signal),
  initialData: seedInMockMode(plans),
})

export const usePlans = () => useQuery(plansQuery)
