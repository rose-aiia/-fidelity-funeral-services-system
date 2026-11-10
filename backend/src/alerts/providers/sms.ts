import { env } from '../../config/env'
import type { SendResult, SmsProvider } from '../types'

export type Fetch = typeof fetch

const isRetryableStatus = (status: number) => status === 429 || status >= 500

/** Development fallback: prints instead of sending. */
export class LogSmsProvider implements SmsProvider {
  readonly name = 'log'
  async send(to: string, body: string): Promise<SendResult> {
    console.log(`[alerts:sms] to=${to} body=${JSON.stringify(body)}`)
    return { ok: true, provider: this.name, messageId: `log-${Date.now().toString(36)}` }
  }
}

export interface AfricasTalkingConfig { apiKey: string; username: string; from?: string }

export class AfricasTalkingSmsProvider implements SmsProvider {
  readonly name = 'africastalking'
  constructor(private readonly cfg: AfricasTalkingConfig, private readonly fetchFn: Fetch = fetch) {}

  async send(to: string, body: string): Promise<SendResult> {
    const host = this.cfg.username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com'
    const form = new URLSearchParams({ username: this.cfg.username, to, message: body })
    if (this.cfg.from) form.set('from', this.cfg.from)
    try {
      const res = await this.fetchFn(`https://${host}/version1/messaging`, {
        method: 'POST',
        headers: { apiKey: this.cfg.apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      })
      if (!res.ok) return { ok: false, provider: this.name, error: `HTTP ${res.status}`, retryable: isRetryableStatus(res.status) }
      const json = (await res.json()) as { SMSMessageData?: { Recipients?: { statusCode: number; status: string; messageId?: string }[] } }
      const recipient = json.SMSMessageData?.Recipients?.[0]
      // 100 Processed, 101 Sent, 102 Queued are accepted; anything else is a rejection (e.g. 403 InvalidPhoneNumber).
      if (recipient && [100, 101, 102].includes(recipient.statusCode)) return { ok: true, provider: this.name, messageId: recipient.messageId }
      return { ok: false, provider: this.name, error: recipient?.status ?? 'no recipient in response', retryable: false }
    } catch (err) {
      return { ok: false, provider: this.name, error: (err as Error).message, retryable: true }
    }
  }
}

export interface TwilioConfig { accountSid: string; authToken: string; from: string; statusCallback?: string }

export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio'
  constructor(private readonly cfg: TwilioConfig, private readonly fetchFn: Fetch = fetch) {}

  async send(to: string, body: string): Promise<SendResult> {
    const form = new URLSearchParams({ To: to, From: this.cfg.from, Body: body })
    if (this.cfg.statusCallback) form.set('StatusCallback', this.cfg.statusCallback)
    const auth = Buffer.from(`${this.cfg.accountSid}:${this.cfg.authToken}`).toString('base64')
    try {
      const res = await this.fetchFn(`https://api.twilio.com/2010-04-01/Accounts/${this.cfg.accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      })
      const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }
      if (res.ok && json.sid) return { ok: true, provider: this.name, messageId: json.sid }
      return { ok: false, provider: this.name, error: json.message ?? `HTTP ${res.status}`, retryable: isRetryableStatus(res.status) }
    } catch (err) {
      return { ok: false, provider: this.name, error: (err as Error).message, retryable: true }
    }
  }
}

export type SmsProviderName = 'africastalking' | 'twilio' | 'log'

export interface SmsSelection {
  /** From the admin setting. When unset the provider is chosen from whichever credentials exist. */
  provider?: SmsProviderName
  /** From the admin setting; overrides the env sender for the chosen provider. */
  senderId?: string
}

/**
 * Chooses the SMS provider: the admin's setting if there is one, otherwise Africa's Talking, then Twilio,
 * then the log fallback. API keys always come from the environment. `ALERTS_MODE=log` forces the log provider.
 * A provider that is chosen but has no credentials is an error, never a silent fall back to logging.
 */
export function createSmsProvider(fetchFn: Fetch = fetch, selection: SmsSelection = {}): SmsProvider {
  const { africasTalking: at, twilio, publicBaseUrl } = env.alerts
  if (env.alerts.mode === 'log' || selection.provider === 'log') return new LogSmsProvider()

  const hasAt = Boolean(at.apiKey && at.username)
  const hasTwilio = Boolean(twilio.accountSid && twilio.authToken && (twilio.from || selection.senderId))
  const choice = selection.provider ?? (hasAt ? 'africastalking' : hasTwilio ? 'twilio' : undefined)

  if (choice === 'africastalking' && hasAt) return new AfricasTalkingSmsProvider({ ...at, from: selection.senderId || at.from }, fetchFn)
  if (choice === 'twilio' && hasTwilio) {
    const statusCallback = publicBaseUrl ? `${publicBaseUrl}/api/alerts/webhooks/twilio` : undefined
    return new TwilioSmsProvider({ ...twilio, from: selection.senderId || twilio.from, statusCallback }, fetchFn)
  }
  throw new Error(`ALERTS_MODE=live but ${choice ?? 'no SMS provider'} is not configured (set AFRICASTALKING_* or TWILIO_*).`)
}
