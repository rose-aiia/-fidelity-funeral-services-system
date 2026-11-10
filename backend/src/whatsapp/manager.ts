/**
 * WhatsApp connection manager (ported from Kuwana's manager.ts).
 *
 * Runs inside the dedicated `fidelity-whatsapp` process (src/whatsapp/bridge.ts, bundled to
 * dist-whatsapp/bridge.mjs), never inside the API: a long-lived WebSocket does not belong in request handlers.
 *
 * Differences from Kuwana:
 *  - One company-owned session (SESSION_KEY), paired once by an admin. Kuwana keeps one per user.
 *  - Outbound only. The chat bot is gone; the only inbound handling is STOP / START, which writes
 *    the recipient's opt-out, and delivery receipts, which update the outbox row.
 *  - Sends are paced (minimum gap plus jitter) because this is an unofficial client on a business number.
 *
 * Status, QR code and pairing code are written to `whatsapp_connections` so the API can read them
 * without touching the socket.
 */
import fs from 'node:fs'
import path from 'node:path'
import makeWASocket, { DisconnectReason, useMultiFileAuthState, type WASocket } from '@whiskeysockets/baileys'
import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import { getBoss } from '../lib/jobs/boss'
import { PrismaAlertStore } from '../alerts/prismaStore'
import { processOutboxJob } from '../alerts/outbox'
import { ensureQueues, WHATSAPP_QUEUE_NAME, type SendJob } from '../alerts/queues'
import { handleBaileysStatus, handleInboundText, isStartText, isStopText } from '../alerts/webhooks'
import type { OutboxRow, SendResult } from '../alerts/types'
import { logWhatsAppEvent } from './events'
import { summarizeWhatsAppSockets } from './health'
import { runWhatsAppInOrder } from './messageOrdering'
import { cancelAllReconnects, cancelReconnect, scheduleReconnect } from './pendingReconnect'
import { cleanWhatsAppJid, isWhatsAppUserJid, phoneToWhatsAppJid, whatsappJidToPhone } from './phone'
import { markOpen, nextBackoff, resetBackoff } from './reconnectBackoff'
import { isWhatsAppEnabled } from './settings'

/** The one paired session. */
export const SESSION_KEY = 'company'

const QR_EXPIRY_MS = 60_000
const PAIRING_EXPIRY_MS = 60_000
const STOP_REPLY = 'You will no longer receive alerts from Fidelity Life on WhatsApp. Reply START to receive them again.'
const START_REPLY = 'You will receive alerts from Fidelity Life on WhatsApp again. Reply STOP at any time to stop.'

const store = new PrismaAlertStore(prisma)

/** Baileys logs every protocol frame at "info"; this swallows it so the process log stays readable. */
const silentLogger: NonNullable<Parameters<typeof makeWASocket>[0]['logger']> = {
  level: 'silent',
  trace: () => {}, debug: () => {}, info: () => {}, warn: () => {}, error: () => {},
  child: () => silentLogger,
}

type SessionEntry = { sock: WASocket; abortController: AbortController }
let session: SessionEntry | undefined

type ConnectionPatch = Partial<{
  status: 'DISCONNECTED' | 'CONNECTING' | 'AWAITING_SCAN' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'
  phone: string | null
  jid: string | null
  qrCode: string | null
  pairingCode: string | null
  qrExpiresAt: Date | null
  pairingExpiresAt: Date | null
  connectedAt: Date | null
  lastActiveAt: Date
  errorMessage: string | null
  sessionDir: string | null
}>

const CLEARED: ConnectionPatch = {
  phone: null, jid: null, qrCode: null, pairingCode: null, qrExpiresAt: null, pairingExpiresAt: null, connectedAt: null,
}

export function getBridgeHealth() {
  return {
    status: 'ok' as const,
    service: 'fidelity-whatsapp',
    uptimeSeconds: Math.floor(process.uptime()),
    sessions: summarizeWhatsAppSockets(session ? [session.sock.ws.isOpen] : []),
  }
}

function sessionDir(): string {
  const dir = path.join(env.alerts.whatsapp.sessionDir, SESSION_KEY)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

function disconnectStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  return (err as { output?: { statusCode?: number } }).output?.statusCode
}

async function upsertConnection(data: ConnectionPatch) {
  try {
    await prisma.whatsAppConnection.upsert({
      where: { sessionKey: SESSION_KEY },
      create: { sessionKey: SESSION_KEY, status: 'DISCONNECTED', ...data },
      update: data,
    })
  } catch (err) {
    console.error('[whatsapp/manager] DB upsert error:', err)
  }
}

