import { describe, expect, it } from 'vitest'
import { seedRequests } from '../account/policy-records'
import {
  assignRequest,
  completeRequest,
  isUrgent,
  providerActions,
  respondToAssignment,
  sortForTriage,
  statusForAssignment,
} from '../account/request-flow'
import type { AssistanceRequest } from '../account/data'
import { marketplaceItems } from '../marketplace/data'
import { applyOrderStatus, seedOrderRecords, toPublicOrder } from '../marketplace/order-flow'
import { activeCatalogue, providerIdFor } from '../marketplace/catalogue'
import {
  buildOverview,
  earnedValue,
  isSharedOrder,
  orderActionsFor,
  requestActionsFor,
  scopeOrderForProvider,
  validateNewProvider,
} from './logic'
import { seedProviders } from './providers-seed'

const NOW = Date.parse('2026-11-03T12:00:00Z')
const allRequests = () => Object.entries(seedRequests(new Date(NOW))).flatMap(([userId, list]) => list.map((request) => ({ userId, request })))
const request = (reference: string): AssistanceRequest => allRequests().find((entry) => entry.request.reference === reference)!.request
const orders = () => seedOrderRecords(NOW).map(toPublicOrder)
const order = (reference: string) => orders().find((candidate) => candidate.reference === reference)!

describe('request lifecycle', () => {
  it('derives what a family sees from what the provider did', () => {
    expect(statusForAssignment('assigned')).toBe('assigned')
    expect(statusForAssignment('accepted')).toBe('in_progress')
    expect(statusForAssignment('completed')).toBe('complete')
    expect(statusForAssignment('declined')).toBe('received')
  })

  it('flags a bereavement nobody has taken on as urgent, including after a decline', () => {
    expect(isUrgent(request('AR-1051'))).toBe(true) // unassigned bereavement
    expect(isUrgent(request('AR-1049'))).toBe(false) // assigned
    expect(isUrgent(request('AR-1044'))).toBe(false) // a claim, not a bereavement
    const declined = respondToAssignment(request('AR-1049'), 'declined', NOW)
    expect(declined.ok && isUrgent(declined.request)).toBe(true)
  })

  it('triages urgent first, then open oldest first, then finished', () => {
    const order = sortForTriage(allRequests().map((entry) => entry.request)).map((entry) => entry.reference)
    expect(order[0]).toBe('AR-1051')
    expect(order[order.length - 1]).toBe('AR-1039')
    const open = order.slice(1, -1)
    const ages = open.map((reference) => request(reference).createdAt)
    expect(ages).toEqual([...ages].sort())
  })

  it('assigning sets the provider and the family-facing status', () => {
    const result = assignRequest(request('AR-1051'), { id: 'bulawayo-memorial-services', name: 'Bulawayo Memorial Services' }, ' Call before noon ', NOW)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request).toMatchObject({ status: 'assigned', assignedTo: 'Bulawayo Memorial Services' })
    expect(result.request.assignment).toMatchObject({ status: 'assigned', note: 'Call before noon' })
  })

  it('does not reassign a finished request', () => {
    expect(assignRequest(request('AR-1039'), { id: 'x', name: 'X' }, undefined, NOW)).toEqual({ ok: false, code: 'already_complete' })
  })

  it('walks accept then complete, and refuses skipping or repeating a step', () => {
    const accepted = respondToAssignment(request('AR-1042'), 'accepted', NOW)
    expect(accepted.ok && accepted.request.status).toBe('in_progress')
    if (!accepted.ok) return
    expect(respondToAssignment(accepted.request, 'accepted', NOW)).toEqual({ ok: false, code: 'invalid_transition' })
    expect(respondToAssignment(request('AR-1042'), 'completed', NOW)).toEqual({ ok: false, code: 'invalid_transition' })
    const done = respondToAssignment(accepted.request, 'completed', NOW)
    expect(done.ok && done.request.status).toBe('complete')
  })

  it('a declined request stops showing a provider as looking after it', () => {
    const declined = respondToAssignment(request('AR-1042'), 'declined', NOW)
    expect(declined.ok && declined.request.assignedTo).toBeUndefined()
  })

  it('an administrator can close a request directly', () => {
    const closed = completeRequest(request('AR-1051'), NOW)
    expect(closed.ok && closed.request.status).toBe('complete')
    expect(completeRequest(request('AR-1039'), NOW)).toEqual({ ok: false, code: 'already_complete' })
  })

  it('shows each role only the actions they may take', () => {
    expect(requestActionsFor(request('AR-1051'), 'admin')).toEqual(['assign', 'completed'])
    expect(requestActionsFor(request('AR-1039'), 'admin')).toEqual([])
    expect(requestActionsFor(request('AR-1042'), 'provider', 'harare-funeral-care')).toEqual(['accepted', 'declined'])
    expect(requestActionsFor(request('AR-1042'), 'provider', 'bulawayo-memorial-services')).toEqual([])
    expect(requestActionsFor(request('AR-1051'), 'provider', 'harare-funeral-care')).toEqual([])
    expect(providerActions(request('AR-1047'))).toEqual(['completed'])
  })
})

