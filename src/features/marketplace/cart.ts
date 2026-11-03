import { useSyncExternalStore } from 'react'
import { addLine, removeLine, setLineQuantity } from './cart-logic'
import type { CartLine } from './data'

// A tiny external store: the cart lives in localStorage so it survives reloads and signing in, and any
// component (header button, drawer, product page) can read or change it without a provider.

const STORAGE_KEY = 'fidelity.cart'

type Saved = { lines: CartLine[]; inMemoryOf?: string }
type State = Saved & { isOpen: boolean }

function load(): Saved {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Saved>) : {}
    return { lines: Array.isArray(parsed.lines) ? parsed.lines : [], inMemoryOf: parsed.inMemoryOf }
  } catch {
    return { lines: [] }
  }
}

let state: State = { ...load(), isOpen: false }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  if ('lines' in next || 'inMemoryOf' in next) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines: state.lines, inMemoryOf: state.inMemoryOf }))
    } catch {
      // Storage unavailable: the cart then lasts until the page is closed.
    }
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let counter = 0
const newId = () => `c-${Date.now().toString(36)}-${counter++}`

export const cart = {
  /** `inMemoryOf` remembers that this basket honours someone, so the order can say so. */
  add: (line: Omit<CartLine, 'id'>, inMemoryOf?: string) =>
    set({ lines: addLine(state.lines, line, newId), isOpen: true, ...(inMemoryOf && { inMemoryOf }) }),
  setQuantity: (id: string, quantity: number) => set({ lines: setLineQuantity(state.lines, id, quantity) }),
  remove: (id: string) => set({ lines: removeLine(state.lines, id) }),
  clear: () => set({ lines: [], inMemoryOf: undefined }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}

export const useCartLines = (): CartLine[] =>
  useSyncExternalStore(
    subscribe,
    () => state.lines,
    () => [],
  )

export const useCartMemory = (): string | undefined =>
  useSyncExternalStore(
    subscribe,
    () => state.inMemoryOf,
    () => undefined,
  )

export const useCartOpen = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => state.isOpen,
    () => false,
  )