/** The phone a message came from. WhatsApp may hide it behind a LID; the alternate JID carries the number. */
function senderPhone(key: { remoteJid?: string | null; remoteJidAlt?: string }): string | null {
  for (const candidate of [key.remoteJid, key.remoteJidAlt]) {
    if (candidate && isWhatsAppUserJid(candidate) && cleanWhatsAppJid(candidate).endsWith('@s.whatsapp.net')) {
      return whatsappJidToPhone(candidate)
    }
  }
  return null
}

/**
 * Start (or restart) the company session.
 *   mode 'qr'      - show a QR code for the admin to scan
 *   mode 'pairing' - request an 8-character pairing code for the given phone number
 */
export async function startSession(options: { mode: 'qr' | 'pairing'; phone?: string } = { mode: 'qr' }): Promise<void> {
  // Closes any existing socket quietly. (Kuwana logged it out here, which un-links the phone: a re-pair, not a restart.)
  await closeSocket()

  const dir = sessionDir()
  const abortController = new AbortController()
  await upsertConnection({ status: 'CONNECTING', qrCode: null, pairingCode: null, qrExpiresAt: null, pairingExpiresAt: null, errorMessage: null, sessionDir: dir })
  await logWhatsAppEvent({ type: 'SESSION', status: 'CONNECTING', details: `Starting WhatsApp session (mode: ${options.mode})`, metadata: { mode: options.mode } })
  console.log(`[whatsapp/manager] Starting session (mode=${options.mode})`)

  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger: silentLogger })
  session = { sock, abortController }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    if (abortController.signal.aborted) return
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const qrExpiresAt = new Date(Date.now() + QR_EXPIRY_MS)
      await upsertConnection({ status: 'AWAITING_SCAN', qrCode: qr, pairingCode: null, qrExpiresAt, pairingExpiresAt: null, errorMessage: null })
      await logWhatsAppEvent({ type: 'SESSION', status: 'QR_REQUESTED', details: 'QR code generated for WhatsApp pairing', metadata: { expiresAt: qrExpiresAt.toISOString() } })
    }

    if (connection === 'open') {
      const jid = sock.user?.id ? cleanWhatsAppJid(sock.user.id) : null
      const phone = whatsappJidToPhone(sock.user?.id ?? '')
      console.log(`[whatsapp/manager] Connected (phone=${phone})`)
      // Does not reset the retry count by itself: only a connection that stays up does (see reconnectBackoff).
      markOpen(SESSION_KEY)
      await upsertConnection({
        status: 'CONNECTED', phone: phone || null, jid, qrCode: null, pairingCode: null, qrExpiresAt: null,
        pairingExpiresAt: null, connectedAt: new Date(), lastActiveAt: new Date(), errorMessage: null,
      })
      await logWhatsAppEvent({ type: 'SESSION', status: 'CONNECTED', phone: phone || null, jid, details: 'WhatsApp session established' })
    }

    if (connection === 'close') {
      const statusCode = disconnectStatusCode(lastDisconnect?.error)
      const loggedOut = statusCode === DisconnectReason.loggedOut
      console.warn(`[whatsapp/manager] Connection closed (code=${statusCode}, loggedOut=${loggedOut})`)
      session = undefined

      if (loggedOut) {
        resetBackoff(SESSION_KEY)
        try { fs.rmSync(dir, { recursive: true, force: true }) } catch { /* already gone */ }
        await upsertConnection({ status: 'DISCONNECTED', ...CLEARED, errorMessage: 'The phone logged this session out. Pair it again to resume sending.' })
        await logWhatsAppEvent({ type: 'SESSION', status: 'DISCONNECTED', details: 'WhatsApp session logged out by the phone', metadata: { statusCode, loggedOut: true } })
      } else if (!abortController.signal.aborted) {
        const { delayMs, attempt } = nextBackoff(SESSION_KEY)
        console.log(`[whatsapp/manager] Reconnecting in ${delayMs}ms (attempt ${attempt})`)
        await upsertConnection({ status: 'RECONNECTING', errorMessage: null })
        await logWhatsAppEvent({ type: 'SESSION', status: 'RECONNECTING', details: `Connection lost; reconnecting in ${delayMs}ms (attempt ${attempt})`, metadata: { statusCode, delayMs, attempt } })
        // Tracked (not a bare setTimeout) so a later stop can cancel it.
        scheduleReconnect(SESSION_KEY, delayMs, () => { if (!abortController.signal.aborted) void startSession(options) })
      }
    }
  })

  // Inbound: only STOP / START replies matter. Everything else is ignored, and nothing is stored.
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (abortController.signal.aborted || type !== 'notify') return
    for (const msg of messages) {
      try {
        if (msg.key.fromMe || !msg.key.remoteJid || !isWhatsAppUserJid(msg.key.remoteJid)) continue
        const text = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text
        if (!text || !(isStopText(text) || isStartText(text))) continue
        const phone = senderPhone(msg.key)
        if (!phone) {
          await logWhatsAppEvent({ type: 'INBOUND', status: 'IGNORED', details: 'STOP/START from a hidden (LID) sender with no phone number; cannot opt out', metadata: { jid: msg.key.remoteJid } })
          continue
        }
        await handleInboundText(store, 'whatsapp', phone, text)
        const stopping = isStopText(text)
        await logWhatsAppEvent({ type: 'OPT_OUT', status: stopping ? 'STOP' : 'START', phone, details: `Recipient replied ${stopping ? 'STOP' : 'START'}` })
        await sock.sendMessage(msg.key.remoteJid, { text: stopping ? STOP_REPLY : START_REPLY })
      } catch (err) {
        console.error('[whatsapp/manager] Error handling inbound message:', err)
      }
    }
  })

  // Delivery receipts for messages this session sent.
  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (!key.fromMe || !key.id || typeof update.status !== 'number') continue
      try { await handleBaileysStatus(store, key.id, update.status) } catch (err) { console.warn('[whatsapp/manager] receipt update failed:', err) }
    }
  })

  if (options.mode === 'pairing' && options.phone) {
    const digits = options.phone.replace(/\D/g, '')
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(digits)
        const expiresAt = new Date(Date.now() + PAIRING_EXPIRY_MS)
        await upsertConnection({ status: 'AWAITING_SCAN', pairingCode: code, pairingExpiresAt: expiresAt, qrCode: null, qrExpiresAt: null, errorMessage: null })
        await logWhatsAppEvent({ type: 'SESSION', status: 'PAIRING_REQUESTED', details: 'Pairing code issued (expires in 60s)', metadata: { pairingCode: code } })
      } catch (err) {
        console.error('[whatsapp/manager] Failed to get pairing code:', err)
        await upsertConnection({ status: 'ERROR', errorMessage: 'Could not generate a pairing code. Check the phone number and try again.' })
        await logWhatsAppEvent({ type: 'SESSION', status: 'FAILED', details: `Failed to generate pairing code: ${err instanceof Error ? err.message : String(err)}` })
      }
    }, 3000)
  }
}