describe('order permissions', () => {
  it('lets an administrator make any legal move, including cancelling', () => {
    expect(orderActionsFor(order('FS-1035'), 'admin')).toEqual(['confirmed', 'cancelled'])
    expect(orderActionsFor(order('FS-1017'), 'admin')).toEqual([])
  })

  it('lets a provider move only orders that are wholly theirs, and never cancel', () => {
    expect(orderActionsFor(order('FS-1035'), 'provider', 'Msasa Florists')).toEqual(['confirmed'])
    expect(orderActionsFor(order('FS-1035'), 'provider', 'Highveld Events')).toEqual([]) // not theirs
    expect(orderActionsFor(order('FS-1026'), 'provider', 'Msasa Florists')).toEqual([]) // shared with another provider
    expect(isSharedOrder(order('FS-1026'))).toBe(true)
  })

  it('scopes a provider to their own lines and share of the money', () => {
    const scoped = scopeOrderForProvider(order('FS-1026'), 'Msasa Florists')
    expect(scoped.lines.map((line) => line.title)).toEqual(['Wreath & sympathy package'])
    expect(scoped).toMatchObject({ subtotal: 180, deliveryFee: 0, total: 180 })
  })

  it('counts only paid, uncancelled orders as earned', () => {
    expect(earnedValue(order('FS-1035'))).toBeGreaterThan(0)
    expect(earnedValue(order('FS-1031'))).toBe(0) // payment failed
    const cancelled = applyOrderStatus({ ...seedOrderRecords(NOW).find((record) => record.reference === 'FS-1035')! }, 'cancelled', 'Admin', NOW)
    expect(cancelled.ok && earnedValue(toPublicOrder(cancelled.record))).toBe(0)
  })

  it('a manual move stops the demo timer and records who did it', () => {
    const record = seedOrderRecords(NOW).find((candidate) => candidate.reference === 'FS-1035')!
    const moved = applyOrderStatus({ ...record, simulate: true }, 'confirmed', 'Msasa Florists', NOW)
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.record.simulate).toBe(false)
    expect(moved.record.events.at(-1)?.label).toBe('Confirmed by Msasa Florists')
    expect(applyOrderStatus(moved.record, 'confirmed', 'x', NOW)).toEqual({ ok: false, code: 'invalid_transition' })
  })
})

