export type AlertChannel = 'sms' | 'whatsapp'
export type AlertLanguage = 'en' | 'sn' | 'nd'

export const ALERT_EVENTS = [
  'request.received',
  'request.assigned',
  'request.accepted',
  'request.declined',
  'request.completed',
  'funeral.schedule_changed',
  'procession.started',
  'procession.stopped',
  'stream.live',
  'aftercare.thank_you',
  'aftercare.reminder',
  'order.paid',
  'order.confirmed',
  'order.delivered',
  'order.payment_failed',
  'premium.due',
] as const

export type AlertEvent = (typeof ALERT_EVENTS)[number]

export type AlertStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'blocked'

export interface AlertRecord {
  id: string
  event: AlertEvent
  channel: AlertChannel
  /** E.164 recipient. */
  to: string
  templateId: string
  /** Rendered text (SMS body, or the WhatsApp template body for display). */
  body: string
  /** Positional parameters for an approved WhatsApp template. */
  params: string[]
  status: AlertStatus
  /** Why an alert was blocked or failed. */
  reason?: string
  dedupeKey: string
  createdAt: string
  /** Set when held back for quiet hours; delivery should wait until this ISO time. */
  sendAfter?: string
  /** Everything in the front-end is simulated; the live backend sets this false. */
  simulated: boolean
}

export interface AlertRecipient {
  phone: string
  language?: AlertLanguage
  /** Channel the person asked for (help requests carry a contact preference). */
  preferredChannel?: AlertChannel
  /** Explicit consent captured for third parties (thank-you / procession invitees). */
  consent?: boolean
}

export type AlertPayload = Record<string, string | number | undefined>

/** event -> channel -> enabled. Everything is off until the person opts in. */
export type AlertPrefs = Partial<Record<AlertEvent, Partial<Record<AlertChannel, boolean>>>>

export interface AlertState {
  prefs: AlertPrefs
  /** Numbers that replied STOP, per channel. */
  stopped: Record<AlertChannel, string[]>
  outbox: AlertRecord[]
}
