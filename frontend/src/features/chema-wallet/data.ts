/**
 * Chema Wallet domain model and pure selectors.
 *
 * The module is a front-end demonstration of the BRD v8.0 control model. Money is
 * simulated, but the state machines, source-separated balances, maker-checker
 * approval and audit trail behave like the proposed service.
 */

export type Currency = 'USD'

export type CaseStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'returned'
  | 'rejected'
  | 'suspended'
  | 'closed'

export type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'returned' | 'rejected'

export type ContributionMethod = 'ecocash' | 'onemoney' | 'card'
export type ContributionKind = 'digital' | 'cash'
export type ContributionStatus = 'initiated' | 'pending' | 'successful' | 'failed' | 'refunded' | 'reversed'

export type TributeStatus = 'pending' | 'approved' | 'rejected'

export type PayoutStatus =
  | 'submitted'
  | 'validating'
  | 'awaiting_approval'
  | 'initiated'
  | 'paid'
  | 'failed'
  | 'reversed'
  | 'rejected'

export type DisputeStatus = 'raised' | 'triaged' | 'investigating' | 'resolved' | 'closed'
export type DisputeSeverity = 'low' | 'medium' | 'high'
export type DisputeCategory =
  | 'payment'
  | 'authority'
  | 'fraud'
  | 'chargeback'
  | 'beneficiary'
  | 'reconciliation'
  | 'report'

export type LedgerSource = 'community' | 'cash' | 'fidelity_benefit' | 'fee' | 'refund' | 'payout'
export type LedgerDirection = 'debit' | 'credit'

export type AuditKind =
  | 'case'
  | 'verification'
  | 'activation'
  | 'contribution'
  | 'payout'
  | 'privacy'
  | 'dispute'
  | 'report'
  | 'ledger'

export type EvidenceType = 'death_certificate' | 'national_id' | 'authority_letter'

export interface ChemaEvidence {
  id: string
  type: EvidenceType
  label: string
  fileName: string
  uploadedAt: string
  uploadedBy: string
  scan: 'pending' | 'clean'
  note?: string
}

export interface VerificationDecision {
  at: string
  by: string
  decision: 'approved' | 'returned' | 'rejected'
  reasonCode: string
  note?: string
}

export interface ChemaVerification {
  status: VerificationStatus
  submittedAt?: string
  reviewedAt?: string
  reviewer?: string
  reasonCode?: string
  note?: string
  evidence: ChemaEvidence[]
  decisions: VerificationDecision[]
}

export interface ChemaPrivacy {
  showDeceasedName: boolean
  showAmounts: boolean
  showProgress: boolean
  showTributes: boolean
  showContributors: boolean
}

export interface ChemaCoordinator {
  userId: string
  name: string
  phone?: string
  assignedBy: string
  assignedAt: string
}

export interface ChemaMandate {
  userId: string
  name: string
  role: 'administrator' | 'approver' | 'coordinator'
  phoneMasked?: string
  addedAt: string
}

export interface ChemaCase {
  id: string
  funeralRecordId: string
  caseRef: string
  deceasedName: string
  dateOfDeath?: string
  funeralDate?: string
  funeralInfo: string
  memorialSlug?: string
  targetAmount: number
  currency: Currency
  status: CaseStatus
  verification: ChemaVerification
  privacy: ChemaPrivacy
  contributionToken: string
  activated: boolean
  activatedAt?: string
  suspendedFrom?: CaseStatus
  coordinator?: ChemaCoordinator
  mandate: ChemaMandate[]
  approvalThreshold: number
  createdAt: string
  updatedAt: string
}

export interface ChemaContribution {
  id: string
  caseId: string
  amount: number
  currency: Currency
  method: ContributionMethod
  kind: ContributionKind
  status: ContributionStatus
  contributorName: string
  anonymous: boolean
  message?: string
  tributeStatus?: TributeStatus
  createdAt: string
  confirmedAt?: string
  failedAt?: string
  receiptRef?: string
  providerRef: string
  idempotencyKey: string
  recordedBy?: string
  reconciled: boolean
  simulated: true
}

export interface ChemaPayoutApproval {
  by: string
  byUserId: string
  at: string
  decision: 'approved' | 'rejected'
  note?: string
}

