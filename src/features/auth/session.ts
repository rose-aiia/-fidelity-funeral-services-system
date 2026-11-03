import type { User } from './types'

const SESSION_KEY = 'fidelity.mock.session'

/**
 * Mock-mode session snapshot, so a reload keeps you signed in. Live mode never touches this:
 * the real session is an httpOnly cookie the browser sends and the API validates.
 * Storage can throw (private windows, blocked site data), so every access is guarded.
 */
export function readSessionUser(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function writeSessionUser(user: User | null): void {
  try {
    if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage unavailable: the session then lasts until the page is closed.
  }
}
