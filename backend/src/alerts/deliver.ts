import { normaliseInternationalPhone } from './shared/phone'
import { renderAlert } from './shared/templates'
import { inQuietHours, quietHoursEnd, URGENT } from './quiet'
import type { AlertEvent, AlertStore, DeliverInput, OutboxRow } from './types'

/** Events sent to someone other than the account holder: they need explicit consent. */
const THIRD_PARTY: ReadonlySet<AlertEvent> = new Set<AlertEvent>([
  'procession.started', 'procession.stopped', 'stream.live', 'aftercare.thank_you', 'funeral.schedule_changed',
])

export interface DeliverDeps {
  store: AlertStore
  /** The master switch (ALERTS_ENABLED). When false nothing is recorded or sent. */
  enabled: boolean
  now?: () => Date
  /** Hands a queued row to the job queue (pg-boss). Omit in tests that only check the guards. */
  enqueue?: (row: OutboxRow) => Promise<void>
}

export interface DeliverOutcome {
  /** `null` when alerts are disabled or the message duplicates one already queued or sent. */
  row: OutboxRow | null
  skipped?: 'disabled' | 'duplicate'
}

/**
 * The single entry point every producer calls. Applies the guards in order (phone, opt-out, consent,
 * dedupe, quiet hours) and records a queued row for the worker. Blocked messages are recorded so staff can
 * see why nothing went out. Rule violations never throw; only a store failure can reject.
 */
export async function deliverAlert(deps: DeliverDeps, input: DeliverInput): Promise<DeliverOutcome> {
  if (!deps.enabled) return { row: null, skipped: 'disabled' }
  const now = (deps.now ?? (() => new Date()))()
  const { store } = deps
  const to = normaliseInternationalPhone(input.phone)
  const rendered = renderAlert(input.event, input.payload, input.language)
  const base = {
    channel: input.channel,
    event: input.event,
    recipient: to ?? input.phone,
    templateId: rendered.templateId,
    body: rendered.body,
    params: rendered.params,
    attempts: 0,
    dedupeKey: [input.event, input.channel, to ?? input.phone, input.ref].join('|'),
  }
  const blocked = (reason: string) => store.insert({ ...base, status: 'blocked', blockedReason: reason, scheduledFor: now })

  if (!to) return { row: await blocked('invalid phone number') }
  if (await store.isOptedOut(input.channel, to)) return { row: await blocked('recipient opted out') }

  if (THIRD_PARTY.has(input.event)) {
    if (!input.thirdPartyConsent) return { row: await blocked('no consent recorded') }
  } else if (!input.explicitChoice) {
    const enabled = input.userId ? await store.isEnabled(input.userId, input.event, input.channel) : false
    if (!enabled) return { row: await blocked('not opted in') }
  }

  if (await store.findByDedupeKey(base.dedupeKey)) return { row: null, skipped: 'duplicate' }

  let scheduledFor = input.sendAt ?? now
  if (!URGENT.has(input.event) && inQuietHours(scheduledFor)) scheduledFor = quietHoursEnd(scheduledFor)
  const queued = await store.insert({ ...base, status: 'queued', scheduledFor })
  if (!deps.enqueue) return { row: queued }
  try {
    await deps.enqueue(queued)
    return { row: queued }
  } catch (err) {
    // The queue is down: record that this message never left, rather than leaving a row that looks pending forever.
    return { row: await store.update(queued.id, { status: 'failed', error: `could not queue: ${(err as Error).message}` }) }
  }
}
