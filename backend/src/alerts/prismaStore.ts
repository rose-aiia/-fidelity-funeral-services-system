import type { PrismaClient, AlertOutbox } from '@prisma/client'
import type { AlertChannel, AlertEvent, AlertStore, OutboxRow, OutboxStatus } from './types'

// Prisma enums are upper-case; the pipeline uses lower-case strings. Map at the boundary only.
const toDbChannel = (c: AlertChannel) => (c === 'sms' ? 'SMS' : 'WHATSAPP') as 'SMS' | 'WHATSAPP'
const fromDbChannel = (c: 'SMS' | 'WHATSAPP'): AlertChannel => (c === 'SMS' ? 'sms' : 'whatsapp')
const toDbStatus = (s: OutboxStatus) => s.toUpperCase() as Uppercase<OutboxStatus>
const fromDbStatus = (s: string) => s.toLowerCase() as OutboxStatus

function toRow(r: AlertOutbox): OutboxRow {
  return {
    id: r.id,
    channel: fromDbChannel(r.channel),
    event: r.event as AlertEvent,
    recipient: r.recipient,
    templateId: r.templateId,
    body: r.body,
    params: r.params,
    status: fromDbStatus(r.status),
    provider: r.provider ?? undefined,
    providerMessageId: r.providerMessageId ?? undefined,
    attempts: r.attempts,
    error: r.error ?? undefined,
    blockedReason: r.blockedReason ?? undefined,
    dedupeKey: r.dedupeKey,
    scheduledFor: r.scheduledFor,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

/** Persistent AlertStore on Postgres. Shared by the API, the SMS worker and the WhatsApp bridge. */
export class PrismaAlertStore implements AlertStore {
  constructor(private readonly db: PrismaClient) {}

  async insert(row: Omit<OutboxRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OutboxRow> {
    const created = await this.db.alertOutbox.create({
      data: {
        channel: toDbChannel(row.channel), event: row.event, recipient: row.recipient, templateId: row.templateId,
        body: row.body, params: row.params, status: toDbStatus(row.status), provider: row.provider ?? null,
        providerMessageId: row.providerMessageId ?? null, attempts: row.attempts, error: row.error ?? null,
        blockedReason: row.blockedReason ?? null, dedupeKey: row.dedupeKey, scheduledFor: row.scheduledFor,
      },
    })
    return toRow(created)
  }

  async findByDedupeKey(key: string) {
    const hit = await this.db.alertOutbox.findFirst({
      where: { dedupeKey: key, status: { notIn: ['BLOCKED', 'FAILED'] } },
      orderBy: { createdAt: 'desc' },
    })
    return hit ? toRow(hit) : undefined
  }

  async findByProviderMessageId(provider: string, id: string) {
    const hit = await this.db.alertOutbox.findFirst({ where: { provider, providerMessageId: id } })
    return hit ? toRow(hit) : undefined
  }

  async get(id: string) {
    const hit = await this.db.alertOutbox.findUnique({ where: { id } })
    return hit ? toRow(hit) : undefined
  }

  async update(id: string, patch: Partial<OutboxRow>) {
    const { status, channel, id: _id, createdAt: _c, updatedAt: _u, ...rest } = patch
    const updated = await this.db.alertOutbox.update({
      where: { id },
      data: {
        ...rest,
        // `undefined` means "leave alone" in Prisma; a patch that sets error to undefined means "clear it".
        ...('error' in patch ? { error: patch.error ?? null } : {}),
        ...(status ? { status: toDbStatus(status) } : {}),
        ...(channel ? { channel: toDbChannel(channel) } : {}),
      },
    })
    return toRow(updated)
  }

  async list({ status, limit }: { status?: OutboxStatus; limit: number }) {
    const rows = await this.db.alertOutbox.findMany({
      where: status ? { status: toDbStatus(status) } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map(toRow)
  }

  async isOptedOut(channel: AlertChannel, phone: string) {
    return (await this.db.alertOptOut.count({ where: { phone, channel: toDbChannel(channel) } })) > 0
  }

  async optOut(channel: AlertChannel, phone: string) {
    const key = { phone, channel: toDbChannel(channel) }
    await this.db.alertOptOut.upsert({ where: { phone_channel: key }, create: key, update: {} })
  }

  async optIn(channel: AlertChannel, phone: string) {
    await this.db.alertOptOut.deleteMany({ where: { phone, channel: toDbChannel(channel) } })
  }

  async listOptOuts() {
    const rows = await this.db.alertOptOut.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 })
    return rows.map((r) => ({ channel: fromDbChannel(r.channel), phone: r.phone }))
  }

  async listPreferences(userId: string) {
    const rows = await this.db.alertPreference.findMany({ where: { userId } })
    return rows.map((r) => ({ event: r.event as AlertEvent, channel: fromDbChannel(r.channel), enabled: r.enabled }))
  }

  async isEnabled(userId: string, event: AlertEvent, channel: AlertChannel) {
    const pref = await this.db.alertPreference.findUnique({
      where: { userId_event_channel: { userId, event, channel: toDbChannel(channel) } },
    })
    return pref?.enabled === true
  }

  async setEnabled(userId: string, event: AlertEvent, channel: AlertChannel, enabled: boolean) {
    const key = { userId, event, channel: toDbChannel(channel) }
    await this.db.alertPreference.upsert({
      where: { userId_event_channel: key },
      create: { ...key, enabled },
      update: { enabled },
    })
  }
}
