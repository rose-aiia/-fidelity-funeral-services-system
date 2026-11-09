import type { AftercareState } from './data'

const KEY = 'fidelity.mock.aftercare'
const empty = (): AftercareState => ({ thankYous: [], reminders: [] })

export function loadAftercare(): AftercareState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty(), ...(JSON.parse(raw) as Partial<AftercareState>) }
  } catch { /* storage unavailable */ }
  return empty()
}

export function saveAftercare(state: AftercareState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
}