/** Close the socket without logging out (the phone stays linked) and drop any pending retry. */
async function closeSocket(): Promise<void> {
  cancelReconnect(SESSION_KEY)
  if (!session) return
  const entry = session
  session = undefined
  entry.abortController.abort()
  try { entry.sock.end(undefined) } catch { /* already closed */ }
}

/**
 * Reopen the socket on the saved credentials WITHOUT unlinking the phone. With no saved credentials
 * there is nothing to resume and the session falls through to a QR (status AWAITING_SCAN).
 */
export async function reconnectSession(): Promise<void> {
  resetBackoff(SESSION_KEY)
  await logWhatsAppEvent({ type: 'SESSION', status: 'RECONNECTING', details: 'Manual reconnect requested (credentials kept)', metadata: { manual: true } })
  await startSession()
}

/** Disconnect, and optionally log the device out and purge the saved credentials. */
export async function stopSession(purgeCredentials = false): Promise<void> {
  cancelReconnect(SESSION_KEY)
  const entry = session
  if (entry) {
    session = undefined
    entry.abortController.abort()
    try { await entry.sock.logout() } catch { try { entry.sock.end(undefined) } catch { /* already closed */ } }
  }
  if (purgeCredentials) {
    resetBackoff(SESSION_KEY)
    try { fs.rmSync(sessionDir(), { recursive: true, force: true }) } catch { /* already gone */ }
  }
  await upsertConnection({ status: 'DISCONNECTED', ...CLEARED, errorMessage: null })
  await logWhatsAppEvent({ type: 'SESSION', status: 'DISCONNECTED', details: `Session disconnected by an admin (purge: ${purgeCredentials})`, metadata: { purgeCredentials } })
}

