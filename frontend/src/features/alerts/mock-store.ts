// Simulated delivery: nothing leaves the browser. Records are marked "sent" so the outbox shows what
// a real provider would have received.
import { applyStop, planAlerts, setPref } from './rules'
import { loadAlertState, saveAlertState } from './store'
import type { AlertChannel, AlertEvent, AlertRecord, AlertState } from './types'
import type { PlanInput } from './rules'

const newId = () => `alert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function dispatch(inputs: PlanInput[], now = new Date()): AlertRecord[] {
  let state = loadAlertState()
  const created: AlertRecord[] = []
  for (const input of inputs) {
    const planned = planAlerts(input, state, now, newId).map((r): AlertRecord =>
      r.status === 'queued' && !r.sendAfter ? { ...r, status: 'sent' } : r)
    state = { ...state, outbox: [...planned, ...state.outbox] }
    created.push(...planned)
  }
  saveAlertState(state)
  return created
}

/** Releases alerts held for quiet hours once their time has come. */
export function releaseDue(now = new Date()): number {
  const state = loadAlertState()
  let released = 0
  const outbox = state.outbox.map((r): AlertRecord => {
    if (r.status === 'queued' && r.sendAfter && new Date(r.sendAfter) <= now) {
      released += 1
      return { ...r, status: 'sent', sendAfter: undefined, reason: undefined }
    }
    return r
  })
  if (released) saveAlertState({ ...state, outbox })
  return released
}

export const getState = (): AlertState => loadAlertState()

export function updatePref(event: AlertEvent, channel: AlertChannel, enabled: boolean): AlertState {
  const state = loadAlertState()
  const next = { ...state, prefs: setPref(state.prefs, event, channel, enabled) }
  saveAlertState(next)
  return next
}

export function simulateStop(channel: AlertChannel, phone: string): AlertState {
  const next = applyStop(loadAlertState(), channel, phone)
  saveAlertState(next)
  return next
}

export function clearOutbox(): AlertState {
  const next = { ...loadAlertState(), outbox: [] }
  saveAlertState(next)
  return next
}
