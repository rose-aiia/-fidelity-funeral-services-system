export type ContributionMethod = 'ecocash' | 'onemoney' | 'card'
export type ContributionStatus = 'pending' | 'successful' | 'failed'
export type PayoutStatus = 'requested' | 'approved' | 'rejected'

export interface ChemaContribution {
  id: string
  caseId: string
  amount: number
  currency: 'USD'
  contributorName: string
  anonymous: boolean
  message?: string
  method: ContributionMethod
  kind: 'digital' | 'cash'
  status: ContributionStatus
  createdAt: string
  recordedBy?: string
  receiptRef: string
  simulated: true
}

export interface PayoutRequest {
  id: string
  caseId: string
  amount: number
  requestedBy: string
  requestedAt: string
  status: PayoutStatus
  reviewedBy?: string
  reviewedAt?: string
  note?: string
}

export interface ChemaAuditEntry {
  id: string
  at: string
  by: string
  action: string
  details?: string
}

export interface ChemaCoordinator {
  userId: string
  name: string
  phone?: string
  assignedBy: string
  assignedAt: string
}

export interface ChemaCase {
  id: string
  funeralRecordId: string
  caseRef: string
  deceasedName: string
  funeralInfo: string
  memorialSlug?: string
  activated: boolean
  verified: boolean
  contributionToken: string
  coordinator?: ChemaCoordinator
  payoutRequests: PayoutRequest[]
  audit: ChemaAuditEntry[]
  createdAt: string
  updatedAt: string
}

export interface ChemaState {
  cases: ChemaCase[]
  contributions: ChemaContribution[]
}

export const methodLabels: Record<ContributionMethod, string> = {
  ecocash: 'EcoCash',
  onemoney: 'OneMoney',
  card: 'Card',
}

export const statusLabels: Record<ContributionStatus, string> = {
  pending: 'Pending',
  successful: 'Successful',
  failed: 'Failed',
}

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function contributionTotals(contributions: ChemaContribution[]) {
  const digital = contributions.filter((c) => c.kind === 'digital' && c.status === 'successful')
  const cash = contributions.filter((c) => c.kind === 'cash')
  const pending = contributions.filter((c) => c.status === 'pending')
  return {
    digitalTotal: digital.reduce((s, c) => s + c.amount, 0),
    cashTotal: cash.reduce((s, c) => s + c.amount, 0),
    contributorCount: new Set(contributions.filter((c) => c.status === 'successful' || c.kind === 'cash').map((c) => c.anonymous ? c.id : c.contributorName.toLowerCase())).size,
    pendingCount: pending.length,
    successfulCount: contributions.filter((c) => c.status === 'successful').length,
    activity: contributions.length,
  }
}

export function caseByToken(state: ChemaState, token: string) {
  return state.cases.find((c) => c.contributionToken === token)
}

export function caseByRecord(state: ChemaState, funeralRecordId: string) {
  return state.cases.find((c) => c.funeralRecordId === funeralRecordId)
}

export function caseByMemorial(state: ChemaState, memorialSlug: string) {
  return state.cases.find((c) => c.memorialSlug === memorialSlug)
}

export function contributionsForCase(state: ChemaState, caseId: string) {
  return state.contributions
    .filter((c) => c.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function makeReceiptRef() {
  return `CHEMA-DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