export async function getConnectionStatus() {
  const row = await prisma.whatsAppConnection.findUnique({ where: { sessionKey: SESSION_KEY } })
  return {
    status: row?.status ?? 'DISCONNECTED',
    phone: row?.phone ?? null,
    jid: row?.jid ?? null,
    qrCode: row?.qrCode ?? null,
    pairingCode: row?.pairingCode ?? null,
    qrExpiresAt: row?.qrExpiresAt?.toISOString() ?? null,
    pairingExpiresAt: row?.pairingExpiresAt?.toISOString() ?? null,
    connectedAt: row?.connectedAt?.toISOString() ?? null,
    lastActiveAt: row?.lastActiveAt.toISOString() ?? null,
    errorMessage: row?.errorMessage ?? null,
  }
}

/** On bridge startup, resume the session if it was active before the restart. */
export async function recoverSession(): Promise<void> {
  try {
    const row = await prisma.whatsAppConnection.findUnique({ where: { sessionKey: SESSION_KEY } })
    if (row && ['CONNECTED', 'RECONNECTING', 'AWAITING_SCAN'].includes(row.status)) {
      console.log('[whatsapp/manager] Recovering previous session')
      void startSession()
    }
  } catch (err) {
    console.warn('[whatsapp/manager] Failed to recover session:', err)
  }
}

// ---- sending ----

const MIN_INTERVAL_MS = env.alerts.whatsapp.minIntervalMs
const JITTER_MS = env.alerts.whatsapp.jitterMs
let gate: Promise<unknown> = Promise.resolve()
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Global pacing: every send waits a minimum gap plus jitter after the previous one, so traffic does not look automated. */
function paced<T>(fn: () => Promise<T>): Promise<T> {
  const run = gate.then(async () => {
    await sleep(MIN_INTERVAL_MS + Math.random() * JITTER_MS)
    return fn()
  })
  gate = run.catch(() => undefined)
  return run
}

async function sendRow(row: OutboxRow): Promise<SendResult> {
  const provider = 'baileys'
  if (!(await isWhatsAppEnabled())) return { ok: false, provider, error: 'WhatsApp is switched off by an admin', retryable: false }
  const sock = session?.sock
  if (!sock || !sock.ws.isOpen) return { ok: false, provider, error: 'No active WhatsApp session', retryable: true }

  const jid = phoneToWhatsAppJid(row.recipient)
  return paced(async () => {
    try {
      // The real validator of "does this number have WhatsApp". If the check itself fails, try the send anyway.
      const lookup = await sock.onWhatsApp(jid).catch(() => undefined)
      if (lookup && lookup[0] && lookup[0].exists === false) {
        return { ok: false, provider, error: 'Number is not on WhatsApp', retryable: false }
      }
      try { await sock.sendPresenceUpdate('composing', jid) } catch { /* cosmetic */ }
      const sent = await sock.sendMessage(jid, { text: row.body })
      try { await sock.sendPresenceUpdate('paused', jid) } catch { /* cosmetic */ }
      return { ok: true, provider, messageId: sent?.key.id ?? undefined }
    } catch (err) {
      return { ok: false, provider, error: err instanceof Error ? err.message : String(err), retryable: true }
    }
  })
}

/** Consume the send-whatsapp queue. Different recipients progress concurrently; one recipient's messages stay in order. */
export async function registerQueueWorker(): Promise<void> {
  const boss = await getBoss('fidelity-whatsapp')
  await ensureQueues(boss)

  await boss.work<SendJob>(
    WHATSAPP_QUEUE_NAME,
    { batchSize: 1, localConcurrency: 4, pollingIntervalSeconds: 0.5 },
    async (jobs) => {
      for (const job of jobs) {
        const row = await store.get(job.data.outboxId)
        if (!row) continue
        await runWhatsAppInOrder(`outbound:${row.recipient}`, async () => {
          const outcome = await processOutboxJob({ store, send: sendRow }, row.id)
          await logWhatsAppEvent({
            type: 'QUEUE', status: outcome === 'sent' ? 'SENT' : outcome === 'retry' ? 'RETRIED' : outcome === 'failed' ? 'FAILED' : 'IGNORED',
            phone: row.recipient, details: `Outbox ${row.id} -> ${outcome}`, metadata: { jobId: job.id, outboxId: row.id },
          })
          // Throwing hands the job back to pg-boss, which applies its retry delay.
          if (outcome === 'retry') throw new Error(`Send failed; will retry (outbox ${row.id})`)
        })
      }
    },
  )
  console.log(`[whatsapp/manager] Queue worker registered for "${WHATSAPP_QUEUE_NAME}"`)
}

/** Graceful shutdown: close the socket and cancel any pending reconnect. */
export async function shutdown(): Promise<void> {
  cancelAllReconnects()
  await closeSocket()
}
