// Pure module (relative .ts imports only) so scripts/mock-api.mjs and the backend can reuse it.
import type { AlertEvent, AlertLanguage, AlertPayload } from './types'

export interface AlertTemplate {
  id: string
  /** Text with `{name}` placeholders. Keep SMS-sized and gentle in tone. */
  text: Partial<Record<AlertLanguage, string>> & { en: string }
  /** Ordered placeholder names, used as positional params for approved WhatsApp templates. */
  vars: string[]
}

const SIGN_OFF = 'Fidelity Life'

// Shona (sn) and Ndebele (nd) wording must be written and approved by a native speaker before use;
// until then recipients on those languages receive the English text.
export const TEMPLATES: Record<AlertEvent, AlertTemplate> = {
  'request.received': {
    id: 'request_received',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, we have received your request ({ref}). A member of our team will contact you shortly. ${SIGN_OFF}` },
  },
  'request.assigned': {
    id: 'request_assigned',
    vars: ['name', 'ref', 'provider'],
    text: { en: `Dear {name}, your request ({ref}) has been assigned to {provider}. They will be in touch. ${SIGN_OFF}` },
  },
  'request.accepted': {
    id: 'request_accepted',
    vars: ['name', 'ref', 'provider'],
    text: { en: `Dear {name}, {provider} has accepted your request ({ref}) and is making arrangements. ${SIGN_OFF}` },
  },
  'request.declined': {
    id: 'request_declined',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, we are finding another provider for your request ({ref}). You do not need to do anything. ${SIGN_OFF}` },
  },
  'request.completed': {
    id: 'request_completed',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, your request ({ref}) is complete. Our aftercare support remains available to you. ${SIGN_OFF}` },
  },
  'funeral.schedule_changed': {
    id: 'funeral_schedule_changed',
    vars: ['name', 'deceased', 'when'],
    text: { en: `Update for the funeral of {deceased}: the programme is now {when}. Please share with family. ${SIGN_OFF}` },
  },
  'procession.started': {
    id: 'procession_started',
    vars: ['name', 'deceased', 'minutes', 'link'],
    text: { en: `The procession for {deceased} has started. You can follow it for {minutes} minutes: {link}` },
  },
  'procession.stopped': {
    id: 'procession_stopped',
    vars: ['name', 'deceased'],
    text: { en: `Live sharing for the procession of {deceased} has ended. Thank you for being with the family.` },
  },
  'stream.live': {
    id: 'stream_live',
    vars: ['name', 'deceased', 'link'],
    text: { en: `The service for {deceased} is now live: {link}` },
  },
  'aftercare.thank_you': {
    id: 'aftercare_thank_you',
    vars: ['name', 'message'],
    text: { en: `Dear {name}, {message}` },
  },
  'aftercare.reminder': {
    id: 'aftercare_reminder',
    vars: ['name', 'person', 'kind', 'when'],
    text: { en: `Dear {name}, a gentle reminder: the {kind} of {person} is {when}. ${SIGN_OFF}` },
  },
  'order.paid': {
    id: 'order_paid',
    vars: ['name', 'ref', 'amount'],
    text: { en: `Dear {name}, we received your payment of {amount} for order {ref}. Thank you. ${SIGN_OFF}` },
  },
  'order.confirmed': {
    id: 'order_confirmed',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, your order {ref} is confirmed and being prepared. ${SIGN_OFF}` },
  },
  'order.delivered': {
    id: 'order_delivered',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, your order {ref} has been delivered. ${SIGN_OFF}` },
  },
  'order.payment_failed': {
    id: 'order_payment_failed',
    vars: ['name', 'ref'],
    text: { en: `Dear {name}, the payment for order {ref} did not go through. Please try again or contact us. ${SIGN_OFF}` },
  },
  'premium.due': {
    id: 'premium_due',
    vars: ['name', 'amount', 'date'],
    text: { en: `Dear {name}, your premium of {amount} is due on {date}. ${SIGN_OFF}` },
  },
}

export const SMS_SEGMENT = 160
export const SMS_MAX = SMS_SEGMENT * 3

/** Replaces `{name}` placeholders; missing values become an empty string. */
export function renderText(text: string, payload: AlertPayload): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(payload[key] ?? '')).replace(/ {2,}/g, ' ').trim()
}

export function renderAlert(event: AlertEvent, payload: AlertPayload, language: AlertLanguage = 'en') {
  const template = TEMPLATES[event]
  const body = renderText(template.text[language] ?? template.text.en, payload)
  return {
    templateId: template.id,
    body: body.length > SMS_MAX ? `${body.slice(0, SMS_MAX - 1)}…` : body,
    params: template.vars.map((v) => String(payload[v] ?? '')),
  }
}

/** Number of SMS segments a body will use (GSM-7 assumption; unicode bodies cost more in practice). */
export function smsSegments(body: string): number {
  return Math.max(1, Math.ceil(body.length / SMS_SEGMENT))
}