export interface ChemaPayoutRequest {
  id: string
  caseId: string
  amount: number
  currency: Currency
  purpose: string
  destinationMasked: string
  requestedBy: string
  requestedByUserId: string
  requestedAt: string
  status: PayoutStatus
  requiredApprovals: number
  approvals: ChemaPayoutApproval[]
  note?: string
  providerRef?: string
  paidAt?: string
}

export interface ChemaDispute {
  id: string
  caseId: string
  category: DisputeCategory
  severity: DisputeSeverity
  status: DisputeStatus
  amount?: number
  source: LedgerSource
  summary: string
  owner: string
  reporter: string
  createdAt: string
  updatedAt: string
  resolution?: string
}

export interface ChemaHold {
  id: string
  caseId: string
  disputeId?: string
  amount: number
  source: LedgerSource
  reason: string
  status: 'active' | 'released'
  createdAt: string
  createdBy: string
  releasedAt?: string
  releasedBy?: string
}

export interface LedgerEntry {
  id: string
  caseId: string
  at: string
  source: LedgerSource
  account: string
  direction: LedgerDirection
  amount: number
  currency: Currency
  postingRef: string
  description: string
  relatedId?: string
  memo?: boolean
}

export interface ChemaAuditEntry {
  id: string
  caseId?: string
  at: string
  by: string
  action: string
  details?: string
  kind: AuditKind
}

export interface ChemaState {
  cases: ChemaCase[]
  contributions: ChemaContribution[]
  payouts: ChemaPayoutRequest[]
  disputes: ChemaDispute[]
  holds: ChemaHold[]
  ledger: LedgerEntry[]
  audit: ChemaAuditEntry[]
}

export interface ChemaActor {
  id: string
  name: string
}

export type ChemaCommandResult<T = undefined> =
  | { ok: true; data: T; state: ChemaState }
  | { ok: false; error: string; state: ChemaState }

/** Money is stored in whole cents to avoid floating point drift in the demo ledger. */
export const cents = (amount: number) => Math.round(amount * 100)
export const fromCents = (value: number) => value / 100
export const roundMoney = (amount: number) => Math.round(amount * 100) / 100
export const money = (amount: number) => `USD ${roundMoney(amount).toFixed(2)}`

export const methodLabels: Record<ContributionMethod, string> = {
  ecocash: 'EcoCash',
  onemoney: 'OneMoney',
  card: 'Card',
}

export const methodHints: Record<ContributionMethod, string> = {
  ecocash: 'Mobile money · simulated provider checkout',
  onemoney: 'Mobile money · simulated provider checkout',
  card: 'Card acquirer · simulated hosted checkout',
}

export const contributionStatusLabels: Record<ContributionStatus, string> = {
  initiated: 'Initiated',
  pending: 'Pending confirmation',
  successful: 'Confirmed',
  failed: 'Failed',
  refunded: 'Refunded',
  reversed: 'Reversed',
}

export const tributeStatusLabels: Record<TributeStatus, string> = {
  pending: 'Held for moderation',
  approved: 'Published',
  rejected: 'Not published',
}

export const caseStatusLabels: Record<CaseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under verification',
  verified: 'Verified',
  returned: 'Returned for correction',
  rejected: 'Verification rejected',
  suspended: 'Suspended',
  closed: 'Closed',
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const caseStatusTone: Record<CaseStatus, StatusTone> = {
  draft: 'neutral',
  submitted: 'warning',
  under_review: 'warning',
  verified: 'success',
  returned: 'warning',
  rejected: 'danger',
  suspended: 'danger',
  closed: 'neutral',
}

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  not_started: 'Not started',
  pending: 'Review in progress',
  approved: 'Approved',
  returned: 'Returned for correction',
  rejected: 'Rejected',
}

export const payoutStatusLabels: Record<PayoutStatus, string> = {
  submitted: 'Submitted',
  validating: 'Validating',
  awaiting_approval: 'Awaiting approval',
  initiated: 'Sent to provider',
  paid: 'Paid',
  failed: 'Failed',
  reversed: 'Reversed',
  rejected: 'Rejected',
}

