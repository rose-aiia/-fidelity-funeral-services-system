// Admin API for the WhatsApp session and SMS settings. Ported from Kuwana's /api/admin/whatsapp/* routes,
// rewritten as an Express router. Guarded by the interim bearer token (see auth.ts).
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { bridgeHealth, bridgeReconnect, bridgeStart, bridgeStatus, bridgeStop, isBridgeConfigured } from '../whatsapp/bridgeClient'
import { getWhatsAppSettings, setWhatsAppEnabled } from '../whatsapp/settings'
import { requireToken } from './auth'
import { credentialStatus, getSmsSettings, saveSmsSettings, testSmsConnection } from './smsSettings'

const ACTOR = 'api-token' // there is no admin identity until staff authentication exists

const startSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('qr') }),
  z.object({ mode: z.literal('pairing'), phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter the number with its country code') }),
])

export function createAdminRouter(): Router {
  const router = Router()
  router.use(requireToken)

  // ---- the paired WhatsApp session ----

  router.get('/whatsapp/connection', async (_req, res, next) => {
    try {
      const [status, health] = await Promise.all([bridgeStatus(), bridgeHealth()])
      res.json({
        success: true,
        bridge: { configured: isBridgeConfigured(), reachable: health.ok },
        // The bridge writes the live state to the DB; fall back to it when the bridge is unreachable.
        connection: status.ok ? status.data : await prisma.whatsAppConnection.findUnique({ where: { sessionKey: 'company' } }),
      })
    } catch (err) { next(err) }
  })

  router.post('/whatsapp/connection', async (req, res, next) => {
    try {
      const body = startSchema.safeParse(req.body)
      if (!body.success) { res.status(400).json({ success: false, message: 'Invalid request', issues: body.error.issues }); return }
      const out = await (body.data.mode === 'pairing' ? bridgeStart('pairing', body.data.phone) : bridgeStart('qr'))
      res.status(out.ok ? 202 : 503).json({ success: out.ok, ...(out.ok ? {} : { message: 'The WhatsApp bridge is not running' }) })
    } catch (err) { next(err) }
  })

  router.post('/whatsapp/connection/reconnect', async (_req, res) => {
    const out = await bridgeReconnect()
    res.status(out.ok ? 202 : 503).json({ success: out.ok })
  })

  router.delete('/whatsapp/connection', async (_req, res) => {
    const out = await bridgeStop(true)
    res.status(out.ok ? 200 : 503).json({ success: out.ok })
  })

  // ---- master switch ----

  router.get('/whatsapp/settings', async (_req, res, next) => {
    try { res.json({ success: true, settings: await getWhatsAppSettings() }) } catch (err) { next(err) }
  })

  router.put('/whatsapp/settings', async (req, res, next) => {
    try {
      const body = z.object({ enabled: z.boolean() }).safeParse(req.body)
      if (!body.success) { res.status(400).json({ success: false, message: 'Invalid request' }); return }
      res.json({ success: true, settings: await setWhatsAppEnabled(body.data.enabled, ACTOR) })
    } catch (err) { next(err) }
  })

  // ---- SMS ----

  router.get('/sms', async (_req, res, next) => {
    try { res.json({ success: true, settings: await getSmsSettings(), credentials: credentialStatus() }) } catch (err) { next(err) }
  })

  router.put('/sms', async (req, res, next) => {
    try {
      const parsed = z.object({ provider: z.enum(['africastalking', 'twilio', 'log']).optional(), senderId: z.string().trim().max(32).optional() }).safeParse(req.body)
      if (!parsed.success) { res.status(400).json({ success: false, message: 'Invalid request', issues: parsed.error.issues }); return }
      res.json({ success: true, settings: await saveSmsSettings(parsed.data, ACTOR) })
    } catch (err) { next(err) }
  })

  router.post('/sms/test', async (req, res, next) => {
    try {
      const body = z.object({ provider: z.enum(['africastalking', 'twilio']) }).safeParse(req.body)
      if (!body.success) { res.status(400).json({ success: false, message: 'Choose a provider to test' }); return }
      res.json({ success: true, ...(await testSmsConnection(body.data.provider)) })
    } catch (err) { next(err) }
  })

  // ---- visibility ----

  router.get('/events', async (req, res, next) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200)
      res.json({ success: true, events: await prisma.whatsAppEvent.findMany({ orderBy: { createdAt: 'desc' }, take: limit }) })
    } catch (err) { next(err) }
  })

  /** Counts of outbox messages by channel and status over the last 24 hours. */
  router.get('/stats', async (_req, res, next) => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const groups = await prisma.alertOutbox.groupBy({ by: ['channel', 'status'], where: { createdAt: { gte: since } }, _count: { _all: true } })
      res.json({ success: true, last24h: groups.map((g) => ({ channel: g.channel, status: g.status, count: g._count._all })) })
    } catch (err) { next(err) }
  })

  return router
}
