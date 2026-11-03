import { queryOptions, useQuery } from '@tanstack/react-query'
import { seedInMockMode } from '@/lib/mock'
import { listMarketplaceItems } from './api'
import { marketplaceItems } from './data'

const marketplaceItemsQuery = queryOptions({
  queryKey: ['marketplace', 'items'],
  queryFn: ({ signal }) => listMarketplaceItems(signal),
  initialData: seedInMockMode(marketplaceItems),
})

export const useMarketplaceItems = () => useQuery(marketplaceItemsQuery)
