/**
 * Background worker (ported from Kuwana's scripts/worker/run.ts, trimmed to what this project needs).
 *
 * Consumes the send-sms queue. WhatsApp is consumed by the bridge process instead, because only the bridge
 * holds the socket. Scheduled reminders will be registered here once aftercare and policy data are server-side.
 */
import 'dotenv/config'
import { env } from './config/env'
import { getBoss, stopBoss } from './lib/jobs/boss'
import { prisma } from './lib/prisma'
import { processOutboxJob } from './alerts/outbox'
import { PrismaAlertStore } from './alerts/prismaStore'
import { createSmsProvider } from './alerts/providers/sms'
import { ensureQueues, SMS_QUEUE_NAME, type SendJob } from './alerts/queues'
import { getSmsSelection } from './alerts/smsSettings'
import type { OutboxRow } from './alerts/types'

async function main() {
  if (!env.alerts.enabled) {
    console.log('[worker] ALERTS_ENABLED is not true; nothing to do.')
    return
  }
  const store = new PrismaAlertStore(prisma)
  const boss = await getBoss('fidelity-worker')
  await ensureQueues(boss)

  // The provider is chosen per job, so an admin changing the SMS setting takes effect without a restart.
  const send = async (row: OutboxRow) => createSmsProvider(fetch, await getSmsSelection()).send(row.recipient, row.body)

  await boss.work<SendJob>(SMS_QUEUE_NAME, { batchSize: 1, localConcurrency: 4, pollingIntervalSeconds: 1 }, async (jobs) => {
    for (const job of jobs) {
      const outcome = await processOutboxJob({ store, send }, job.data.outboxId)
      console.log(`[worker] send-sms ${job.data.outboxId} -> ${outcome}`)
      // Throwing hands the job back to pg-boss, which applies its retry delay.
      if (outcome === 'retry') throw new Error(`SMS send failed; will retry (outbox ${job.data.outboxId})`)
    }
  })
  console.log(`[worker] Consuming "${SMS_QUEUE_NAME}" (mode=${env.alerts.mode})`)

  const stop = async (signal: string) => {
    console.log(`[worker] ${signal} received, shutting down...`)
    await stopBoss(30)
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGINT', () => void stop('SIGINT'))
  process.on('SIGTERM', () => void stop('SIGTERM'))
}

main().catch((err) => {
  console.error('[worker] Fatal error:', err)
  process.exit(1)
})
