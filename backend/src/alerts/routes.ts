import { createHmac } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env'
import { requireToken, safeEqual } from './auth'
import { deliverAlert, type DeliverDeps } from './deliver'
import { ALERT_EVENTS } from './shared/types'
import { handleAfricasTalkingDlr, handleTwilioWebhook } from './webhooks'
import type { AlertChannel, AlertStore } from './types'

const CHANNELS: AlertChannel[] = ['sms', 'whatsapp']
const eventSchema = z.enum(ALERT_EVENTS)
const channelSchema = z.enum(['sms', 'whatsapp'])

const dispatchSchema = z.object({
  /** The account holder on whose behalf alerts are sent; their stored opt-ins choose the channels. */
  userId: z.string().min(1).optional(),
  alerts: z.array(z.object({
    event: eventSchema,
    recipient: z.object({
      phone: z.string().min(1),
      language: z.enum(['en', 'sn', 'nd']).optional(),
      preferredChannel: channelSchema.optional(),
      consent: z.boolean().optional(),
    }),
    payload: z.record(z.union([z.string(), z.number()]).optional()),
    ref: z.string().min(1),
  })).max(100),
})

const prefSchema = z.object({ userId: z.string().min(1), event: eventSchema, channel: channelSchema, enabled: z.boolean() })

/** Twilio: base64 HMAC-SHA1 of the full URL followed by each POST param (sorted) as key+value. */
export function verifyTwilioSignature(url: string, params: Record<string, string>, header: string | undefined, authToken: string) {
  if (!header || !authToken) return false
  const data = Object.keys(params).sort().reduce((acc, k) => acc + k + params[k], url)
  const expected = createHmac('sha1', authToken).update(data).digest('base64')
  return safeEqual(expected, header)
}

export function createAlertsRouter(store: AlertStore, enqueue?: DeliverDeps['enqueue']): Router {
  const router = Router()

  /** What the front end's alerts page shows in live mode: the person's preferences, STOP list and recent messages. */
  router.get('/state', requireToken, async (req, res, next) => {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : ''
      if (!userId) { res.status(400).json({ success: false, message: 'userId is required' }); return }
      const [prefs, optOuts, rows] = await Promise.all([store.listPreferences(userId), store.listOptOuts(), store.list({ limit: 100 })])
      const stopped: Record<AlertChannel, string[]> = { sms: [], whatsapp: [] }
      for (const o of optOuts) stopped[o.channel].push(o.phone)
      const prefMap: Record<string, Record<string, boolean>> = {}
      for (const p of prefs) (prefMap[p.event] ??= {})[p.channel] = p.enabled
      res.json({
        prefs: prefMap,
        stopped,
        outbox: rows.map((r) => ({
          id: r.id, event: r.event, channel: r.channel, to: r.recipient, templateId: r.templateId, body: r.body, params: r.params,
          status: r.status === 'sending' ? 'queued' : r.status, reason: r.blockedReason ?? r.error, dedupeKey: r.dedupeKey,
          createdAt: r.createdAt.toISOString(), sendAfter: r.status === 'queued' && r.scheduledFor > new Date() ? r.scheduledFor.toISOString() : undefined,
          simulated: false,
        })),
      })
    } catch (err) { next(err) }
  })

  router.post('/dispatch', requireToken, async (req, res, next) => {
    try {
      const body = dispatchSchema.safeParse(req.body)
      if (!body.success) { res.status(400).json({ success: false, message: 'Invalid request', issues: body.error.issues }); return }
      const results: { event: string; channel?: string; status: string; reason?: string }[] = []
      for (const a of body.data.alerts) {
        // The person's own channel wins; otherwise the sender's opted-in channels. Never both by accident.
        const channels: AlertChannel[] = a.recipient.preferredChannel
          ? [a.recipient.preferredChannel]
          : body.data.userId
            ? (await Promise.all(CHANNELS.map(async (c) => ((await store.isEnabled(body.data.userId as string, a.event, c)) ? c : null)))).filter((c): c is AlertChannel => c !== null)
            : []
        if (channels.length === 0) { results.push({ event: a.event, status: 'blocked', reason: 'not opted in' }); continue }
        for (const channel of channels) {
          const out = await deliverAlert({ store, enabled: env.alerts.enabled, enqueue }, {
            event: a.event, channel, phone: a.recipient.phone, language: a.recipient.language, payload: a.payload,
            ref: a.ref, userId: body.data.userId, explicitChoice: Boolean(a.recipient.preferredChannel),
            thirdPartyConsent: a.recipient.consent === true,
          })
          results.push({ event: a.event, channel, status: out.row?.status ?? out.skipped ?? 'skipped', reason: out.row?.blockedReason })
        }
      }
      res.json({ success: true, results })
    } catch (err) { next(err) }
  })

  router.post('/preferences', requireToken, async (req, res, next) => {
    try {
      const body = prefSchema.safeParse(req.body)
      if (!body.success) { res.status(400).json({ success: false, message: 'Invalid request', issues: body.error.issues }); return }
      await store.setEnabled(body.data.userId, body.data.event, body.data.channel, body.data.enabled)
      res.json({ success: true })
    } catch (err) { next(err) }
  })

  router.get('/outbox', requireToken, async (req, res, next) => {
    try {
      const status = z.enum(['queued', 'sending', 'sent', 'delivered', 'failed', 'blocked']).optional().safeParse(req.query.status)
      const limit = Math.min(Number(req.query.limit) || 50, 200)
      res.json({ success: true, rows: await store.list({ status: status.success ? status.data : undefined, limit }) })
    } catch (err) { next(err) }
  })

  // ---- provider webhooks (each verifies the sender itself; no bearer token). WhatsApp has none: the bridge reports receipts and STOP replies itself. ----

  router.post('/webhooks/twilio', async (req, res, next) => {
    try {
      const url = `${env.alerts.publicBaseUrl}${req.originalUrl}`
      if (!verifyTwilioSignature(url, req.body, req.header('x-twilio-signature'), env.alerts.twilio.authToken)) { res.sendStatus(401); return }
      await handleTwilioWebhook(store, req.body)
      res.sendStatus(200)
    } catch (err) { next(err) }
  })

  // Africa's Talking does not sign callbacks, so the callback URL carries a shared secret: ?secret=...
  router.post('/webhooks/africastalking', async (req, res, next) => {
    try {
      const secret = env.alerts.africasTalking.callbackSecret
      if (!secret || typeof req.query.secret !== 'string' || !safeEqual(req.query.secret, secret)) { res.sendStatus(401); return }
      await handleAfricasTalkingDlr(store, req.body)
      res.sendStatus(200)
    } catch (err) { next(err) }
  })

  return router
}
