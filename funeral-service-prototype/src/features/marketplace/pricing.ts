// Pricing rules. The server is authoritative; the browser uses the same functions to preview a total.
// Importable from Node (scripts/mock-api.mjs): only relative `.ts` imports.
import { MAX_QUANTITY, type MarketplaceItem, type OrderLine, type OrderLineInput } from './data.ts'

/** Added once to an order that contains anything physical. */
export const DELIVERY_FEE = 25

export type ResolvedOptions = {
  /** `Black granite`, `Large, 60 × 40 cm`... in group order. */
  labels: string[]
  /** Sum of the chosen options' price deltas. */
  delta: number
  /** Option ids as they should be stored: the chosen one, or the group's default when none was sent. */
  selected: Record<string, string>
}

/** Resolves chosen options against an item, filling in defaults. Returns null when a choice isn't offered. */
export function resolveOptions(item: MarketplaceItem, chosen: Record<string, string>): ResolvedOptions | null {
  const groups = item.options ?? []
  if (Object.keys(chosen).some((groupId) => !groups.some((group) => group.id === groupId))) return null

  const labels: string[] = []
  const selected: Record<string, string> = {}
  let delta = 0
  for (const group of groups) {
    const choice = group.choices.find((candidate) => candidate.id === (chosen[group.id] ?? group.choices[0]?.id))
    if (!choice) return null
    labels.push(choice.label)
    selected[group.id] = choice.id
    delta += choice.priceDelta
  }
  return { labels, delta, selected }
}

export function unitPrice(item: MarketplaceItem, resolved: ResolvedOptions): number {
  return item.price + resolved.delta
}

export type PricedLine = OrderLine & { fulfilment: NonNullable<MarketplaceItem['fulfilment']> }

export type PricingResult =
  | { ok: true; lines: PricedLine[]; subtotal: number; deliveryFee: number; total: number }
  | { ok: false; details: Record<string, string> }

/** Prices a set of requested lines against the catalogue, rejecting anything that isn't a valid choice. */
export function priceLines(requested: OrderLineInput[], catalogue: MarketplaceItem[]): PricingResult {
  if (requested.length === 0) return { ok: false, details: { lines: 'Your basket is empty' } }
  if (requested.length > 20) return { ok: false, details: { lines: 'Too many different items in one order' } }

  const lines: PricedLine[] = []
  for (const [index, request] of requested.entries()) {
    const key = `lines.${index}`
    const item = catalogue.find((candidate) => candidate.id === request.itemId)
    if (!item) return { ok: false, details: { [key]: 'That item is no longer available' } }

    if (!Number.isInteger(request.quantity) || request.quantity < 1 || request.quantity > MAX_QUANTITY) {
      return { ok: false, details: { [key]: `Choose a quantity between 1 and ${MAX_QUANTITY}` } }
    }

    const resolved = resolveOptions(item, request.options ?? {})
    if (!resolved) return { ok: false, details: { [key]: 'One of the chosen options isn’t available' } }

    const text = request.personalisation?.trim() ?? ''
    if (item.personalisation) {
      if (item.personalisation.required && !text) {
        return { ok: false, details: { [key]: `${item.personalisation.label} is needed for this item` } }
      }
      if (text.length > item.personalisation.maxLength) {
        return { ok: false, details: { [key]: `${item.personalisation.label} is too long` } }
      }
    } else if (text) {
      return { ok: false, details: { [key]: 'This item can’t be personalised' } }
    }

    const price = unitPrice(item, resolved)
    lines.push({
      itemId: item.id,
      title: item.title,
      ...(item.provider && { provider: item.provider }),
      ...(item.image && { image: item.image }),
      optionLabels: resolved.labels,
      quantity: request.quantity,
      unitPrice: price,
      lineTotal: price * request.quantity,
      ...(text && { personalisation: text }),
      fulfilment: item.fulfilment ?? 'delivery',
    })
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const deliveryFee = lines.some((line) => line.fulfilment === 'delivery') ? DELIVERY_FEE : 0
  return { ok: true, lines, subtotal, deliveryFee, total: subtotal + deliveryFee }
}
