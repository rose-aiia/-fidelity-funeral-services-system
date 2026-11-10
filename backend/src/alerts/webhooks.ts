import { normaliseInternationalPhone } from './shared/phone'
import type { AlertChannel, AlertStore } from './types'

const STOP_WORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'])
// Deliberately not 'yes': a reply to some other message must not opt anyone back in.
const START_WORDS = new Set(['start', 'unstop'])

export const isStopText = (text: string) => STOP_WORDS.has(text.trim().toLowerCase())
export const isStartText = (text: string) => START_WORDS.has(text.trim().toLowerCase())

export async function applyDeliveryStatus(
  store: AlertStore, provider: string, messageId: string, status: 'delivered' | 'failed', error?: string,
) {
  const row = await store.findByProviderMessageId(provider, messageId)
  if (!row) return false
  // Receipts can arrive out of order; never move a delivered message back.
  if (row.status === 'delivered') return true
  await store.update(row.id, status === 'delivered' ? { status: 'delivered' } : { status: 'failed', error: error ?? 'delivery failed' })
  return true
}

/** Africa's Talking delivery report: `id` and `status` (`Success`, `Failed`, `Rejected`, ...). */
export async function handleAfricasTalkingDlr(store: AlertStore, body: Record<string, string>) {
  if (!body.id || !body.status) return false
  const status = body.status.toLowerCase()
  if (['sent', 'submitted', 'buffered', 'queued'].includes(status)) return true
  return applyDeliveryStatus(store, 'africastalking', body.id, status === 'success' ? 'delivered' : 'failed', body.failureReason || body.status)
}

/** Twilio status callback (`MessageSid`, `MessageStatus`). An inbound SMS carries `Body` and `From`. */
export async function handleTwilioWebhook(store: AlertStore, body: Record<string, string>) {
  if (body.Body && body.From && !body.MessageStatus) return handleReply(store, 'sms', body.From, body.Body)
  const sid = body.MessageSid
  const status = body.MessageStatus
  if (!sid || !status) return false
  if (status === 'delivered') return applyDeliveryStatus(store, 'twilio', sid, 'delivered')
  if (status === 'failed' || status === 'undelivered') {
    return applyDeliveryStatus(store, 'twilio', sid, 'failed', body.ErrorCode ? `Twilio error ${body.ErrorCode}` : status)
  }
  return true
}

/**
 * Baileys message status (from the bridge's `messages.update` events): 3 = delivered to the device,
 * 4 = read, 5 = played. 0 is an error. Earlier statuses (pending, server ack) are not receipts.
 */
export async function handleBaileysStatus(store: AlertStore, messageId: string, status: number) {
  if (status >= 3) return applyDeliveryStatus(store, 'baileys', messageId, 'delivered')
  if (status === 0) return applyDeliveryStatus(store, 'baileys', messageId, 'failed', 'WhatsApp reported an error')
  return false
}

/** An inbound text from a recipient. STOP opts them out of that channel; START opts them back in. */
export async function handleInboundText(store: AlertStore, channel: AlertChannel, from: string, text: string) {
  return handleReply(store, channel, from, text)
}

async function handleReply(store: AlertStore, channel: AlertChannel, from: string, text: string) {
  const phone = normaliseInternationalPhone(from.startsWith('+') ? from : `+${from}`)
  if (!phone) return false
  if (isStopText(text)) await store.optOut(channel, phone)
  else if (isStartText(text)) await store.optIn(channel, phone)
  return true
}
