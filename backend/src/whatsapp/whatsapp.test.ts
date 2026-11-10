import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runWhatsAppInOrder } from './messageOrdering'
import { cancelReconnect, hasPendingReconnect, scheduleReconnect } from './pendingReconnect'
import { cleanWhatsAppJid, isWhatsAppUserJid, normalizePhoneInput, phoneToWhatsAppJid, whatsappJidToPhone } from './phone'
import { BASE_DELAY_MS, markOpen, MAX_DELAY_MS, nextBackoff, resetBackoff, STABLE_AFTER_MS } from './reconnectBackoff'
import { summarizeWhatsAppSockets } from './health'

describe('phone', () => {
  it('normalises input and builds and parses JIDs', () => {
    assert.equal(normalizePhoneInput(' +263 77-123 4567 '), '+263771234567')
    assert.equal(normalizePhoneInput('0771234567'), null)
    assert.equal(phoneToWhatsAppJid('+263771234567'), '263771234567@s.whatsapp.net')
    assert.equal(cleanWhatsAppJid('263771234567:12@S.whatsapp.net'), '263771234567@s.whatsapp.net')
    assert.equal(whatsappJidToPhone('263771234567:12@s.whatsapp.net'), '+263771234567')
  })

  it('accepts only individual chats', () => {
    assert.equal(isWhatsAppUserJid('263771234567@s.whatsapp.net'), true)
    assert.equal(isWhatsAppUserJid('123456@lid'), true)
    assert.equal(isWhatsAppUserJid('1203@g.us'), false)
    assert.equal(isWhatsAppUserJid('status@broadcast'), false)
    assert.equal(isWhatsAppUserJid(''), false)
  })
})

describe('reconnect backoff', () => {
  it('doubles up to the cap, and only resets after a connection stays up', () => {
    const k = 'test-backoff'
    resetBackoff(k)
    const delays = [0, 1, 2, 3, 4, 5, 6].map(() => nextBackoff(k, 0).delayMs)
    assert.equal(delays[0], BASE_DELAY_MS)
    assert.equal(delays[1], BASE_DELAY_MS * 2)
    assert.equal(delays.at(-1), MAX_DELAY_MS)

    // Opens and dies at once: the delay keeps growing rather than resetting.
    markOpen(k, 1000)
    assert.equal(nextBackoff(k, 1500).delayMs, MAX_DELAY_MS)
    // Stays open long enough: starts again from the short delay.
    markOpen(k, 10_000)
    assert.equal(nextBackoff(k, 10_000 + STABLE_AFTER_MS).delayMs, BASE_DELAY_MS)
    resetBackoff(k)
  })
})

describe('pending reconnect', () => {
  it('keeps one retry per key and lets a stop cancel it', async () => {
    let fired = 0
    scheduleReconnect('t1', 20, () => { fired += 1 })
    scheduleReconnect('t1', 20, () => { fired += 10 }) // replaces the first
    assert.equal(hasPendingReconnect('t1'), true)
    await new Promise((r) => setTimeout(r, 60))
    assert.equal(fired, 10)

    scheduleReconnect('t2', 20, () => { fired += 100 })
    assert.equal(cancelReconnect('t2'), true)
    await new Promise((r) => setTimeout(r, 40))
    assert.equal(fired, 10)
  })
})

describe('message ordering', () => {
  it('runs operations for the same key in order, and different keys concurrently', async () => {
    const log: string[] = []
    const slow = (label: string, ms: number) => async () => { await new Promise((r) => setTimeout(r, ms)); log.push(label) }
    await Promise.all([
      runWhatsAppInOrder('a', slow('a1', 30)),
      runWhatsAppInOrder('a', slow('a2', 1)),
      runWhatsAppInOrder('b', slow('b1', 5)),
    ])
    assert.ok(log.indexOf('a1') < log.indexOf('a2'))
    assert.ok(log.indexOf('b1') < log.indexOf('a1'))
  })

  it('keeps going after an earlier operation fails', async () => {
    await assert.rejects(runWhatsAppInOrder('c', async () => { throw new Error('boom') }), /boom/)
    assert.equal(await runWhatsAppInOrder('c', async () => 'ok'), 'ok')
  })
})

describe('health', () => {
  it('counts open and closed sockets', () => {
    assert.deepEqual(summarizeWhatsAppSockets([true, false]), { activeSessions: 2, connectedSessions: 1, disconnectedSessions: 1 })
    assert.deepEqual(summarizeWhatsAppSockets([]), { activeSessions: 0, connectedSessions: 0, disconnectedSessions: 0 })
  })
})
