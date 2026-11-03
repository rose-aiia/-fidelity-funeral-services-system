// Which products families can buy. Importable from Node (scripts/mock-api.mjs): only relative `.ts` imports.
import { slugify } from '../../lib/slug.ts'
import type { MarketplaceItem } from './data.ts'

/** `Msasa Florists` -> `msasa-florists`. The same id is used in the provider directory and on staff accounts. */
export const providerIdFor = (name: string): string => slugify(name, 'provider')

/** The catalogue families can buy from: products of providers the administrator switched off are hidden. */
export function activeCatalogue(items: MarketplaceItem[], inactiveProviderIds: Iterable<string>): MarketplaceItem[] {
  const inactive = new Set(inactiveProviderIds)
  return items.filter((item) => !item.provider || !inactive.has(providerIdFor(item.provider)))
}
