// Pure module: decides which alerts to send. Time is always passed in so it is testable.
import { normaliseInternationalPhone } from '../../lib/phone'
import { renderAlert } from './templates'
import type {
  AlertChannel, AlertEvent, AlertPayload, AlertPrefs, AlertRecipient, AlertRecord, AlertState,
} from './types'

const HARARE_OFFSET_HOURS = 2 // Africa/Harare is UTC+2 with no DST
const QUIET_START = 21 // 21:00 Harare
const QUIET_END = 6 // 06:00 Harare

/** Time-critical events ignore quiet hours. */
const URGENT: ReadonlySet<AlertEvent> = new Set([
  'procession.started', 'procession.stopped', 'stream.live', 'funeral.schedule_changed',
])

/** Events sent to someone other than the account holder, so they need explicit consent, not just prefs. */
const THIRD_PARTY: ReadonlySet<AlertEvent> = new Set([
  'procession.started', 'procession.stopped', 'stream.live', 'aftercare.thank_you', 'funeral.schedule_changed',
])

export const CHANNELS: AlertChannel[] = ['sms', 'whatsapp']

export function emptyAlertState(): AlertState {
  return { prefs: {}, stopped: { sms: [], whatsapp: [] }, outbox: [] }
}

export function harareHour(now: Date): number {
  return (now.getUTCHours() + HARARE_OFFSET_HOURS) % 24
}

export function inQuietHours(now: Date): boolean {
  const h = harareHour(now)
  return h >= QUIET_START || h < QUIET_END
}

/** Next 06:00 Harare at or after `now`, as an ISO string. */
export function quietHoursEnd(now: Date): string {
  const end = new Date(now)
  end.setUTCHours(QUIET_END - HARARE_OFFSET_HOURS, 0, 0, 0)
  if (end.getTime() <= now.getTime()) end.setUTCDate(end.getUTCDate() + 1)
  return end.toISOString()
}

export function isEnabled(prefs: AlertPrefs, event: AlertEvent, channel: AlertChannel): boolean {
  return prefs[event]?.[channel] === true
}

export function setPref(prefs: AlertPrefs, event: AlertEvent, channel: AlertChannel, enabled: boolean): AlertPrefs {
  return { ...prefs, [event]: { ...prefs[event], [channel]: enabled } }
}

/** Channels to try, in order. The recipient's own stated choice wins; otherwise every opted-in channel. */
export function channelsFor(
  event: AlertEvent, recipient: AlertRecipient, prefs: AlertPrefs,
): AlertChannel[] {
  if (recipient.preferredChannel) return [recipient.preferredChannel]
  return CHANNELS.filter((c) => isEnabled(prefs, event, c))
}

export function dedupeKey(event: AlertEvent, channel: AlertChannel, to: string, ref: string): string {
  return [event, channel, to, ref].join('|')
}

export interface PlanInput {
  event: AlertEvent
  recipient: AlertRecipient
  payload: AlertPayload
  /** Stable reference for dedupe, e.g. request id + status, or reminder id + date. */
  ref: string
}

/**
 * Plans the alert records for one event + recipient. Blocked records are returned (not dropped) so the
 * outbox can explain why nothing was sent.
 */
export function planAlerts(input: PlanInput, state: AlertState, now: Date, idFor: () => string): AlertRecord[] {
  const { event, recipient, payload, ref } = input
  const to = normaliseInternationalPhone(recipient.phone)
  const createdAt = now.toISOString()
  const language = recipient.language ?? 'en'

  const base = (channel: AlertChannel, to_: string) => {
    const rendered = renderAlert(event, payload, language)
    return {
      id: idFor(), event, channel, to: to_, ...rendered,
      dedupeKey: dedupeKey(event, channel, to_, ref), createdAt, simulated: true,
    }
  }

  if (!to) {
    return [{ ...base(recipient.preferredChannel ?? 'sms', recipient.phone), status: 'blocked', reason: 'invalid phone number' }]
  }

  const channels = channelsFor(event, recipient, state.prefs)
  if (channels.length === 0) {
    return [{ ...base('sms', to), status: 'blocked', reason: 'not opted in' }]
  }

  return channels.map((channel): AlertRecord => {
    const rec = base(channel, to)
    if (state.stopped[channel].includes(to)) return { ...rec, status: 'blocked', reason: 'recipient replied STOP' }
    if (THIRD_PARTY.has(event) && recipient.consent !== true) return { ...rec, status: 'blocked', reason: 'no consent recorded' }
    if (state.outbox.some((o) => o.dedupeKey === rec.dedupeKey && o.status !== 'blocked' && o.status !== 'failed')) {
      return { ...rec, status: 'blocked', reason: 'duplicate' }
    }
    if (!URGENT.has(event) && inQuietHours(now)) return { ...rec, status: 'queued', sendAfter: quietHoursEnd(now), reason: 'quiet hours' }
    return { ...rec, status: 'queued' }
  })
}

/** Records a STOP reply; later alerts to that number on that channel are blocked. */
export function applyStop(state: AlertState, channel: AlertChannel, phone: string): AlertState {
  const to = normaliseInternationalPhone(phone)
  if (!to || state.stopped[channel].includes(to)) return state
  return { ...state, stopped: { ...state.stopped, [channel]: [...state.stopped[channel], to] } }
}

/** Splits `Tendai Moyo 0771234567` into a name and phone. The phone is optional; no phone means no alert. */
export function parseContact(entry: string): { name: string; phone: string | null } {
  const match = /^(.*?)[\s,:;-]*(\+?\d[\d\s\-().]{6,})$/.exec(entry.trim())
  if (!match) return { name: entry.trim(), phone: null }
  const phone = normaliseInternationalPhone(match[2])
  return phone ? { name: match[1].trim() || phone, phone } : { name: entry.trim(), phone: null }
}
