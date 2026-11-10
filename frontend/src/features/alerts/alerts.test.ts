import { describe, expect, it } from 'vitest'
import { normaliseInternationalPhone } from '../../lib/phone'
import { applyStop, emptyAlertState, inQuietHours, planAlerts, quietHoursEnd, setPref } from './rules'
import { renderAlert, smsSegments } from './templates'
import type { AlertState } from './types'
import { scheduledAlerts } from './scheduled'

// 10:00 Harare (08:00 UTC) and 23:00 Harare (21:00 UTC)
const DAY = new Date('2026-11-10T08:00:00Z')
const NIGHT = new Date('2026-11-10T21:00:00Z')
let n = 0
const id = () => `a${++n}`

function optedIn(event: 'order.paid' | 'premium.due' = 'order.paid'): AlertState {
  const s = emptyAlertState()
  return { ...s, prefs: setPref(setPref(s.prefs, event, 'sms', true), event, 'whatsapp', true) }
}

describe('phone', () => {
  it('accepts local Zimbabwe and international numbers', () => {
    expect(normaliseInternationalPhone('0771234567')).toBe('+263771234567')
    expect(normaliseInternationalPhone('+44 7700 900123')).toBe('+447700900123')
    expect(normaliseInternationalPhone('0112345')).toBeNull()
    expect(normaliseInternationalPhone('447700900123')).toBeNull()
  })
})

describe('templates', () => {
  it('renders placeholders and falls back to English', () => {
    const r = renderAlert('order.paid', { name: 'Tendai', ref: 'ORD-1', amount: 'USD 50' }, 'sn')
    expect(r.body).toContain('Tendai')
    expect(r.body).toContain('ORD-1')
    expect(r.params).toEqual(['Tendai', 'ORD-1', 'USD 50'])
  })
  it('counts segments', () => {
    expect(smsSegments('x'.repeat(160))).toBe(1)
    expect(smsSegments('x'.repeat(161))).toBe(2)
  })
})

describe('planAlerts', () => {
  const recipient = { phone: '0771234567' }
  const input = { event: 'order.paid' as const, recipient, payload: { name: 'T', ref: 'O1', amount: '$5' }, ref: 'O1:paid' }

  it('blocks when not opted in', () => {
    const [r] = planAlerts(input, emptyAlertState(), DAY, id)
    expect(r.status).toBe('blocked')
    expect(r.reason).toBe('not opted in')
  })

  it('fans out to every opted-in channel', () => {
    const recs = planAlerts(input, optedIn(), DAY, id)
    expect(recs.map((r) => r.channel)).toEqual(['sms', 'whatsapp'])
    expect(recs.every((r) => r.status === 'queued')).toBe(true)
  })

  it("a recipient's preferred channel wins over prefs", () => {
    const recs = planAlerts({ ...input, recipient: { ...recipient, preferredChannel: 'whatsapp' } }, emptyAlertState(), DAY, id)
    expect(recs).toHaveLength(1)
    expect(recs[0].channel).toBe('whatsapp')
    expect(recs[0].status).toBe('queued')
  })

  it('blocks invalid numbers and STOP replies', () => {
    expect(planAlerts({ ...input, recipient: { phone: '123' } }, optedIn(), DAY, id)[0].reason).toBe('invalid phone number')
    const stopped = applyStop(optedIn(), 'sms', '0771234567')
    const recs = planAlerts(input, stopped, DAY, id)
    expect(recs.find((r) => r.channel === 'sms')?.reason).toBe('recipient replied STOP')
    expect(recs.find((r) => r.channel === 'whatsapp')?.status).toBe('queued')
  })

  it('requires consent for third-party events', () => {
    const procession = { event: 'procession.started' as const, payload: { deceased: 'X' }, ref: 'p1' }
    const state = { ...emptyAlertState(), prefs: setPref({}, 'procession.started', 'sms', true) }
    expect(planAlerts({ ...procession, recipient }, state, DAY, id)[0].reason).toBe('no consent recorded')
    expect(planAlerts({ ...procession, recipient: { ...recipient, consent: true } }, state, DAY, id)[0].status).toBe('queued')
  })

  it('dedupes repeat alerts but allows retry after failure', () => {
    const first = planAlerts(input, optedIn(), DAY, id)
    const withOutbox = { ...optedIn(), outbox: first }
    expect(planAlerts(input, withOutbox, DAY, id).every((r) => r.reason === 'duplicate')).toBe(true)
    const failed = { ...optedIn(), outbox: first.map((r) => ({ ...r, status: 'failed' as const })) }
    expect(planAlerts(input, failed, DAY, id).every((r) => r.status === 'queued')).toBe(true)
  })

  it('holds non-urgent alerts during quiet hours, not urgent ones', () => {
    expect(inQuietHours(DAY)).toBe(false)
    expect(inQuietHours(NIGHT)).toBe(true)
    const [held] = planAlerts(input, optedIn(), NIGHT, id)
    expect(held.sendAfter).toBe(quietHoursEnd(NIGHT))
    expect(held.sendAfter).toBe('2026-11-11T04:00:00.000Z')
    const urgent = { event: 'stream.live' as const, recipient: { ...recipient, consent: true }, payload: { deceased: 'X', link: 'l' }, ref: 's1' }
    const state = { ...emptyAlertState(), prefs: setPref({}, 'stream.live', 'sms', true) }
    expect(planAlerts(urgent, state, NIGHT, id)[0].sendAfter).toBeUndefined()
  })
})

describe('scheduledAlerts', () => {
  const account = { name: 'Tendai Moyo', phone: '0771234567' }
  const today = new Date(2026, 10, 10) // 10 Nov 2026, local
  const reminder = (date: string) => ({ id: 'r1', person: 'Gogo', kind: 'anniversary' as const, date, note: '' })

  it('alerts 7 and 1 days before a yearly reminder, and not otherwise', () => {
    expect(scheduledAlerts(account, [reminder('2020-11-17')], undefined, today)).toHaveLength(1)
    expect(scheduledAlerts(account, [reminder('2020-11-11')], undefined, today)[0].payload.when).toBe('tomorrow')
    expect(scheduledAlerts(account, [reminder('2020-11-20')], undefined, today)).toHaveLength(0)
  })

  it('alerts 3 days before a premium is due', () => {
    const out = scheduledAlerts(account, [], { monthlyPremium: 12, paymentDay: 13 }, today)
    expect(out.map((o) => o.event)).toEqual(['premium.due'])
    expect(scheduledAlerts(account, [], { monthlyPremium: 12, paymentDay: 20 }, today)).toHaveLength(0)
  })
})
