import { randomUUID } from 'node:crypto'
import type { AlertChannel, AlertEvent, AlertStore, OutboxRow, OutboxStatus } from './types'

/** In-memory AlertStore for tests and local development. Production uses a Prisma-backed store. */
export class MemoryAlertStore implements AlertStore {
  private rows: OutboxRow[] = []
  private optedOut = new Set<string>()
  private prefs = new Map<string, boolean>()

  async insert(row: Omit<OutboxRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OutboxRow> {
    const now = new Date()
    const created: OutboxRow = { ...row, id: randomUUID(), createdAt: now, updatedAt: now }
    this.rows.push(created)
    return { ...created }
  }

  async findByDedupeKey(key: string) {
    const hit = this.rows.find((r) => r.dedupeKey === key && r.status !== 'blocked' && r.status !== 'failed')
    return hit && { ...hit }
  }

  async findByProviderMessageId(provider: string, id: string) {
    const hit = this.rows.find((r) => r.provider === provider && r.providerMessageId === id)
    return hit && { ...hit }
  }

  async get(id: string) {
    const row = this.rows.find((r) => r.id === id)
    return row && { ...row }
  }

  async update(id: string, patch: Partial<OutboxRow>) {
    const row = this.rows.find((r) => r.id === id)
    if (!row) throw new Error(`No outbox row ${id}`)
    Object.assign(row, patch, { updatedAt: new Date() })
    return { ...row }
  }

  async list({ status, limit }: { status?: OutboxStatus; limit: number }) {
    return this.rows
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((r) => ({ ...r }))
  }

  async isOptedOut(channel: AlertChannel, phone: string) { return this.optedOut.has(`${channel}|${phone}`) }
  async optOut(channel: AlertChannel, phone: string) { this.optedOut.add(`${channel}|${phone}`) }
  async optIn(channel: AlertChannel, phone: string) { this.optedOut.delete(`${channel}|${phone}`) }

  async listOptOuts() {
    return [...this.optedOut].map((k) => {
      const [channel, phone] = k.split('|')
      return { channel: channel as AlertChannel, phone }
    })
  }

  async listPreferences(userId: string) {
    return [...this.prefs]
      .filter(([k]) => k.startsWith(`${userId}|`))
      .map(([k, enabled]) => {
        const [, event, channel] = k.split('|')
        return { event: event as AlertEvent, channel: channel as AlertChannel, enabled }
      })
  }

  async isEnabled(userId: string, event: AlertEvent, channel: AlertChannel) {
    return this.prefs.get(`${userId}|${event}|${channel}`) === true
  }
  async setEnabled(userId: string, event: AlertEvent, channel: AlertChannel, enabled: boolean) {
    this.prefs.set(`${userId}|${event}|${channel}`, enabled)
  }
}
