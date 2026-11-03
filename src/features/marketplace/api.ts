import { env } from '@/lib/env'
import { get } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { marketplaceItems, type MarketplaceItem } from './data'

export function listMarketplaceItems(signal?: AbortSignal): Promise<MarketplaceItem[]> {
  return env.useMock ? mockResponse(marketplaceItems) : get<MarketplaceItem[]>('/marketplace/items', { signal })
}
