import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { deliverAlert } from './deliver'
import { MemoryAlertStore } from './memoryStore'
import { MAX_ATTEMPTS, processOutboxJob } from './outbox'
import { AfricasTalkingSmsProvider, TwilioSmsProvider } from './providers/sms'
import { enqueueOutbox, SMS_QUEUE_NAME, WHATSAPP_QUEUE_NAME } from './queues'
import { verifyTwilioSignature } from './routes'
import type { OutboxRow, SendResult } from './types'
import { handleAfricasTalkingDlr, handleBaileysStatus, handleInboundText, handleTwilioWebhook } from './webhooks'

const DAY = new Date('2026-11-10T08:00:00Z') // 10:00 Harare
const NIGHT = new Date('2026-11-10T21:00:00Z') // 23:00 Harare

const base = {
  event: 'order.paid' as const, channel: 'sms' as const, phone: '0771234567',
  payload: { name: 'Tendai', ref: 'FS-1', amount: 'US$5' }, ref: 'o1:paid', explicitChoice: true,
}
const deps = (store: MemoryAlertStore, now = DAY) => ({ store, enabled: true, now: () => now })
const json = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status })

/** A sender that returns the given results in order, then succeeds. */
function sender(results: SendResult[] = []) {
  const sent: OutboxRow[] = []
  const send = async (row: OutboxRow): Promise<SendResult> => {
    sent.push(row)
    return results.shift() ?? { ok: true, provider: 'fake', messageId: `m${sent.length}` }
  }
  return { send, sent }
}

describe('deliverAlert', () => {
  it('records nothing when alerts are disabled', async () => {
    const store = new MemoryAlertStore()
    const out = await deliverAlert({ store, enabled: false }, base)
    assert.equal(out.skipped, 'disabled')
    assert.equal((await store.list({ limit: 10 })).length, 0)
  })

  it('queues an opted-in message with an E.164 recipient and hands it to the queue', async () => {
    const store = new MemoryAlertStore()
    const enqueued: OutboxRow[] = []
    const out = await deliverAlert({ ...deps(store), enqueue: async (r) => { enqueued.push(r) } }, base)
    assert.equal(out.row?.status, 'queued')
    assert.equal(out.row?.recipient, '+263771234567')
    assert.deepEqual(enqueued.map((r) => r.id), [out.row?.id])
  })

  it('marks the row failed when the queue is down, instead of leaving it looking pending', async () => {
    const store = new MemoryAlertStore()
    const out = await deliverAlert({ ...deps(store), enqueue: async () => { throw new Error('connection refused') } }, base)
    assert.equal(out.row?.status, 'failed')
    assert.match(out.row?.error ?? '', /could not queue: connection refused/)
  })

  it('blocks invalid numbers, opt-outs, missing opt-in and missing consent', async () => {
    const store = new MemoryAlertStore()
    assert.equal((await deliverAlert(deps(store), { ...base, phone: '12' })).row?.blockedReason, 'invalid phone number')
    await store.optOut('sms', '+263771234567')
    assert.equal((await deliverAlert(deps(store), base)).row?.blockedReason, 'recipient opted out')
    const fresh = new MemoryAlertStore()
    assert.equal((await deliverAlert(deps(fresh), { ...base, explicitChoice: false, userId: 'u1' })).row?.blockedReason, 'not opted in')
    await fresh.setEnabled('u1', 'order.paid', 'sms', true)
    assert.equal((await deliverAlert(deps(fresh), { ...base, explicitChoice: false, userId: 'u1' })).row?.status, 'queued')
    const third = { ...base, event: 'stream.live' as const, payload: { deceased: 'X', link: 'l' }, ref: 's1' }
    assert.equal((await deliverAlert(deps(fresh), third)).row?.blockedReason, 'no consent recorded')
    assert.equal((await deliverAlert(deps(fresh), { ...third, thirdPartyConsent: true })).row?.status, 'queued')
  })

  it('dedupes, but allows a retry after a failure', async () => {
    const store = new MemoryAlertStore()
    const first = await deliverAlert(deps(store), base)
    assert.equal((await deliverAlert(deps(store), base)).skipped, 'duplicate')
    await store.update(first.row!.id, { status: 'failed' })
    assert.equal((await deliverAlert(deps(store), base)).row?.status, 'queued')
  })

  it('holds non-urgent messages until 06:00 Harare, but not urgent ones', async () => {
    const store = new MemoryAlertStore()
    const held = await deliverAlert(deps(store, NIGHT), base)
    assert.equal(held.row?.scheduledFor.toISOString(), '2026-11-11T04:00:00.000Z')
    const urgent = await deliverAlert(deps(store, NIGHT), { ...base, event: 'stream.live', payload: { deceased: 'X', link: 'l' }, ref: 's', thirdPartyConsent: true })
    assert.equal(urgent.row?.scheduledFor.toISOString(), NIGHT.toISOString())
  })
})

