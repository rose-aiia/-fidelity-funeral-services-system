/**
 * In-browser demo backend for Chema Wallet.
 *
 * Every command validates the BRD v8.0 control intent before changing state:
 * verification gates public activation, only confirmed money is spendable,
 * posted ledger entries are append-only, and payouts need independent approval.
 * The real service would enforce these rules on the server; this module keeps the
 * same shape so screens and tests can demonstrate the workflow without live money.
 */
import type {
  ChemaActor,
  ChemaCase,
  ChemaCommandResult,
  ChemaContribution,
  ChemaEvidence,
  ChemaPayoutRequest,
  ChemaPrivacy,
  ChemaState,
  ContributionMethod,
  DisputeCategory,
  EvidenceType,
  LedgerEntry,
  LedgerSource,
  PayoutStatus,
  VerificationDecision,
} from './data'
import {
  availableCommunityBalance,
  caseByRecord,
  contributionTotals,
  contributionsForCase,
  evidenceLabels,
  nextId,
  requiredEvidence,
  roundMoney,
} from './data'
import { seedChemaState } from './seed'

const KEY = 'fidelity.mock.chemaWallet.v2'
const now = () => new Date().toISOString()

const read = (): ChemaState => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChemaState
      if (Array.isArray(parsed.cases) && Array.isArray(parsed.ledger) && Array.isArray(parsed.audit)) return parsed
    }
  } catch {
    // Fall through to a clean demo state if storage is unavailable or corrupt.
  }
  const seed = seedChemaState()
  try {
    localStorage.setItem(KEY, JSON.stringify(seed))
  } catch {
    // The app still works in memory for the current render if storage is blocked.
  }
  return seed
}

const write = (state: ChemaState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable in private modes; keep the in-memory command result.
  }
  return state
}

const touch = (item: ChemaCase, at = now()): ChemaCase => ({ ...item, updatedAt: at })

function appendAudit(
  state: ChemaState,
  input: { caseId?: string; by: string; action: string; details?: string; kind: ChemaState['audit'][number]['kind']; at?: string },
) {
  state.audit.unshift({
    id: nextId('aud'),
    caseId: input.caseId,
    at: input.at ?? now(),
    by: input.by,
    action: input.action,
    details: input.details,
    kind: input.kind,
  })
}

function fail<T>(error: string): ChemaCommandResult<T> {
  return { ok: false, error, state: read() }
}

function succeed<T>(data: T, state: ChemaState): ChemaCommandResult<T> {
  return { ok: true, data, state }
}

function touchCase(state: ChemaState, caseId: string, fn: (item: ChemaCase) => ChemaCase) {
  state.cases = state.cases.map((item) => (item.id === caseId ? touch(fn(item)) : item))
}

function postPair(state: ChemaState, entries: Array<Omit<LedgerEntry, 'id' | 'currency'> & { currency?: 'USD' }>) {
  const at = entries[0]?.at ?? now()
  const postingEntries = entries.map((entry) => ({
    ...entry,
    id: nextId('le'),
    at,
    currency: entry.currency ?? ('USD' as const),
  }))
  state.ledger.unshift(...postingEntries)
  return postingEntries
}

function hasPosting(state: ChemaState, relatedId: string, source: LedgerSource) {
  return state.ledger.some((entry) => entry.relatedId === relatedId && entry.source === source)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 28)
}

function makeToken(deceasedName: string) {
  return `chema-${slugify(deceasedName) || 'case'}-${Math.random().toString(36).slice(2, 8)}`
}