export const payoutStatusTone: Record<PayoutStatus, StatusTone> = {
  submitted: 'info',
  validating: 'warning',
  awaiting_approval: 'warning',
  initiated: 'info',
  paid: 'success',
  failed: 'danger',
  reversed: 'danger',
  rejected: 'danger',
}

export const disputeStatusLabels: Record<DisputeStatus, string> = {
  raised: 'Raised',
  triaged: 'Triaged',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const disputeStatusTone: Record<DisputeStatus, StatusTone> = {
  raised: 'warning',
  triaged: 'info',
  investigating: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

export const disputeCategoryLabels: Record<DisputeCategory, string> = {
  payment: 'Payment dispute',
  authority: 'Family authority',
  fraud: 'Suspected fraud',
  chargeback: 'Chargeback',
  beneficiary: 'Beneficiary mismatch',
  reconciliation: 'Reconciliation exception',
  report: 'Public page report',
}

export const severityTone: Record<DisputeSeverity, StatusTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
}

export const evidenceLabels: Record<EvidenceType, string> = {
  death_certificate: 'Death record / certificate',
  national_id: 'Wallet administrator identity',
  authority_letter: 'Authority to administer community funds',
}

export const reasonCodes: Record<string, string> = {
  'VER-OK': 'All required evidence reviewed and accepted',
  'VER-EVIDENCE': 'Evidence incomplete or unclear',
  'VER-IDENTITY': 'Administrator identity or authority could not be confirmed',
  'VER-DUPLICATE': 'Possible duplicate case or reused evidence',
  'VER-OTHER': 'Other reason (see reviewer note)',
}

export const ledgerSourceLabels: Record<LedgerSource, string> = {
  community: 'Community contributions',
  cash: 'Physical cash recorded',
  fidelity_benefit: 'Fidelity benefit',
  fee: 'Fee',
  refund: 'Refund / reversal',
  payout: 'Payout',
}

export const auditKindLabels: Record<AuditKind, string> = {
  case: 'Case',
  verification: 'Verification',
  activation: 'Wallet',
  contribution: 'Contribution',
  payout: 'Payout',
  privacy: 'Privacy',
  dispute: 'Dispute',
  report: 'Report',
  ledger: 'Ledger',
}

export const requiredEvidence: EvidenceType[] = ['death_certificate', 'national_id', 'authority_letter']

const COMMITTED_PAYOUT_STATES: PayoutStatus[] = ['submitted', 'validating', 'awaiting_approval', 'initiated', 'paid']

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function caseByToken(state: ChemaState, token: string) {
  return state.cases.find((item) => item.contributionToken === token)
}

export function caseByRecord(state: ChemaState, funeralRecordId: string) {
  return state.cases.find((item) => item.funeralRecordId === funeralRecordId)
}

export function contributionsForCase(state: ChemaState, caseId: string) {
  return state.contributions
    .filter((item) => item.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function payoutsForCase(state: ChemaState, caseId: string) {
  return state.payouts
    .filter((item) => item.caseId === caseId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

export function disputesForCase(state: ChemaState, caseId: string) {
  return state.disputes.filter((item) => item.caseId === caseId)
}

export function activeHoldsForCase(state: ChemaState, caseId: string) {
  return state.holds.filter((item) => item.caseId === caseId && item.status === 'active')
}

export function ledgerForCase(state: ChemaState, caseId: string) {
  return state.ledger
    .filter((item) => item.caseId === caseId)
    .sort((a, b) => b.at.localeCompare(a.at) || a.direction.localeCompare(b.direction))
}

export function auditForCase(state: ChemaState, caseId: string) {
  return state.audit.filter((item) => item.caseId === caseId).sort((a, b) => b.at.localeCompare(a.at))
}

export function isPubliclyActive(item: ChemaCase) {
  return item.activated && item.status === 'verified'
}

export function contributionTotals(contributions: ChemaContribution[]) {
  const successfulDigital = contributions.filter((c) => c.kind === 'digital' && c.status === 'successful')
  const successfulCash = contributions.filter((c) => c.kind === 'cash' && c.status === 'successful')
  const pending = contributions.filter((c) => c.status === 'pending' || c.status === 'initiated')
  const failed = contributions.filter((c) => c.status === 'failed')
  const settled = [...successfulDigital, ...successfulCash]
  const uniqueContributors = new Set(
    settled.map((c) => (c.anonymous ? `anon:${c.id}` : c.contributorName.trim().toLowerCase())),
  )
  return {
    digitalTotal: roundMoney(successfulDigital.reduce((sum, c) => sum + c.amount, 0)),
    cashTotal: roundMoney(successfulCash.reduce((sum, c) => sum + c.amount, 0)),
    confirmedTotal: roundMoney(settled.reduce((sum, c) => sum + c.amount, 0)),
    pendingTotal: roundMoney(pending.reduce((sum, c) => sum + c.amount, 0)),
    pendingCount: pending.length,
    failedCount: failed.length,
    contributorCount: uniqueContributors.size,
    successfulCount: successfulDigital.length,
    activity: contributions.length,
  }
}

export function committedPayoutTotal(state: ChemaState, caseId: string) {
  return roundMoney(
    state.payouts
      .filter((p) => p.caseId === caseId && COMMITTED_PAYOUT_STATES.includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0),
  )
}

export function heldTotal(state: ChemaState, caseId: string) {
  return roundMoney(
    activeHoldsForCase(state, caseId)
      .filter((hold) => hold.source === 'community')
      .reduce((sum, hold) => sum + hold.amount, 0),
  )
}

/**
 * Only provider-confirmed digital contributions are spendable. Physical cash is
 * recorded for the family's consolidated view but is not held or settled by Chema.
 */
export function availableCommunityBalance(state: ChemaState, caseId: string) {
  const totals = contributionTotals(contributionsForCase(state, caseId))
  return roundMoney(Math.max(0, totals.digitalTotal - committedPayoutTotal(state, caseId) - heldTotal(state, caseId)))
}

export function caseProgress(item: ChemaCase, contributions: ChemaContribution[]) {
  const totals = contributionTotals(contributions)
  const target = item.targetAmount > 0 ? item.targetAmount : 0
  const value = totals.digitalTotal
  return {
    raised: value,
    target,
    percent: target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0,
    remaining: target > 0 ? Math.max(0, roundMoney(target - value)) : 0,
  }
}

export function publicTributes(state: ChemaState, caseId: string) {
  return contributionsForCase(state, caseId).filter(
    (c) => c.status === 'successful' && c.message && c.tributeStatus === 'approved',
  )
}

export function pendingTributes(state: ChemaState, caseId: string) {
  return contributionsForCase(state, caseId).filter(
    (c) => c.status === 'successful' && c.message && c.tributeStatus === 'pending',
  )
}

export interface DashboardMetrics {
  totalCommunity: number
  totalPending: number
  totalCash: number
  activeCases: number
  pendingVerification: number
  awaitingApproval: number
  openDisputes: number
  contributors: number
  settledContributions: number
}

export function dashboardMetrics(state: ChemaState): DashboardMetrics {
  const totals = contributionTotals(state.contributions)
  return {
    totalCommunity: totals.digitalTotal,
    totalPending: totals.pendingTotal,
    totalCash: totals.cashTotal,
    activeCases: state.cases.filter(isPubliclyActive).length,
    pendingVerification: state.cases.filter((c) => c.status === 'submitted' || c.status === 'under_review').length,
    awaitingApproval: state.payouts.filter((p) => p.status === 'awaiting_approval').length,
    openDisputes: state.disputes.filter((d) => d.status === 'raised' || d.status === 'triaged' || d.status === 'investigating').length,
    contributors: totals.contributorCount,
    settledContributions: totals.successfulCount,
  }
}

export function needsReview(item: ChemaCase) {
  return item.status === 'submitted' || item.status === 'under_review' || item.status === 'returned'
}

export function caseActionLabel(item: ChemaCase) {
  if (item.status === 'draft') return 'Continue draft'
  if (item.status === 'returned') return 'Correct and resubmit'
  if (item.status === 'under_review' || item.status === 'submitted') return 'Review verification'
  if (item.status === 'verified' && !item.activated) return 'Activate public page'
  if (item.status === 'verified') return 'Open wallet'
  if (item.status === 'suspended') return 'Review suspension'
  return 'Open case'
}
