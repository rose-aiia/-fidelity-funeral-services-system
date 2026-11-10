import type { ChemaAuditEntry, ChemaCase, ChemaContribution, ChemaState, ContributionMethod, ContributionStatus, PayoutRequest, PayoutStatus } from './data'
import { caseByRecord, contributionsForCase, makeReceiptRef, nextId } from './data'
import { seedChemaState } from './seed'

const KEY = 'fidelity.mock.chemaWallet'

const read = (): ChemaState => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as ChemaState
  } catch {}
  const seed = seedChemaState()
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

const write = (state: ChemaState) => {
  localStorage.setItem(KEY, JSON.stringify(state))
  return state
}

const audit = (by: string, action: string, details?: string): ChemaAuditEntry => ({
  id: nextId('ca'), at: new Date().toISOString(), by, action, details,
})

export const chemaStore = {
  getState: () => read(),
  listCases: () => read().cases,
  getCase: (id: string) => read().cases.find((c) => c.id === id),
  getCaseByRecord: (funeralRecordId: string) => caseByRecord(read(), funeralRecordId),
  getCaseByToken: (token: string) => read().cases.find((c) => c.contributionToken === token),
  getCaseByMemorial: (slug: string) => read().cases.find((c) => c.memorialSlug === slug),
  contributions: (caseId: string) => contributionsForCase(read(), caseId),
  allContributions: () => read().contributions,

  ensureCaseForRecord(record: { id: string; reference: string; personName: string; summary: string }, by: string): ChemaCase {
    const state = read()
    const existing = state.cases.find((c) => c.funeralRecordId === record.id)
    if (existing) return existing
    const item: ChemaCase = {
      id: `cw-${record.id}`,
      funeralRecordId: record.id,
      caseRef: record.reference,
      deceasedName: record.personName,
      funeralInfo: record.summary,
      activated: false,
      verified: false,
      contributionToken: `chema-${record.id}-${Math.random().toString(36).slice(2, 8)}`,
      payoutRequests: [],
      audit: [audit(by, 'Chema Wallet record created', 'Wallet record prepared for funeral case (demo).')],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    write({ ...state, cases: [item, ...state.cases] })
    return item
  },

  verifyCase(caseId: string, by: string) {
    return write({
      ...read(),
      cases: read().cases.map((c) => c.id !== caseId ? c : { ...c, verified: true, updatedAt: new Date().toISOString(), audit: [audit(by, 'Funeral case verified', 'Case marked as verified before wallet activation (demo workflow).'), ...c.audit] }),
    })
  },

  activateCase(caseId: string, by: string) {
    const state = read()
    const target = state.cases.find((c) => c.id === caseId)
    if (!target || !target.verified) return state
    return write({
      ...state,
      cases: state.cases.map((c) => c.id !== caseId ? c : { ...c, activated: true, updatedAt: new Date().toISOString(), audit: [audit(by, 'Chema Wallet activated', 'Wallet enabled for verified funeral case. Digital contributions can now be simulated.'), ...c.audit] }),
    })
  },

  addDigitalContribution(input: { caseId: string; amount: number; contributorName: string; anonymous: boolean; message?: string; method: ContributionMethod; status?: ContributionStatus }) {
    const state = read()
    const contribution: ChemaContribution = {
      id: nextId('contrib'),
      caseId: input.caseId,
      amount: input.amount,
      currency: 'USD',
      contributorName: input.anonymous ? 'Anonymous' : input.contributorName,
      anonymous: input.anonymous,
      message: input.message?.trim() || undefined,
      method: input.method,
      kind: 'digital',
      status: input.status ?? 'successful',
      createdAt: new Date().toISOString(),
      receiptRef: makeReceiptRef(),
      simulated: true,
    }
    const actor = input.anonymous ? 'Contributor (anonymous)' : (input.contributorName || 'Contributor')
    return {
      state: write({
        ...state,
        contributions: [contribution, ...state.contributions],
        cases: state.cases.map((c) => c.id !== input.caseId ? c : { ...c, updatedAt: contribution.createdAt, audit: [audit(actor, 'Digital contribution simulated', `${input.method.toUpperCase()} ${contribution.status} · USD ${input.amount.toFixed(2)} (demo, no real money).`), ...c.audit] }),
      }),
      contribution,
    }
  },

  addCashContribution(caseId: string, input: { amount: number; contributorName: string; note?: string; recordedBy: string }) {
    const state = read()
    const contribution: ChemaContribution = {
      id: nextId('cash'),
      caseId,
      amount: input.amount,
      currency: 'USD',
      contributorName: input.contributorName.trim() || 'Cash contributor',
      anonymous: false,
      message: input.note?.trim() || undefined,
      method: 'ecocash',
      kind: 'cash',
      status: 'successful',
      createdAt: new Date().toISOString(),
      recordedBy: input.recordedBy,
      receiptRef: makeReceiptRef(),
      simulated: true,
    }
    return write({
      ...state,
      contributions: [contribution, ...state.contributions],
      cases: state.cases.map((c) => c.id !== caseId ? c : { ...c, updatedAt: contribution.createdAt, audit: [audit(input.recordedBy, 'Physical cash contribution recorded', `USD ${input.amount.toFixed(2)} recorded separately (demo). No digital transfer occurred.`), ...c.audit] }),
    })
  },

  assignCoordinator(caseId: string, coordinator: { userId: string; name: string; phone?: string }, by: string) {
    return write({
      ...read(),
      cases: read().cases.map((c) => c.id !== caseId ? c : { ...c, coordinator: { ...coordinator, assignedBy: by, assignedAt: new Date().toISOString() }, updatedAt: new Date().toISOString(), audit: [audit(by, 'Chema Coordinator assigned', `${coordinator.name} appointed for this funeral. Withdrawal/payout permissions not granted.`), ...c.audit] }),
    })
  },

  requestPayout(caseId: string, amount: number, requestedBy: string, note?: string) {
    const req: PayoutRequest = { id: nextId('pr'), caseId, amount, requestedBy, requestedAt: new Date().toISOString(), status: 'requested', note }
    return write({
      ...read(),
      cases: read().cases.map((c) => c.id !== caseId ? c : { ...c, payoutRequests: [req, ...c.payoutRequests], updatedAt: req.requestedAt, audit: [audit(requestedBy, 'Payout request submitted', `USD ${amount.toFixed(2)} requested for review (mock workflow, no real settlement).`), ...c.audit] }),
    })
  },

  reviewPayout(caseId: string, payoutId: string, status: Exclude<PayoutStatus, 'requested'>, by: string, note?: string) {
    return write({
      ...read(),
      cases: read().cases.map((c) => c.id !== caseId ? c : { ...c, payoutRequests: c.payoutRequests.map((p) => p.id !== payoutId ? p : { ...p, status, reviewedBy: by, reviewedAt: new Date().toISOString(), note: note ?? p.note }), updatedAt: new Date().toISOString(), audit: [audit(by, `Payout request ${status}`, `Request ${payoutId} ${status} (mock workflow).`), ...c.audit] }),
    })
  },
}
