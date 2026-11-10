import { beforeEach, describe, expect, it } from 'vitest'
import {
  availableCommunityBalance,
  contributionTotals,
  contributionsForCase,
  type ChemaActor,
} from './data'
import { chemaStore } from './store'

/**
 * The store is an in-browser demo backend. These tests run it against an
 * in-memory localStorage so the BRD controls (verification gates, idempotent
 * confirmation, source separation, maker-checker and audit) are regression
 * protected without a real payment provider.
 */
const memory = new Map<string, string>()

const localStorageMock: Storage = {
  get length() {
    return memory.size
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => Array.from(memory.keys())[index] ?? null,
  removeItem: (key) => {
    memory.delete(key)
  },
  setItem: (key, value) => {
    memory.set(key, String(value))
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

const admin: ChemaActor = { id: 'u-ndlovu-admin', name: 'Nomsa Ndlovu' }
const familyApprover: ChemaActor = { id: 'u-ndlovu', name: 'Thabo Ndlovu' }
const finance: ChemaActor = { id: 'u-finance-ops', name: 'Finance operations' }

function intent(overrides: Partial<Parameters<typeof chemaStore.addContributionIntent>[0]> = {}) {
  return {
    caseId: 'cw-fr-nyathi',
    amount: 30,
    contributorName: 'Test contributor',
    anonymous: false,
    method: 'ecocash' as const,
    idempotencyKey: `test:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  }
}

describe('Chema demo balances and seed', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('keeps community, cash and pending money separate', () => {
    const state = chemaStore.getState()
    const totals = contributionTotals(contributionsForCase(state, 'cw-fr-nyathi'))

    expect(totals.digitalTotal).toBe(390)
    expect(totals.cashTotal).toBe(40)
    expect(totals.pendingTotal).toBe(20)
    expect(availableCommunityBalance(state, 'cw-fr-nyathi')).toBe(115)
  })

  it('never counts pending or failed payments as available', () => {
    const caseId = 'cw-fr-nyathi'
    const before = availableCommunityBalance(chemaStore.getState(), caseId)
    const created = chemaStore.addContributionIntent(intent({ amount: 45 }))

    expect(created.ok).toBe(true)
    if (!created.ok) return

    const pending = chemaStore.resolveContribution(created.data.id, 'pending')
    expect(pending.ok).toBe(true)
    if (!pending.ok) return

    expect(pending.data.status).toBe('pending')
    expect(pending.data.receiptRef).toBeUndefined()
    expect(availableCommunityBalance(chemaStore.getState(), caseId)).toBe(before)

    const failed = chemaStore.addContributionIntent(intent({ amount: 12 }))
    expect(failed.ok).toBe(true)
    if (!failed.ok) return
    chemaStore.resolveContribution(failed.data.id, 'failed')

    const state = chemaStore.getState()
    expect(contributionTotals(contributionsForCase(state, caseId)).digitalTotal).toBe(390)
    expect(availableCommunityBalance(state, caseId)).toBe(before)
  })
})

describe('community verification gates public money', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('requires evidence, review approval and explicit activation', () => {
    const caseId = 'cw-fr-ncube'
    expect(chemaStore.getCase(caseId)?.status).toBe('draft')

    const early = chemaStore.activateWallet(caseId, admin)
    expect(early.ok).toBe(false)

    expect(chemaStore.attachSampleEvidence(caseId, admin).ok).toBe(true)
    expect(chemaStore.submitForVerification(caseId, admin).ok).toBe(true)
    expect(chemaStore.getCase(caseId)?.status).toBe('under_review')

    const decision = chemaStore.decideVerification(caseId, 'approved', admin, 'VER-OK', 'Evidence checked.')
    expect(decision.ok).toBe(true)
    expect(chemaStore.getCase(caseId)?.verification.status).toBe('approved')

    const activated = chemaStore.activateWallet(caseId, admin)
    expect(activated.ok).toBe(true)
    expect(chemaStore.getCase(caseId)?.activated).toBe(true)
  })

  it('blocks contributions while a case is suspended and requires re-activation', () => {
    const caseId = 'cw-fr-nyathi'
    expect(chemaStore.suspendCase(caseId, admin, 'Family authority concern under review').ok).toBe(true)

    const blocked = chemaStore.addContributionIntent(intent({ caseId }))
    expect(blocked.ok).toBe(false)

    expect(chemaStore.resumeCase(caseId, admin).ok).toBe(true)
    expect(chemaStore.getCase(caseId)?.activated).toBe(false)

    expect(chemaStore.activateWallet(caseId, admin).ok).toBe(true)
    expect(chemaStore.addContributionIntent(intent({ caseId })).ok).toBe(true)
  })
})

describe('provider confirmation, receipts and idempotency', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('posts one balanced ledger pair for a confirmed payment', () => {
    const caseId = 'cw-fr-nyathi'
    const before = availableCommunityBalance(chemaStore.getState(), caseId)
    const created = chemaStore.addContributionIntent(intent({ amount: 30 }))
    expect(created.ok).toBe(true)
    if (!created.ok) return

    const confirmed = chemaStore.resolveContribution(created.data.id, 'successful', 'ECOCASH-SIM-TEST')
    expect(confirmed.ok).toBe(true)
    if (!confirmed.ok) return

    expect(confirmed.data.status).toBe('successful')
    expect(confirmed.data.receiptRef).toBeTruthy()

    const duplicate = chemaStore.resolveContribution(created.data.id, 'successful', 'ECOCASH-SIM-TEST')
    expect(duplicate.ok).toBe(true)
    if (!duplicate.ok) return
    expect(duplicate.data.receiptRef).toBe(confirmed.data.receiptRef)

    const state = chemaStore.getState()
    const entries = state.ledger.filter((entry) => entry.relatedId === created.data.id && entry.source === 'community')
    expect(entries).toHaveLength(2)
    expect(entries[0].amount).toBe(entries[1].amount)
    expect(availableCommunityBalance(state, caseId)).toBe(before + 30)
  })

  it('replays an idempotency key instead of creating a second payment', () => {
    const payload = intent({ amount: 22, idempotencyKey: 'test-idempotency-key' })
    const first = chemaStore.addContributionIntent(payload)
    const second = chemaStore.addContributionIntent(payload)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (!first.ok || !second.ok) return

    expect(second.data.id).toBe(first.data.id)
    expect(chemaStore.allContributions().filter((entry) => entry.idempotencyKey === 'test-idempotency-key')).toHaveLength(1)
  })
})

describe('cash is recorded separately', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('adds a cash memo record without changing the spendable balance', () => {
    const caseId = 'cw-fr-nyathi'
    const before = availableCommunityBalance(chemaStore.getState(), caseId)

    const cash = chemaStore.recordCashContribution(
      caseId,
      { amount: 25, contributorName: 'Neighbourhood collection', note: 'Handed to the coordinator' },
      admin,
    )
    expect(cash.ok).toBe(true)
    if (!cash.ok) return

    expect(cash.data.kind).toBe('cash')
    expect(cash.data.receiptRef).toBeTruthy()

    const state = chemaStore.getState()
    const totals = contributionTotals(contributionsForCase(state, caseId))
    expect(totals.cashTotal).toBe(65)
    expect(availableCommunityBalance(state, caseId)).toBe(before)

    const ledger = state.ledger.filter((entry) => entry.relatedId === cash.data.id)
    expect(ledger).toHaveLength(2)
    expect(ledger.every((entry) => entry.source === 'cash' && entry.memo)).toBe(true)
  })
})

describe('maker-checker payout approvals', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('prevents self-approval and duplicate decisions, then settles once', () => {
    const payoutId = 'p-grace-1'

    expect(chemaStore.reviewPayout(payoutId, 'approved', admin).ok).toBe(false)
    expect(chemaStore.reviewPayout(payoutId, 'approved', familyApprover).ok).toBe(false)

    const finalApproval = chemaStore.reviewPayout(payoutId, 'approved', finance, 'Finance verified the quote.')
    expect(finalApproval.ok).toBe(true)
    if (!finalApproval.ok) return
    expect(finalApproval.data.status).toBe('initiated')

    const settled = chemaStore.settlePayout(payoutId, finance)
    expect(settled.ok).toBe(true)
    if (!settled.ok) return
    expect(settled.data.status).toBe('paid')
    expect(settled.data.providerRef).toBeTruthy()

    const again = chemaStore.settlePayout(payoutId, finance)
    expect(again.ok).toBe(true)

    const state = chemaStore.getState()
    expect(state.ledger.filter((entry) => entry.relatedId === payoutId && entry.source === 'payout')).toHaveLength(2)
    expect(state.payouts.find((payout) => payout.id === payoutId)?.status).toBe('paid')
  })

  it('rejects a payout larger than the available community balance', () => {
    const result = chemaStore.requestPayout(
      'cw-fr-nyathi',
      { amount: 5_000, purpose: 'Test payout', destination: 'EcoCash ···· 0241' },
      admin,
    )
    expect(result.ok).toBe(false)
  })
})

describe('privacy, reports and audit', () => {
  beforeEach(() => {
    chemaStore.resetDemo()
  })

  it('records privacy changes in the audit trail', () => {
    const changed = chemaStore.updatePrivacy('cw-fr-nyathi', { showAmounts: false }, admin)
    expect(changed.ok).toBe(true)
    expect(chemaStore.getCase('cw-fr-nyathi')?.privacy.showAmounts).toBe(false)

    const audit = chemaStore.getState().audit
    expect(audit.some((entry) => entry.caseId === 'cw-fr-nyathi' && entry.kind === 'privacy')).toBe(true)
  })

  it('turns a public report into a traceable dispute without blocking the family', () => {
    const reported = chemaStore.reportSuspiciousCase('chema-grace-nyathi-demo', {
      reporter: 'Concerned neighbour',
      category: 'report',
      reason: 'The funeral date on this page does not match the notice I saw.',
    })
    expect(reported.ok).toBe(true)

    const state = chemaStore.getState()
    const dispute = state.disputes.find((entry) => entry.reporter === 'Concerned neighbour')
    expect(dispute?.status).toBe('raised')
    expect(dispute?.category).toBe('report')

    const audit = state.audit.find((entry) => entry.action === 'Suspicious case reported')
    expect(audit?.kind).toBe('report')

    expect(chemaStore.getCase('cw-fr-nyathi')?.status).toBe('verified')
  })

  it('resolves a dispute and releases its linked hold', () => {
    const resolved = chemaStore.resolveDispute(
      'd-grace-1',
      'Provider records reviewed and the family confirms the payment.',
      finance,
    )
    expect(resolved.ok).toBe(true)

    const state = chemaStore.getState()
    expect(state.disputes.find((entry) => entry.id === 'd-grace-1')?.status).toBe('resolved')
    expect(state.holds.find((hold) => hold.disputeId === 'd-grace-1')?.status).toBe('released')
    expect(availableCommunityBalance(state, 'cw-fr-nyathi')).toBe(140)
  })
})