describe('queue', () => {
  it('routes by channel and delays held messages with startAfter', async () => {
    const calls: { name: string; data: unknown; options: { startAfter?: Date; retryLimit?: number } }[] = []
    const boss = { send: async (name: string, data: unknown, options: { startAfter?: Date; retryLimit?: number }) => { calls.push({ name, data, options }); return 'job-1' } }
    const future = new Date(Date.now() + 3_600_000)
    await enqueueOutbox(boss as never, { id: 'a', channel: 'sms', scheduledFor: new Date(Date.now() - 1000) })
    await enqueueOutbox(boss as never, { id: 'b', channel: 'whatsapp', scheduledFor: future })
    assert.equal(calls[0].name, SMS_QUEUE_NAME)
    assert.equal(calls[0].options.startAfter, undefined)
    assert.equal(calls[0].options.retryLimit, 2)
    assert.deepEqual(calls[1].data, { outboxId: 'b' })
    assert.equal(calls[1].name, WHATSAPP_QUEUE_NAME)
    assert.equal(calls[1].options.startAfter, future)
  })

  it('throws when pg-boss does not accept the job', async () => {
    const boss = { send: async () => null }
    await assert.rejects(enqueueOutbox(boss as never, { id: 'a', channel: 'sms', scheduledFor: new Date() }), /did not accept/)
  })
})

describe('processOutboxJob', () => {
  async function queued(channel: 'sms' | 'whatsapp' = 'sms') {
    const store = new MemoryAlertStore()
    const { row } = await deliverAlert(deps(store), { ...base, channel })
    return { store, id: row!.id }
  }

  it('sends the row and records the provider message id', async () => {
    const { store, id } = await queued()
    const s = sender()
    assert.equal(await processOutboxJob({ store, send: s.send }, id), 'sent')
    const row = await store.get(id)
    assert.equal(row?.status, 'sent')
    assert.equal(row?.providerMessageId, 'm1')
    assert.equal(s.sent[0].recipient, '+263771234567')
  })

  it('never sends the same message twice if a job is re-delivered', async () => {
    const { store, id } = await queued()
    const s = sender()
    await processOutboxJob({ store, send: s.send }, id)
    assert.equal(await processOutboxJob({ store, send: s.send }, id), 'skipped')
    assert.equal(s.sent.length, 1)
  })

  it('asks for a retry on a retryable failure, then fails after the last attempt', async () => {
    const { store, id } = await queued('sms')
    const fail: SendResult = { ok: false, provider: 'fake', error: 'timeout', retryable: true }
    const s = sender([fail, fail, fail])
    const outcomes = []
    for (let i = 0; i < MAX_ATTEMPTS.sms; i++) outcomes.push(await processOutboxJob({ store, send: s.send }, id))
    assert.deepEqual(outcomes, ['retry', 'retry', 'failed'])
    const row = await store.get(id)
    assert.equal(row?.status, 'failed')
    assert.equal(row?.attempts, 3)
  })

  it('does not retry permanent failures', async () => {
    const { store, id } = await queued('whatsapp')
    const s = sender([{ ok: false, provider: 'baileys', error: 'Number is not on WhatsApp', retryable: false }])
    assert.equal(await processOutboxJob({ store, send: s.send }, id), 'failed')
    assert.equal((await store.get(id))?.error, 'Number is not on WhatsApp')
  })

  it('treats a throwing sender as a retryable failure', async () => {
    const { store, id } = await queued()
    const out = await processOutboxJob({ store, send: async () => { throw new Error('socket closed') } }, id)
    assert.equal(out, 'retry')
    assert.equal((await store.get(id))?.error, 'socket closed')
  })

  it('drops a message whose recipient replied STOP while it waited', async () => {
    const { store, id } = await queued()
    await store.optOut('sms', '+263771234567')
    const s = sender()
    assert.equal(await processOutboxJob({ store, send: s.send }, id), 'blocked')
    assert.equal(s.sent.length, 0)
    assert.equal((await store.get(id))?.blockedReason, 'recipient opted out')
  })

  it('ignores an unknown row id', async () => {
    assert.equal(await processOutboxJob({ store: new MemoryAlertStore(), send: sender().send }, 'nope'), 'skipped')
  })
})