describe('overview', () => {
  const requests = allRequests()
  const names = Object.fromEntries(requests.map((entry) => [entry.userId, entry.userId]))
  const owners = Object.fromEntries(requests.map((entry) => [entry.request.id, entry.userId]))
  const base = { customerCount: 6, activeProviders: 8, customerNames: names, requestOwners: owners }

  it('tells an administrator what is urgent and what needs coordinating', () => {
    const view = buildOverview({ ...base, role: 'admin', requests: requests.map((entry) => entry.request), orders: orders() })
    expect(view.stats.find((stat) => stat.id === 'urgent')).toMatchObject({ value: 1, tone: 'alert' }) // only AR-1051: AR-1044 is a declined claim, not a bereavement
    expect(view.attention.some((item) => item.id.startsWith('urgent-') && item.target.page === 'requests')).toBe(true)
    expect(view.attention.some((item) => item.id.startsWith('shared-'))).toBe(true)
    expect(view.attention.some((item) => item.id.startsWith('failed-'))).toBe(true)
  })

  it('tells a provider what is waiting for them', () => {
    const mine = requests.map((entry) => entry.request).filter((entry) => entry.assignment?.providerId === 'harare-funeral-care')
    const view = buildOverview({ ...base, role: 'provider', providerId: 'harare-funeral-care', requests: mine, orders: [] })
    expect(view.stats.find((stat) => stat.id === 'waiting')?.value).toBe(2)
    expect(view.attention.filter((item) => item.id.startsWith('waiting-'))).toHaveLength(2)
  })
})

describe('provider overview and shared orders', () => {
  const requests = allRequests()
  const base = {
    customerCount: 6,
    activeProviders: 8,
    customerNames: Object.fromEntries(requests.map((entry) => [entry.userId, entry.userId])),
    requestOwners: Object.fromEntries(requests.map((entry) => [entry.request.id, entry.userId])),
  }

  it('does not ask a vendor to confirm an order they share with another provider', () => {
    const mine = orders().filter((candidate) => candidate.lines.some((line) => line.provider === 'Msasa Florists'))
    const view = buildOverview({ ...base, role: 'provider', providerId: 'msasa-florists', providerName: 'Msasa Florists', requests: [], orders: mine })
    const confirm = view.attention.filter((item) => item.id.startsWith('confirm-'))
    expect(confirm.map((item) => item.id)).toEqual([`confirm-${order('FS-1035').id}`]) // FS-1026 is shared, so it is not theirs to confirm
    expect(view.stats.find((stat) => stat.id === 'to-confirm')?.value).toBe(1)
  })

  it('reports a vendor revenue as their own share only', () => {
    const mine = orders().filter((candidate) => candidate.lines.some((line) => line.provider === 'Msasa Florists'))
    const view = buildOverview({ ...base, role: 'provider', providerId: 'msasa-florists', providerName: 'Msasa Florists', requests: [], orders: mine })
    const expected = mine.reduce((sum, candidate) => sum + earnedValue(scopeOrderForProvider(candidate, 'Msasa Florists')), 0)
    expect(view.stats.find((stat) => stat.id === 'revenue')?.value).toBe(expected)
  })
})

describe('providers and catalogue', () => {
  it('has an entry for every marketplace vendor', () => {
    const ids = new Set(seedProviders().map((provider) => provider.id))
    for (const item of marketplaceItems) expect(ids.has(providerIdFor(item.provider!))).toBe(true)
  })

  it('hides the products of a provider that is switched off', () => {
    const visible = activeCatalogue(marketplaceItems, ['msasa-florists'])
    expect(visible.some((item) => item.id === 'wreath-package')).toBe(false)
    expect(visible).toHaveLength(marketplaceItems.length - 1)
  })

  it('validates a new provider', () => {
    expect(Object.keys(validateNewProvider({ name: '', providerType: '', contactPerson: '', phone: '123', city: '' })).sort()).toEqual([
      'city',
      'contactPerson',
      'name',
      'phone',
      'providerType',
    ])
    expect(validateNewProvider({ name: 'Kwekwe Funeral Home', providerType: 'Funeral director', contactPerson: 'Pat', phone: '0771234567', city: 'Kwekwe' })).toEqual({})
  })
})
