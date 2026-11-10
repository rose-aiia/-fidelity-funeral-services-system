import { defaultState, type EstateState } from './data'

const KEY = 'fidelity.mock.estate'

export function loadEstate(): EstateState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaultState(), ...(JSON.parse(raw) as Partial<EstateState>) }
  } catch { /* storage unavailable */ }
  return defaultState()
}

export function saveEstate(state: EstateState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
}
