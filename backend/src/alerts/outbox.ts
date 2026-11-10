import type { AlertStore, RowSender, SendResult } from './types'

/** Attempts per message across the queue's retries (the first try plus the retries configured in queues.ts). */
export const MAX_ATTEMPTS = { sms: 3, whatsapp: 2 } as const

export type OutboxOutcome = 'sent' | 'skipped' | 'blocked' | 'failed' | 'retry'

export interface OutboxDeps {
  store: AlertStore
  send: RowSender
}

/**
 * Sends one queued outbox row. Used by both consumers (SMS in the worker, WhatsApp in the bridge).
 * Returns `retry` when the queue should try again: the caller throws so pg-boss applies its retry delay.
 */
export async function processOutboxJob(deps: OutboxDeps, outboxId: string): Promise<OutboxOutcome> {
  const row = await deps.store.get(outboxId)
  // A re-delivered job for a message that already went out must not send twice.
  if (!row || (row.status !== 'queued' && row.status !== 'sending')) return 'skipped'

  // A STOP may have arrived while the message was waiting (quiet hours, retry delay).
  if (await deps.store.isOptedOut(row.channel, row.recipient)) {
    await deps.store.update(row.id, { status: 'blocked', blockedReason: 'recipient opted out' })
    return 'blocked'
  }

  const attempts = row.attempts + 1
  let result: SendResult
  try {
    result = await deps.send(row)
  } catch (err) {
    result = { ok: false, provider: row.provider ?? 'unknown', error: (err as Error).message, retryable: true }
  }

  if (result.ok) {
    await deps.store.update(row.id, {
      status: 'sent', attempts, provider: result.provider, providerMessageId: result.messageId, error: undefined,
    })
    return 'sent'
  }
  if (result.retryable && attempts < MAX_ATTEMPTS[row.channel]) {
    await deps.store.update(row.id, { status: 'queued', attempts, provider: result.provider, error: result.error })
    return 'retry'
  }
  await deps.store.update(row.id, { status: 'failed', attempts, provider: result.provider, error: result.error })
  return 'failed'
}
