import type { AlertEvent } from './types'

export const EVENT_GROUPS: { title: string; events: { event: AlertEvent; label: string }[] }[] = [
  { title: 'Help requests', events: [
    { event: 'request.received', label: 'Request received' },
    { event: 'request.assigned', label: 'Assigned to a provider' },
    { event: 'request.accepted', label: 'Provider accepted' },
    { event: 'request.declined', label: 'Provider declined' },
    { event: 'request.completed', label: 'Request completed' },
  ] },
  { title: 'Funeral day', events: [
    { event: 'funeral.schedule_changed', label: 'Schedule changed' },
    { event: 'procession.started', label: 'Procession sharing started' },
    { event: 'procession.stopped', label: 'Procession sharing ended' },
    { event: 'stream.live', label: 'Service goes live' },
  ] },
  { title: 'Aftercare', events: [
    { event: 'aftercare.thank_you', label: 'Thank-you messages' },
    { event: 'aftercare.reminder', label: 'Anniversary and memorial reminders' },
  ] },
  { title: 'Orders and premiums', events: [
    { event: 'order.paid', label: 'Payment received' },
    { event: 'order.confirmed', label: 'Order confirmed' },
    { event: 'order.delivered', label: 'Order delivered' },
    { event: 'order.payment_failed', label: 'Payment failed' },
    { event: 'premium.due', label: 'Premium due soon' },
  ] },
]

export const EVENT_LABEL = Object.fromEntries(
  EVENT_GROUPS.flatMap((g) => g.events.map((e) => [e.event, e.label])),
) as Record<AlertEvent, string>

export const CHANNEL_LABEL = { sms: 'SMS', whatsapp: 'WhatsApp' } as const