describe('webhooks', () => {
  async function sentRow(provider: string, messageId: string, channel: 'sms' | 'whatsapp' = 'sms') {
    const store = new MemoryAlertStore()
    const { row } = await deliverAlert(deps(store), { ...base, channel })
    await store.update(row!.id, { status: 'sent', provider, providerMessageId: messageId })
    return store
  }

  it('applies Africa\'s Talking and Twilio receipts, and never downgrades delivered', async () => {
    const at = await sentRow('africastalking', 'ATXid_1')
    await handleAfricasTalkingDlr(at, { id: 'ATXid_1', status: 'Success' })
    assert.equal((await at.list({ limit: 1 }))[0].status, 'delivered')
    await handleAfricasTalkingDlr(at, { id: 'ATXid_1', status: 'Failed' })
    assert.equal((await at.list({ limit: 1 }))[0].status, 'delivered')

    const tw = await sentRow('twilio', 'SM1')
    await handleTwilioWebhook(tw, { MessageSid: 'SM1', MessageStatus: 'undelivered', ErrorCode: '30003' })
    const [row] = await tw.list({ limit: 1 })
    assert.equal(row.status, 'failed')
    assert.equal(row.error, 'Twilio error 30003')
  })

  it('maps Baileys message statuses: acks are ignored, delivered and read count, 0 is a failure', async () => {
    const store = await sentRow('baileys', 'BAE5', 'whatsapp')
    assert.equal(await handleBaileysStatus(store, 'BAE5', 2), false)
    assert.equal((await store.list({ limit: 1 }))[0].status, 'sent')
    await handleBaileysStatus(store, 'BAE5', 3)
    assert.equal((await store.list({ limit: 1 }))[0].status, 'delivered')
    await handleBaileysStatus(store, 'BAE5', 4)
    assert.equal((await store.list({ limit: 1 }))[0].status, 'delivered')

    const bad = await sentRow('baileys', 'BAE6', 'whatsapp')
    await handleBaileysStatus(bad, 'BAE6', 0)
    assert.equal((await bad.list({ limit: 1 }))[0].status, 'failed')
  })

  it('handles STOP and START replies, and does not treat "yes" as opting back in', async () => {
    const store = new MemoryAlertStore()
    await handleInboundText(store, 'whatsapp', '263771234567', ' STOP ')
    assert.equal(await store.isOptedOut('whatsapp', '+263771234567'), true)
    assert.equal(await store.isOptedOut('sms', '+263771234567'), false)
    await handleInboundText(store, 'whatsapp', '263771234567', 'yes')
    assert.equal(await store.isOptedOut('whatsapp', '+263771234567'), true)
    await handleInboundText(store, 'whatsapp', '263771234567', 'start')
    assert.equal(await store.isOptedOut('whatsapp', '+263771234567'), false)
  })

  it('verifies Twilio signatures', () => {
    const url = 'https://x.test/api/alerts/webhooks/twilio'
    const params = { MessageSid: 'SM1', MessageStatus: 'delivered' }
    const expected = createHmac('sha1', 'tok').update(`${url}MessageSidSM1MessageStatusdelivered`).digest('base64')
    assert.equal(verifyTwilioSignature(url, params, expected, 'tok'), true)
    assert.equal(verifyTwilioSignature(url, { ...params, MessageStatus: 'failed' }, expected, 'tok'), false)
    assert.equal(verifyTwilioSignature(url, params, undefined, 'tok'), false)
  })
})

describe('SMS providers', () => {
  it('Africa\'s Talking: accepts 101, rejects an invalid number, retries on 5xx', async () => {
    const ok = new AfricasTalkingSmsProvider({ apiKey: 'k', username: 'sandbox' }, json({ SMSMessageData: { Recipients: [{ statusCode: 101, status: 'Success', messageId: 'ATXid_9' }] } }) as typeof fetch)
    assert.deepEqual(await ok.send('+263771234567', 'hi'), { ok: true, provider: 'africastalking', messageId: 'ATXid_9' })
    const bad = new AfricasTalkingSmsProvider({ apiKey: 'k', username: 'u' }, json({ SMSMessageData: { Recipients: [{ statusCode: 403, status: 'InvalidPhoneNumber' }] } }) as typeof fetch)
    const r = await bad.send('+1', 'hi')
    assert.equal(r.ok, false)
    assert.equal(r.retryable, false)
    const down = new AfricasTalkingSmsProvider({ apiKey: 'k', username: 'u' }, json({}, 503) as typeof fetch)
    assert.equal((await down.send('+263771234567', 'hi')).retryable, true)
  })

  it('Twilio: returns the sid and sends basic auth', async () => {
    let seen: RequestInit | undefined
    const p = new TwilioSmsProvider({ accountSid: 'AC1', authToken: 't', from: '+1555' }, (async (_u: unknown, init?: RequestInit) => { seen = init; return new Response(JSON.stringify({ sid: 'SM9' })) }) as typeof fetch)
    assert.equal((await p.send('+263771234567', 'hi')).messageId, 'SM9')
    assert.match((seen?.headers as Record<string, string>).Authorization, /^Basic /)
  })
})

describe('shared templates', () => {
  it('stay identical to the frontend copies (run `npm run sync:alerts` if this fails)', () => {
    const front = join(__dirname, '..', '..', '..', 'frontend', 'src')
    const pairs: [string, string][] = [
      [join(front, 'features', 'alerts', 'types.ts'), join(__dirname, 'shared', 'types.ts')],
      [join(front, 'features', 'alerts', 'templates.ts'), join(__dirname, 'shared', 'templates.ts')],
      [join(front, 'lib', 'phone.ts'), join(__dirname, 'shared', 'phone.ts')],
    ]
    for (const [a, b] of pairs) assert.equal(readFileSync(b, 'utf8'), readFileSync(a, 'utf8'), `${b} has drifted`)
  })
})
