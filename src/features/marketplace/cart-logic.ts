// Pure cart rules, kept apart from the storage so they can be tested.
import { MAX_QUANTITY, type CartLine, type MarketplaceItem } from './data'
import { DELIVERY_FEE, resolveOptions, unitPrice } from './pricing'

/** Two lines are "the same thing" when item, options and personalisation all match. */
export function lineKey(line: Omit<CartLine, 'id' | 'quantity'>): string {
  const options = Object.entries(line.options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, choice]) => `${group}=${choice}`)
    .join('&')
  return `${line.itemId}|${options}|${line.personalisation?.trim() ?? ''}`
}

const clampQuantity = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)))

/** Adds a line, merging it into an existing identical one. */
export function addLine(lines: CartLine[], line: Omit<CartLine, 'id'>, newId: () => string): CartLine[] {
  const key = lineKey(line)
  const existing = lines.find((candidate) => lineKey(candidate) === key)
  if (existing) {
    return lines.map((candidate) =>
      candidate.id === existing.id ? { ...candidate, quantity: clampQuantity(candidate.quantity + line.quantity) } : candidate,
    )
  }
  return [...lines, { ...line, id: newId(), quantity: clampQuantity(line.quantity) }]
}

export const setLineQuantity = (lines: CartLine[], id: string, quantity: number): CartLine[] =>
  quantity < 1
    ? lines.filter((line) => line.id !== id)
    : lines.map((line) => (line.id === id ? { ...line, quantity: clampQuantity(quantity) } : line))

export const removeLine = (lines: CartLine[], id: string): CartLine[] => lines.filter((line) => line.id !== id)

export type SummaryLine = {
  line: CartLine
  item: MarketplaceItem
  optionLabels: string[]
  unitPrice: number
  lineTotal: number
}

export type CartSummary = {
  lines: SummaryLine[]
  /** Lines whose item or option no longer exists in the catalogue. */
  unavailable: CartLine[]
  count: number
  subtotal: number
  deliveryFee: number
  total: number
}

/** Prices the cart for display. The server prices the real order; this is only a preview. */
export function summariseCart(lines: CartLine[], catalogue: MarketplaceItem[]): CartSummary {
  const priced: SummaryLine[] = []
  const unavailable: CartLine[] = []

  for (const line of lines) {
    const item = catalogue.find((candidate) => candidate.id === line.itemId)
    const resolved = item ? resolveOptions(item, line.options) : null
    if (!item || !resolved) {
      unavailable.push(line)
      continue
    }
    const price = unitPrice(item, resolved)
    priced.push({ line, item, optionLabels: resolved.labels, unitPrice: price, lineTotal: price * line.quantity })
  }

  const subtotal = priced.reduce((sum, entry) => sum + entry.lineTotal, 0)
  const deliveryFee = priced.some((entry) => (entry.item.fulfilment ?? 'delivery') === 'delivery') ? DELIVERY_FEE : 0
  return {
    lines: priced,
    unavailable,
    count: priced.reduce((sum, entry) => sum + entry.line.quantity, 0),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  }
}
