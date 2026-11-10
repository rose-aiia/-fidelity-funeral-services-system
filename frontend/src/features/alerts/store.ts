import { emptyAlertState } from './rules'
import type { AlertState } from './types'

const KEY = 'fidelity.mock.alerts'
const MAX_OUTBOX = 200

export function loadAlertState(): AlertState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AlertState>
      const base = emptyAlertState()
      return { ...base, ...parsed, stopped: { ...base.stopped, ...parsed.stopped } }
    }
  } catch { /* storage unavailable */ }
  return emptyAlertState()
}

export function saveAlertState(state: AlertState) {
  const trimmed = { ...state, outbox: state.outbox.slice(0, MAX_OUTBOX) }
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)) } catch { /* storage unavailable */ }
}
