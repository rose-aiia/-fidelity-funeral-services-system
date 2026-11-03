import { useMemo } from 'react'
import { useCartLines } from './cart'
import { summariseCart, type CartSummary } from './cart-logic'
import { useMarketplaceItems } from './queries'

/** The cart joined with the catalogue, priced for display. */
export function useCartSummary(): CartSummary & { isPending: boolean } {
  const lines = useCartLines()
  const { data: items, isPending } = useMarketplaceItems()
  const summary = useMemo(() => summariseCart(lines, items ?? []), [lines, items])
  // Until the catalogue arrives every line would look "unavailable", so say nothing yet.
  return items ? { ...summary, isPending } : { ...summary, unavailable: [], isPending }
}