function makeReceipt() {
  return `CHEMA-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function makeProviderRef(method: ContributionMethod) {
  return `${method.toUpperCase()}-SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function newEvidence(type: EvidenceType, actor: ChemaActor): ChemaEvidence {
  return {
    id: nextId('ev'),
    type,
    label: evidenceLabels[type],
    fileName: `${slugify(actor.name) || 'demo'}-${type.replace(/_/g, '-')}.pdf`,
    uploadedAt: now(),
    uploadedBy: actor.name,
    scan: 'clean',
    note: 'Sample evidence added by the demonstration workflow.',
  }
}

function payoutPostings(state: ChemaState, payout: ChemaPayoutRequest): LedgerEntry[] {
  const at = payout.paidAt ?? now()
  const postingRef = payout.providerRef ?? `PAYOUT-${payout.id.toUpperCase()}`
  return postPair(state, [
    {
      caseId: payout.caseId,
      at,
      source: 'payout',
      account: 'liability:community_wallet',
      direction: 'debit',
      amount: payout.amount,
      postingRef,
      description: 'Community wallet reduced for approved payout',
      relatedId: payout.id,
    },
    {
      caseId: payout.caseId,
      at,
      source: 'payout',
      account: 'asset:provider_clearing',
      direction: 'credit',
      amount: payout.amount,
      postingRef,
      description: 'Payout settled by provider (simulated)',
      relatedId: payout.id,
    },
  ])
}

export const chemaStore = {
  getState: (): ChemaState => read(),
  listCases: () => read().cases,
  getCase: (id: string) => read().cases.find((item) => item.id === id),
  getCaseByRecord: (funeralRecordId: string) => caseByRecord(read(), funeralRecordId),
  getCaseByToken: (token: string) => read().cases.find((item) => item.contributionToken === token),
  getCaseByMemorial: (slug: string) => read().cases.find((item) => item.memorialSlug === slug),
  contributions: (caseId: string) => contributionsForCase(read(), caseId),
  allContributions: () => read().contributions,
  payouts: () => read().payouts,
  disputes: () => read().disputes,

  resetDemo(): ChemaState {
    return write(seedChemaState())
  },

  ensureCaseForRecord(
    record: { id: string; reference: string; personName: string; summary: string },
    actor: ChemaActor,
  ): ChemaCase {
    const state = read()
    const existing = caseByRecord(state, record.id)
    if (existing) return existing
    const at = now()
    const item: ChemaCase = {
      id: `cw-${record.id}`,
      funeralRecordId: record.id,
      caseRef: record.reference,
      deceasedName: record.personName,
      funeralInfo: record.summary,
      targetAmount: 0,
      currency: 'USD',
      status: 'draft',
      verification: { status: 'not_started', evidence: [], decisions: [] },
      privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: true },
      contributionToken: makeToken(record.personName),
      activated: false,
      mandate: [{ userId: actor.id, name: actor.name, role: 'administrator', addedAt: at }],
      approvalThreshold: 150,
      createdAt: at,
      updatedAt: at,
    }
    state.cases = [item, ...state.cases]
    appendAudit(state, {
      caseId: item.id,
      by: actor.name,
      action: 'Funeral case drafted',
      details: 'A draft community wallet case was prepared. Public sharing remains disabled until verification passes.',
      kind: 'case',
      at,
    })
    write(state)
    return item
  },

  attachSampleEvidence(caseId: string, actor: ChemaActor): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (item.verification.status === 'approved') return fail('Verified cases cannot add new verification evidence in this demo.')
    const existingTypes = new Set(item.verification.evidence.map((entry) => entry.type))
    const missing = requiredEvidence.filter((type) => !existingTypes.has(type))
    if (missing.length === 0) return fail('All sample evidence is already attached.')
    touchCase(state, caseId, (entry) => ({
      ...entry,
      verification: { ...entry.verification, evidence: [...entry.verification.evidence, ...missing.map((type) => newEvidence(type, actor))] },
    }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Verification evidence attached',
      details: `${missing.length} sample evidence item${missing.length === 1 ? '' : 's'} added for the demonstration.`,
      kind: 'verification',
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  submitForVerification(caseId: string, actor: ChemaActor): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (!['draft', 'returned', 'rejected'].includes(item.status)) {
      return fail('Only a draft, returned or rejected case can be submitted for verification.')
    }
    const present = new Set(item.verification.evidence.map((entry) => entry.type))
    const missing = requiredEvidence.filter((type) => !present.has(type))
    if (missing.length > 0) {
      return fail(`Attach the missing evidence first: ${missing.map((type) => evidenceLabels[type]).join(', ')}.`)
    }
    const at = now()
    touchCase(state, caseId, (entry) => ({
      ...entry,
      status: 'under_review',
      activated: false,
      verification: { ...entry.verification, status: 'pending', submittedAt: at, reviewedAt: undefined, reviewer: undefined, reasonCode: undefined, note: undefined },
    }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Submitted for community verification',
      details: 'Public sharing and contributions stay disabled while the case is under review.',
      kind: 'verification',
      at,
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  decideVerification(
    caseId: string,
    decision: VerificationDecision['decision'],
    actor: ChemaActor,
    reasonCode: string,
    note?: string,
  ): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (!['submitted', 'under_review'].includes(item.status)) return fail('This case is not awaiting a verification decision.')
    if (decision !== 'approved' && !reasonCode) return fail('Choose a reason code for a return or rejection.')
    const at = now()
    const status = decision === 'approved' ? 'verified' : decision === 'returned' ? 'returned' : 'rejected'
    const verificationStatus = decision === 'approved' ? 'approved' : decision === 'returned' ? 'returned' : 'rejected'
    touchCase(state, caseId, (entry) => ({
      ...entry,
      status,
      activated: false,
      verification: {
        ...entry.verification,
        status: verificationStatus,
        reviewedAt: at,
        reviewer: actor.name,
        reasonCode,
        note,
        decisions: [...entry.verification.decisions, { at, by: actor.name, decision, reasonCode, note }],
      },
    }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: decision === 'approved' ? 'Community verification approved' : decision === 'returned' ? 'Returned for correction' : 'Community verification rejected',
      details: `${reasonCode}${note ? ` · ${note}` : ''}. This decision is separate from any Fidelity claim decision.`,
      kind: 'verification',
      at,
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  activateWallet(caseId: string, actor: ChemaActor): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (item.status !== 'verified') return fail('Only a verified funeral case can activate a public contribution page.')
    if (item.activated) return fail('The public contribution page is already active.')
    const at = now()
    touchCase(state, caseId, (entry) => ({ ...entry, activated: true, activatedAt: at }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Public contribution page activated',
      details: 'A unique non-guessable link and QR code are now available for sharing.',
      kind: 'activation',
      at,
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  suspendCase(caseId: string, actor: ChemaActor, reason: string): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (!['verified', 'suspended'].includes(item.status)) return fail('Only a verified case can be suspended.')
    if (reason.trim().length < 5) return fail('Record a clear reason for the suspension.')
    touchCase(state, caseId, (entry) => ({ ...entry, status: 'suspended', suspendedFrom: 'verified', activated: false }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Case suspended',
      details: `${reason.trim()} Public contribution capability removed immediately.`,
      kind: 'case',
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  resumeCase(caseId: string, actor: ChemaActor): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (item.status !== 'suspended') return fail('Only a suspended case can be resumed.')
    touchCase(state, caseId, (entry) => ({ ...entry, status: 'verified', suspendedFrom: undefined, activated: false }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Suspension lifted',
      details: 'The case is verified again but the public page must be activated explicitly after review.',
      kind: 'case',
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  updatePrivacy(caseId: string, patch: Partial<ChemaPrivacy>, actor: ChemaActor): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    touchCase(state, caseId, (entry) => ({ ...entry, privacy: { ...entry.privacy, ...patch } }))
    const changed = Object.entries(patch).map(([key, value]) => `${key}: ${value ? 'shown' : 'hidden'}`).join(', ')
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Public privacy settings updated',
      details: changed,
      kind: 'privacy',
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  assignCoordinator(
    caseId: string,
    coordinator: { userId: string; name: string; phone?: string },
    actor: ChemaActor,
  ): ChemaCommandResult<ChemaCase> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (!coordinator.userId.trim() || !coordinator.name.trim()) return fail('Enter the coordinator user ID and name.')
    const at = now()
    touchCase(state, caseId, (entry) => ({
      ...entry,
      coordinator: { ...coordinator, assignedBy: actor.name, assignedAt: at },
      mandate: [
        ...entry.mandate.filter((member) => member.userId !== coordinator.userId),
        { userId: coordinator.userId, name: coordinator.name, role: 'coordinator', phoneMasked: coordinator.phone ? coordinator.phone.replace(/\d(?=\d{3})/g, '•') : undefined, addedAt: at },
      ],
    }))
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Chema Coordinator assigned',
      details: `${coordinator.name} appointed. Coordinators can help and record cash but do not receive payout authority.`,
      kind: 'case',
      at,
    })
    write(state)
    return succeed(state.cases.find((entry) => entry.id === caseId) as ChemaCase, state)
  },

  addContributionIntent(input: {
    caseId: string
    amount: number
    contributorName: string
    anonymous: boolean
    message?: string
    method: ContributionMethod
    idempotencyKey: string
  }): ChemaCommandResult<ChemaContribution> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === input.caseId)
    if (!item) return fail('Funeral case not found.')
    if (!item.activated || item.status !== 'verified') return fail('This contribution page is not active.')
    const existing = state.contributions.find((entry) => entry.idempotencyKey === input.idempotencyKey)
    if (existing) return succeed(existing, state)
    const amount = roundMoney(input.amount)
    if (!Number.isFinite(amount) || amount < 1) return fail('Enter a contribution amount of at least USD 1.00.')
    if (amount > 100_000) return fail('For this demonstration, contributions are capped at USD 100,000.00.')
    if (!input.anonymous && !input.contributorName.trim()) return fail('Enter a display name or choose anonymous.')
    const at = now()
    const contribution: ChemaContribution = {
      id: nextId('contrib'),
      caseId: input.caseId,
      amount,
      currency: 'USD',
      method: input.method,
      kind: 'digital',
      status: 'initiated',
      contributorName: input.anonymous ? 'Anonymous' : input.contributorName.trim(),
      anonymous: input.anonymous,
      message: input.message?.trim() || undefined,
      createdAt: at,
      providerRef: makeProviderRef(input.method),
      idempotencyKey: input.idempotencyKey,
      reconciled: false,
      simulated: true,
    }
    state.contributions.unshift(contribution)
    appendAudit(state, {
      caseId: input.caseId,
      by: input.anonymous ? 'Contributor (anonymous)' : contribution.contributorName,
      action: 'Payment intent created',
      details: `${input.method} · USD ${amount.toFixed(2)} · reference ${contribution.providerRef}. Not credited until provider confirmation.`,
      kind: 'contribution',
      at,
    })
    write(state)
    return succeed(contribution, state)
  },

  resolveContribution(
    contributionId: string,
    outcome: 'successful' | 'failed' | 'pending',
    providerRef?: string,
  ): ChemaCommandResult<ChemaContribution> {
    const state = read()
    const contribution = state.contributions.find((entry) => entry.id === contributionId)
    if (!contribution) return fail('Payment intent not found.')
    if (contribution.status === 'successful' || contribution.status === 'failed') return succeed(contribution, state)
    if (!['initiated', 'pending'].includes(contribution.status)) return fail('This payment can no longer be updated.')
    const at = now()
    if (outcome === 'pending') {
      state.contributions = state.contributions.map((entry) =>
        entry.id === contributionId ? { ...entry, status: 'pending', providerRef: providerRef ?? entry.providerRef } : entry,
      )
      appendAudit(state, {
        caseId: contribution.caseId,
        by: 'Payment provider',
        action: 'Payment pending confirmation',
        details: `Reference ${providerRef ?? contribution.providerRef}. Pending funds are not available for payout.`,
        kind: 'contribution',
        at,
      })
      write(state)
      return succeed(state.contributions.find((entry) => entry.id === contributionId) as ChemaContribution, state)
    }
    if (outcome === 'failed') {
      state.contributions = state.contributions.map((entry) =>
        entry.id === contributionId ? { ...entry, status: 'failed', failedAt: at, providerRef: providerRef ?? entry.providerRef, reconciled: true } : entry,
      )
      appendAudit(state, {
        caseId: contribution.caseId,
        by: 'Payment provider',
        action: 'Payment failed',
        details: `Reference ${providerRef ?? contribution.providerRef}. No funds credited.`,
        kind: 'contribution',
        at,
      })
      write(state)
      return succeed(state.contributions.find((entry) => entry.id === contributionId) as ChemaContribution, state)
    }

    const receiptRef = makeReceipt()
    const next: ChemaContribution = {
      ...contribution,
      status: 'successful',
      confirmedAt: at,
      receiptRef,
      providerRef: providerRef ?? contribution.providerRef,
      reconciled: true,
      tributeStatus: contribution.message ? 'pending' : undefined,
    }
    state.contributions = state.contributions.map((entry) => (entry.id === contributionId ? next : entry))
    if (!hasPosting(state, contributionId, 'community')) {
      postPair(state, [
        {
          caseId: contribution.caseId,
          at,
          source: 'community',
          account: 'asset:provider_clearing',
          direction: 'debit',
          amount: next.amount,
          postingRef: receiptRef,
          description: `${next.method} collection confirmed by provider (simulated)`,
          relatedId: next.id,
        },
        {
          caseId: contribution.caseId,
          at,
          source: 'community',
          account: 'liability:community_wallet',
          direction: 'credit',
          amount: next.amount,
          postingRef: receiptRef,
          description: 'Community contribution credited to family sub-ledger',
          relatedId: next.id,
        },
      ])
    }
    appendAudit(state, {
      caseId: contribution.caseId,
      by: 'Payment provider',
      action: 'Contribution confirmed',
      details: `USD ${next.amount.toFixed(2)} · ${next.method} · receipt ${receiptRef}. Posted once to the community sub-ledger.`,
      kind: 'contribution',
      at,
    })
    if (next.message) {
      appendAudit(state, {
        caseId: contribution.caseId,
        by: 'Moderation queue',
        action: 'Tribute held for moderation',
        details: 'The condolence message is visible to the family but not published until approved.',
        kind: 'contribution',
        at,
      })
    }
    write(state)
    return succeed(state.contributions.find((entry) => entry.id === contributionId) as ChemaContribution, state)
  },

  recordCashContribution(
    caseId: string,
    input: { amount: number; contributorName: string; note?: string },
    actor: ChemaActor,
  ): ChemaCommandResult<ChemaContribution> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (item.status !== 'verified') return fail('Record cash only against a verified funeral case.')
    const amount = roundMoney(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) return fail('Enter a valid cash amount.')
    const at = now()
    const contribution: ChemaContribution = {
      id: nextId('cash'),
      caseId,
      amount,
      currency: 'USD',
      method: 'ecocash',
      kind: 'cash',
      status: 'successful',
      contributorName: input.contributorName.trim() || 'Cash contributor',
      anonymous: false,
      message: input.note?.trim() || undefined,
      createdAt: at,
      confirmedAt: at,
      receiptRef: `CHEMA-CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      providerRef: `CASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      idempotencyKey: nextId('cash-key'),
      recordedBy: actor.name,
      reconciled: true,
      simulated: true,
    }
    state.contributions.unshift(contribution)
    if (!hasPosting(state, contribution.id, 'cash')) {
      postPair(state, [
        {
          caseId,
          at,
          source: 'cash',
          account: 'memo:cash_received',
          direction: 'debit',
          amount,
          postingRef: contribution.receiptRef as string,
          description: 'Physical cash recorded (memo only)',
          relatedId: contribution.id,
          memo: true,
        },
        {
          caseId,
          at,
          source: 'cash',
          account: 'memo:cash_recorded',
          direction: 'credit',
          amount,
          postingRef: contribution.receiptRef as string,
          description: 'Cash recorded for the family view (memo only)',
          relatedId: contribution.id,
          memo: true,
        },
      ])
    }
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Physical cash contribution recorded',
      details: `USD ${amount.toFixed(2)} recorded separately. No digital transfer occurred and this cash is not spendable through Chema.`,
      kind: 'contribution',
      at,
    })
    write(state)
    return succeed(contribution, state)
  },

  moderateTribute(
    contributionId: string,
    decision: 'approved' | 'rejected',
    actor: ChemaActor,
  ): ChemaCommandResult<ChemaContribution> {
    const state = read()
    const contribution = state.contributions.find((entry) => entry.id === contributionId)
    if (!contribution) return fail('Contribution not found.')
    if (!contribution.message) return fail('This contribution has no tribute message.')
    state.contributions = state.contributions.map((entry) =>
      entry.id === contributionId ? { ...entry, tributeStatus: decision } : entry,
    )
    appendAudit(state, {
      caseId: contribution.caseId,
      by: actor.name,
      action: decision === 'approved' ? 'Tribute published' : 'Tribute not published',
      details: `Message from ${contribution.anonymous ? 'an anonymous contributor' : contribution.contributorName}.`,
      kind: 'privacy',
    })
    write(state)
    return succeed(state.contributions.find((entry) => entry.id === contributionId) as ChemaContribution, state)
  },

  requestPayout(
    caseId: string,
    input: { amount: number; purpose: string; destination: string; note?: string },
    actor: ChemaActor,
  ): ChemaCommandResult<ChemaPayoutRequest> {
    const state = read()
    const item = state.cases.find((entry) => entry.id === caseId)
    if (!item) return fail('Case not found.')
    if (item.status !== 'verified') return fail('Payouts are only available for a verified, active case.')
    const amount = roundMoney(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) return fail('Enter a valid payout amount.')
    if (input.purpose.trim().length < 5) return fail('Describe the purpose of the payout.')
    if (input.destination.trim().length < 4) return fail('Enter the approved destination for this demo.')
    const available = availableCommunityBalance(state, caseId)
    if (amount > available) return fail(`The community source has ${`USD ${available.toFixed(2)}`} available after commitments and holds.`)
    const at = now()
    const payout: ChemaPayoutRequest = {
      id: nextId('payout'),
      caseId,
      amount,
      currency: 'USD',
      purpose: input.purpose.trim(),
      destinationMasked: input.destination.trim(),
      requestedBy: actor.name,
      requestedByUserId: actor.id,
      requestedAt: at,
      status: 'awaiting_approval',
      requiredApprovals: amount >= item.approvalThreshold ? 2 : 1,
      approvals: [],
      note: input.note?.trim() || undefined,
    }
    state.payouts.unshift(payout)
    appendAudit(state, {
      caseId,
      by: actor.name,
      action: 'Payout request submitted',
      details: `USD ${amount.toFixed(2)} for ${payout.purpose}. ${payout.requiredApprovals} independent approval${payout.requiredApprovals === 1 ? '' : 's'} required.`,
      kind: 'payout',
      at,
    })
    write(state)
    return succeed(payout, state)
  },

  reviewPayout(
    payoutId: string,
    decision: 'approved' | 'rejected',
    actor: ChemaActor,
    note?: string,
  ): ChemaCommandResult<ChemaPayoutRequest> {
    const state = read()
    const payout = state.payouts.find((entry) => entry.id === payoutId)
    if (!payout) return fail('Payout request not found.')
    if (!['submitted', 'validating', 'awaiting_approval'].includes(payout.status)) return fail('This payout is no longer awaiting approval.')
    if (payout.requestedByUserId === actor.id) return fail('Maker-checker control: the requester cannot approve their own payout.')
    if (payout.approvals.some((approval) => approval.byUserId === actor.id)) return fail('This approver has already recorded a decision.')
    const at = now()
    const approvals = [...payout.approvals, { by: actor.name, byUserId: actor.id, at, decision, note }]
    const approvalCount = approvals.filter((approval) => approval.decision === 'approved').length
    const status: PayoutStatus = decision === 'rejected' ? 'rejected' : approvalCount >= payout.requiredApprovals ? 'initiated' : 'awaiting_approval'
    state.payouts = state.payouts.map((entry) => (entry.id === payoutId ? { ...entry, approvals, status } : entry))
    appendAudit(state, {
      caseId: payout.caseId,
      by: actor.name,
      action: decision === 'rejected' ? 'Payout rejected' : status === 'initiated' ? 'Payout approved and sent to provider' : 'Payout approval recorded',
      details: decision === 'rejected'
        ? `Request ${payout.id} rejected. The commitment is released.`
        : `${approvalCount}/${payout.requiredApprovals} independent approvals. ${status === 'initiated' ? 'Instruction handed to the provider (simulated).' : 'A second approver is still required.'}`,
      kind: 'payout',
      at,
    })
    write(state)
    return succeed(state.payouts.find((entry) => entry.id === payoutId) as ChemaPayoutRequest, state)
  },

  settlePayout(payoutId: string, actor: ChemaActor): ChemaCommandResult<ChemaPayoutRequest> {
    const state = read()
    const payout = state.payouts.find((entry) => entry.id === payoutId)
    if (!payout) return fail('Payout request not found.')
    if (payout.status === 'paid') return succeed(payout, state)
    if (payout.status !== 'initiated') return fail('Only an initiated payout can be settled in this demo.')
    const at = now()
    const providerRef = `SIM-PAYOUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    state.payouts = state.payouts.map((entry) => (entry.id === payoutId ? { ...entry, status: 'paid', paidAt: at, providerRef } : entry))
    if (!hasPosting(state, payoutId, 'payout')) {
      payoutPostings(state, { ...payout, status: 'paid', paidAt: at, providerRef })
    }
    appendAudit(state, {
      caseId: payout.caseId,
      by: actor.name,
      action: 'Payout settled',
      details: `Provider confirmed settlement (${providerRef}). Compensating ledger entries posted.`,
      kind: 'ledger',
      at,
    })
    write(state)
    return succeed(state.payouts.find((entry) => entry.id === payoutId) as ChemaPayoutRequest, state)
  },

  resolveDispute(disputeId: string, resolution: string, actor: ChemaActor): ChemaCommandResult {
    const state = read()
    const dispute = state.disputes.find((entry) => entry.id === disputeId)
    if (!dispute) return fail('Dispute not found.')
    if (dispute.status === 'resolved' || dispute.status === 'closed') return fail('This dispute is already closed.')
    if (resolution.trim().length < 5) return fail('Record the resolution and evidence reviewed.')
    const at = now()
    state.disputes = state.disputes.map((entry) =>
      entry.id === disputeId ? { ...entry, status: 'resolved', resolution: resolution.trim(), updatedAt: at } : entry,
    )
    state.holds = state.holds.map((hold) =>
      hold.disputeId === disputeId && hold.status === 'active' ? { ...hold, status: 'released', releasedAt: at, releasedBy: actor.name } : hold,
    )
    appendAudit(state, {
      caseId: dispute.caseId,
      by: actor.name,
      action: 'Dispute resolved',
      details: `${resolution.trim()} Any linked source-specific hold was released.`,
      kind: 'dispute',
      at,
    })
    write(state)
    return succeed(undefined, state)
  },

  reportSuspiciousCase(
    token: string,
    input: { reporter: string; category: DisputeCategory; reason: string },
  ): ChemaCommandResult<ChemaState> {
    const state = read()
    const item = state.cases.find((entry) => entry.id && entry.contributionToken === token)
    if (!item) return fail('Contribution page not found.')
    const at = now()
    const dispute = {
      id: nextId('disp'),
      caseId: item.id,
      category: input.category,
      severity: 'medium' as const,
      status: 'raised' as const,
      source: 'community' as const,
      summary: input.reason.trim(),
      owner: 'Trust & safety',
      reporter: input.reporter.trim() || 'Anonymous visitor',
      createdAt: at,
      updatedAt: at,
    }
    state.disputes.unshift(dispute)
    appendAudit(state, {
      caseId: item.id,
      by: dispute.reporter,
      action: 'Suspicious case reported',
      details: `${dispute.summary} Routed for human review; no automated adverse decision.`,
      kind: 'report',
      at,
    })
    write(state)
    return succeed(state, state)
  },

  metrics(caseId: string) {
    const state = read()
    return contributionTotals(contributionsForCase(state, caseId))
  },
}

export type ChemaStore = typeof chemaStore
