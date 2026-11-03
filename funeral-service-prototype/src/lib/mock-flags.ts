// A flag the mock "server" shares between features: which providers the administrator has switched off.
// The shop reads it to hide their products; the staff portal writes it. Storage can throw, so every access is guarded.

const KEY = 'fidelity.mock.inactiveProviders'

export function readInactiveProviders(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function writeInactiveProviders(ids: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // Storage unavailable: the change lasts until the page is closed.
  }
}
