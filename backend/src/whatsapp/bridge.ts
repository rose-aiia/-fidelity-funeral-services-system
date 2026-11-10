/**
 * Fidelity WhatsApp bridge (ported from Kuwana's scripts/whatsapp/run.mts, single-session edition).
 *
 * Responsibilities:
 *   1. Resume the paired session on startup.
 *   2. Consume the send-whatsapp queue (registerQueueWorker).
 *   3. Expose a localhost control server so the API can start, reconnect, stop and read the session.
 *   4. Shut down cleanly.
 *
 * Bundled to dist-whatsapp/bridge.mjs by scripts/whatsapp/build.mjs (Baileys 7 is ESM-only, the API is CommonJS).
 */
import 'dotenv/config'
import { timingSafeEqual } from 'node:crypto'
import http from 'node:http'
import { env } from '../config/env'
import { stopBoss } from '../lib/jobs/boss'
import {
  getBridgeHealth, getConnectionStatus, reconnectSession, recoverSession, registerQueueWorker, shutdown, startSession, stopSession,
} from './manager'

const { bridgeSecret: SECRET, bridgePort: PORT } = env.alerts.whatsapp

function sendJson(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  try { return JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown> } catch { return {} }
}

/** Constant-time comparison (Kuwana compared with ===). */
function authorised(req: http.IncomingMessage): boolean {
  if (!SECRET) return false
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim()
  const a = Buffer.from(token)
  const b = Buffer.from(SECRET)
  return a.length === b.length && timingSafeEqual(a, b)
}

const server = http.createServer(async (req, res) => {
  if (!authorised(req)) return sendJson(res, 401, { error: 'Unauthorized' })
  const path = new URL(req.url ?? '/', 'http://localhost').pathname

  try {
    if (req.method === 'GET' && path === '/health') return sendJson(res, 200, getBridgeHealth())
    if (req.method === 'GET' && path === '/session/status') return sendJson(res, 200, await getConnectionStatus())

    if (req.method === 'POST' && path === '/session/start') {
      const body = await readBody(req)
      const mode = body.mode === 'pairing' ? 'pairing' : 'qr'
      const phone = typeof body.phone === 'string' ? body.phone : undefined
      if (mode === 'pairing' && !phone) return sendJson(res, 400, { error: 'A phone number is required for pairing' })
      void startSession({ mode, phone }) // the caller polls status
      return sendJson(res, 202, { accepted: true })
    }
    if (req.method === 'POST' && path === '/session/reconnect') {
      void reconnectSession()
      return sendJson(res, 202, { accepted: true })
    }
    if (req.method === 'POST' && path === '/session/stop') {
      const body = await readBody(req)
      await stopSession(body.purge !== false)
      return sendJson(res, 200, { stopped: true })
    }
    return sendJson(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[whatsapp/bridge] Internal error:', err)
    return sendJson(res, 500, { error: 'Internal error' })
  }
})

async function main() {
  if (!SECRET) {
    console.error('[whatsapp/bridge] WHATSAPP_BRIDGE_SECRET is not set. Refusing to start.')
    process.exit(1)
  }
  console.log('[whatsapp/bridge] Starting Fidelity WhatsApp bridge...')
  await recoverSession()
  await registerQueueWorker()
  server.listen(PORT, '127.0.0.1', () => console.log(`[whatsapp/bridge] Control server on 127.0.0.1:${PORT}`))

  const stop = async (signal: string) => {
    console.log(`[whatsapp/bridge] ${signal} received, shutting down...`)
    server.close()
    await shutdown()
    await stopBoss(10)
    process.exit(0)
  }
  process.on('SIGINT', () => void stop('SIGINT'))
  process.on('SIGTERM', () => void stop('SIGTERM'))
  console.log('[whatsapp/bridge] Ready.')
}

main().catch((err) => {
  console.error('[whatsapp/bridge] Fatal error:', err)
  process.exit(1)
})
