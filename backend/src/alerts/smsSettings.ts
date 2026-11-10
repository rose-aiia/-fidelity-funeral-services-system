// Admin SMS settings, stored in AppSetting (ported from Kuwana's smsSettings.ts). Two fixes over Kuwana:
// the sender actually reads these (see createSmsProvider's `selection`), and API secrets are never stored in the
// database: they stay in environment variables.
import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import type { Fetch, SmsSelection } from './providers/sms'

const KEY = 'alerts.sms'

const settingSchema = z.object({
  provider: z.enum(['africastalking', 'twilio', 'log']).optional(),
  senderId: z.string().trim().max(32).optional(),
})

export type SmsSettings = z.infer<typeof settingSchema>

export async function getSmsSettings(): Promise<SmsSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } })
  if (!row) return {}
  try {
    const parsed = settingSchema.safeParse(JSON.parse(row.value))
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

export async function getSmsSelection(): Promise<SmsSelection> {
  const s = await getSmsSettings()
  return { provider: s.provider, senderId: s.senderId || undefined }
}

export async function saveSmsSettings(input: unknown, updatedBy: string): Promise<SmsSettings> {
  const value = settingSchema.parse(input)
  await prisma.appSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(value), updatedBy },
    update: { value: JSON.stringify(value), updatedBy },
  })
  return value
}

/** Which credentials exist in the environment, without revealing them. */
export function credentialStatus() {
  const { africasTalking: at, twilio } = env.alerts
  return {
    mode: env.alerts.mode,
    africastalking: Boolean(at.apiKey && at.username),
    twilio: Boolean(twilio.accountSid && twilio.authToken && twilio.from),
  }
}

/** A live, read-only call to the provider's account endpoint to prove the credentials work. Sends no message. */
export async function testSmsConnection(provider: 'africastalking' | 'twilio', fetchFn: Fetch = fetch): Promise<{ ok: boolean; message: string }> {
  try {
    if (provider === 'africastalking') {
      const { apiKey, username } = env.alerts.africasTalking
      if (!apiKey || !username) return { ok: false, message: 'AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME are not set.' }
      const host = username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com'
      const res = await fetchFn(`https://${host}/version1/user?username=${encodeURIComponent(username)}`, {
        headers: { apiKey, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      return res.ok ? { ok: true, message: 'Connected to Africa\'s Talking.' } : { ok: false, message: `Africa's Talking replied HTTP ${res.status}.` }
    }
    const { accountSid, authToken } = env.alerts.twilio
    if (!accountSid || !authToken) return { ok: false, message: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are not set.' }
    const res = await fetchFn(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}` },
      signal: AbortSignal.timeout(8000),
    })
    return res.ok ? { ok: true, message: 'Connected to Twilio.' } : { ok: false, message: `Twilio replied HTTP ${res.status}.` }
  } catch (err) {
    return { ok: false, message: (err as Error).message }
  }
}
