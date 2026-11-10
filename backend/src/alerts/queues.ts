import type { PgBoss, QueueOptions } from 'pg-boss'
import type { OutboxRow } from './types'

export const WHATSAPP_QUEUE_NAME = 'send-whatsapp'
export const SMS_QUEUE_NAME = 'send-sms'

/** WhatsApp: the bridge consumes this, one retry (Kuwana's settings). */
export const WHATSAPP_QUEUE_OPTIONS: QueueOptions = {
  expireInSeconds: 60,
  retentionSeconds: 24 * 60 * 60,
  deleteAfterSeconds: 24 * 60 * 60,
  retryLimit: 1,
  retryDelay: 15,
}

/** SMS: the worker consumes this. Two retries with a longer pause, since provider outages last a while. */
export const SMS_QUEUE_OPTIONS: QueueOptions = {
  expireInSeconds: 60,
  retentionSeconds: 24 * 60 * 60,
  deleteAfterSeconds: 24 * 60 * 60,
  retryLimit: 2,
  retryDelay: 30,
}

/** Jobs carry only the outbox row id; the row is the source of truth for text, recipient and status. */
export type SendJob = { outboxId: string }

const queueFor = (channel: OutboxRow['channel']) => (channel === 'sms' ? SMS_QUEUE_NAME : WHATSAPP_QUEUE_NAME)

export async function ensureQueues(boss: PgBoss): Promise<void> {
  await boss.createQueue(WHATSAPP_QUEUE_NAME, WHATSAPP_QUEUE_OPTIONS)
  await boss.createQueue(SMS_QUEUE_NAME, SMS_QUEUE_OPTIONS)
}

/** Hands a queued outbox row to pg-boss. Held messages (quiet hours) start after `scheduledFor`. */
export async function enqueueOutbox(boss: PgBoss, row: Pick<OutboxRow, 'id' | 'channel' | 'scheduledFor'>): Promise<void> {
  const options = row.channel === 'sms' ? SMS_QUEUE_OPTIONS : WHATSAPP_QUEUE_OPTIONS
  const startAfter = row.scheduledFor.getTime() > Date.now() ? row.scheduledFor : undefined
  const jobId = await boss.send(queueFor(row.channel), { outboxId: row.id } satisfies SendJob, { ...options, startAfter })
  if (!jobId) throw new Error(`pg-boss did not accept outbox row ${row.id}`)
}
