import type { AlertChannel, AlertEvent, AlertLanguage, AlertPayload } from './shared/types'

export type { AlertChannel, AlertEvent, AlertLanguage, AlertPayload }

export type OutboxStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'blocked'

/** One outbound message. Mirrors the `AlertOutbox` Prisma model. */
export interface OutboxRow {
  id: string
  channel: AlertChannel
  event: AlertEvent
  /** E.164. */
  recipient: string
  templateId: string
  body: string
  params: string[]
  status: OutboxStatus
  provider?: string
  providerMessageId?: string
  attempts: number
  error?: string
  /** Why the message was blocked rather than queued. */
  blockedReason?: string
  dedupeKey: string
  /** Not sent before this time (quiet hours, scheduled reminders, retry back-off). */
  scheduledFor: Date
  createdAt: Date
  updatedAt: Date
}

export interface DeliverInput {
  event: AlertEvent
  channel: AlertChannel
  /** Any phone format; normalised to E.164 here. */
  phone: string
  language?: AlertLanguage
  payload: AlertPayload
  /** Stable reference for dedupe, e.g. `requestId:assigned`. */
  ref: string
  /** True when the person picked this channel themselves (e.g. a help request's contact preference), which stands in for a stored opt-in. */
  explicitChoice?: boolean
  /** Whether the recipient is a third party who has given explicit consent (relatives, mourners). */
  thirdPartyConsent?: boolean
  /** The recipient's user id when they are an account holder; used for preference lookup. */
  userId?: string
  /** Defaults to now. */
  sendAt?: Date
}

/** The persistence the alert pipeline needs. Implemented in memory for tests; Prisma in production. */
export interface AlertStore {
  insert(row: Omit<OutboxRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OutboxRow>
  findByDedupeKey(key: string): Promise<OutboxRow | undefined>
  findByProviderMessageId(provider: string, id: string): Promise<OutboxRow | undefined>
  get(id: string): Promise<OutboxRow | undefined>
  update(id: string, patch: Partial<OutboxRow>): Promise<OutboxRow>
  list(filter: { status?: OutboxStatus; limit: number }): Promise<OutboxRow[]>
  isOptedOut(channel: AlertChannel, phone: string): Promise<boolean>
  optOut(channel: AlertChannel, phone: string): Promise<void>
  optIn(channel: AlertChannel, phone: string): Promise<void>
  listOptOuts(): Promise<{ channel: AlertChannel; phone: string }[]>
  listPreferences(userId: string): Promise<{ event: AlertEvent; channel: AlertChannel; enabled: boolean }[]>
  /** Per-event opt-in. Defaults to false when never set. */
  isEnabled(userId: string, event: AlertEvent, channel: AlertChannel): Promise<boolean>
  setEnabled(userId: string, event: AlertEvent, channel: AlertChannel, enabled: boolean): Promise<void>
}

export interface SendResult {
  ok: boolean
  provider: string
  messageId?: string
  error?: string
  /** True when retrying could help (network, 5xx, rate limit). */
  retryable?: boolean
}

export interface SmsProvider {
  readonly name: string
  send(to: string, body: string): Promise<SendResult>
}

/** Sends one already-rendered outbox row. The SMS providers and the WhatsApp bridge both fit this shape. */
export type RowSender = (row: OutboxRow) => Promise<SendResult>
