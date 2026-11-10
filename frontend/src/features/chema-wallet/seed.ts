import type {
  ChemaAuditEntry,
  ChemaCase,
  ChemaContribution,
  ChemaDispute,
  ChemaHold,
  ChemaPayoutRequest,
  ChemaState,
  LedgerEntry,
} from './data'

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

function contribution(partial: Omit<ChemaContribution, 'currency' | 'simulated' | 'idempotencyKey' | 'providerRef'> & Partial<Pick<ChemaContribution, 'idempotencyKey' | 'providerRef'>>): ChemaContribution {
  return {
    currency: 'USD',
    simulated: true,
    idempotencyKey: partial.idempotencyKey ?? `seed:${partial.id}`,
    providerRef: partial.providerRef ?? `SIM-${partial.id.toUpperCase()}`,
    ...partial,
  }
}

function ledgerForContribution(item: ChemaContribution): LedgerEntry[] {
  const at = item.confirmedAt ?? item.createdAt
  const postingRef = item.receiptRef ?? item.id
  const base = {
    caseId: item.caseId,
    at,
    amount: item.amount,
    currency: 'USD' as const,
    postingRef,
    relatedId: item.id,
  }
  if (item.kind === 'cash') {
    return [
      { ...base, id: `le-${item.id}-dr`, source: 'cash', account: 'memo:cash_received', direction: 'debit', description: 'Physical cash recorded (memo only)', memo: true },
      { ...base, id: `le-${item.id}-cr`, source: 'cash', account: 'memo:cash_recorded', direction: 'credit', description: 'Cash recorded for family view (memo only)', memo: true },
    ]
  }
  return [
    { ...base, id: `le-${item.id}-dr`, source: 'community', account: 'asset:provider_clearing', direction: 'debit', description: `${item.method} collection confirmed by provider (simulated)` },
    { ...base, id: `le-${item.id}-cr`, source: 'community', account: 'liability:community_wallet', direction: 'credit', description: 'Community contribution credited to family sub-ledger' },
  ]
}

function ledgerForPaidPayout(item: ChemaPayoutRequest): LedgerEntry[] {
  const at = item.paidAt ?? item.requestedAt
  const postingRef = item.providerRef ?? `PAYOUT-${item.id.toUpperCase()}`
  const base = {
    caseId: item.caseId,
    at,
    amount: item.amount,
    currency: 'USD' as const,
    postingRef,
    relatedId: item.id,
    source: 'payout' as const,
  }
  return [
    { ...base, id: `le-${item.id}-dr`, account: 'liability:community_wallet', direction: 'debit', description: 'Community wallet reduced for approved payout' },
    { ...base, id: `le-${item.id}-cr`, account: 'asset:provider_clearing', direction: 'credit', description: 'Payout settled by provider (simulated)' },
  ]
}

const cases: ChemaCase[] = [
  {
    id: 'cw-fr-nyathi',
    funeralRecordId: 'fr-nyathi',
    caseRef: 'FDR-2025-0903-GN',
    deceasedName: 'Grace Nyathi',
    dateOfDeath: '2025-08-28',
    funeralDate: '2025-09-10',
    funeralInfo: "Service at St Mary's Church, Makokoba · Burial at Athlone Cemetery, Bulawayo",
    memorialSlug: 'grace-nyathi',
    targetAmount: 1200,
    currency: 'USD',
    status: 'verified',
    verification: {
      status: 'approved',
      submittedAt: daysAgo(24),
      reviewedAt: daysAgo(23),
      reviewer: 'Fidelity Operations reviewer',
      reasonCode: 'VER-OK',
      note: 'Death record, administrator identity and family authority letter checked before activation.',
      evidence: [
        { id: 'ev-g1', type: 'death_certificate', label: 'Death record / certificate', fileName: 'grace-nyathi-death-record.pdf', uploadedAt: daysAgo(24), uploadedBy: 'Nomsa Ndlovu', scan: 'clean', note: 'Certified copy reviewed by operations.' },
        { id: 'ev-g2', type: 'national_id', label: 'Wallet administrator identity', fileName: 'nomsa-ndlovu-id.pdf', uploadedAt: daysAgo(24), uploadedBy: 'Nomsa Ndlovu', scan: 'clean' },
        { id: 'ev-g3', type: 'authority_letter', label: 'Authority to administer community funds', fileName: 'nyathi-family-authority.pdf', uploadedAt: daysAgo(23), uploadedBy: 'Nomsa Ndlovu', scan: 'clean', note: 'Signed by two family members.' },
      ],
      decisions: [
        { at: daysAgo(23), by: 'Fidelity Operations reviewer', decision: 'approved', reasonCode: 'VER-OK', note: 'All evidence present. Community verification only; not an insurance claim decision.' },
      ],
    },
    privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: true },
    contributionToken: 'chema-grace-nyathi-demo',
    activated: true,
    activatedAt: daysAgo(23),
    coordinator: { userId: 'u-sibanda', name: 'Brian Sibanda', phone: '+263 77 410 0001', assignedBy: 'Nomsa Ndlovu', assignedAt: daysAgo(20) },
    mandate: [
      { userId: 'u-ndlovu-admin', name: 'Nomsa Ndlovu', role: 'administrator', phoneMasked: '+263 •• ••• 0333', addedAt: daysAgo(24) },
      { userId: 'u-ndlovu', name: 'Thabo Ndlovu', role: 'approver', phoneMasked: '+263 •• ••• 0004', addedAt: daysAgo(24) },
      { userId: 'u-sibanda', name: 'Brian Sibanda', role: 'coordinator', phoneMasked: '+263 •• ••• 0001', addedAt: daysAgo(20) },
    ],
    approvalThreshold: 150,
    createdAt: daysAgo(26),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'cw-fr-moyo',
    funeralRecordId: 'fr-moyo',
    caseRef: 'FDR-2026-0412-TM',
    deceasedName: 'Tendai Moyo',
    dateOfDeath: '2026-04-02',
    funeralDate: '2026-04-12',
    funeralInfo: 'Service arrangements in progress, Harare',
    targetAmount: 800,
    currency: 'USD',
    status: 'under_review',
    verification: {
      status: 'pending',
      submittedAt: daysAgo(2),
      evidence: [
        { id: 'ev-t1', type: 'death_certificate', label: 'Death record / certificate', fileName: 'tendai-moyo-death-record.pdf', uploadedAt: daysAgo(2), uploadedBy: 'Tendai Phiri', scan: 'clean' },
        { id: 'ev-t2', type: 'national_id', label: 'Wallet administrator identity', fileName: 'tendai-phiri-id.pdf', uploadedAt: daysAgo(2), uploadedBy: 'Tendai Phiri', scan: 'pending', note: 'Automated scan still running; reviewer must verify.' },
      ],
      decisions: [],
    },
    privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: false },
    contributionToken: 'chema-tendai-moyo-demo',
    activated: false,
    mandate: [
      { userId: 'u-phiri', name: 'Tendai Phiri', role: 'administrator', phoneMasked: '+263 •• ••• 0005', addedAt: daysAgo(2) },
    ],
    approvalThreshold: 150,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: 'cw-fr-chikore',
    funeralRecordId: 'fr-chikore',
    caseRef: 'FDR-2026-0409-MC',
    deceasedName: 'Memory Chikore',
    dateOfDeath: '2026-03-29',
    funeralDate: '2026-04-08',
    funeralInfo: 'Funeral arrangements held in Chitungwiza',
    targetAmount: 600,
    currency: 'USD',
    status: 'returned',
    verification: {
      status: 'returned',
      submittedAt: daysAgo(5),
      reviewedAt: daysAgo(4),
      reviewer: 'Fidelity Operations reviewer',
      reasonCode: 'VER-EVIDENCE',
      note: 'The authority letter was not signed by the family administrator. Please upload a corrected letter and resubmit.',
      evidence: [
        { id: 'ev-m1', type: 'death_certificate', label: 'Death record / certificate', fileName: 'memory-chikore-death-record.pdf', uploadedAt: daysAgo(5), uploadedBy: 'Memory Chikore', scan: 'clean' },
      ],
      decisions: [
        { at: daysAgo(4), by: 'Fidelity Operations reviewer', decision: 'returned', reasonCode: 'VER-EVIDENCE', note: 'Signed authority letter missing.' },
      ],
    },
    privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: true },
    contributionToken: 'chema-memory-chikore-demo',
    activated: false,
    mandate: [
      { userId: 'u-chikore', name: 'Memory Chikore', role: 'administrator', phoneMasked: '+263 •• ••• 0002', addedAt: daysAgo(5) },
    ],
    approvalThreshold: 150,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
  },
  {
    id: 'cw-fr-ncube',
    funeralRecordId: 'fr-ncube',
    caseRef: 'FDR-2026-0415-SN',
    deceasedName: 'Sibusiso Ncube',
    funeralInfo: 'Draft case started from the family account',
    targetAmount: 500,
    currency: 'USD',
    status: 'draft',
    verification: { status: 'not_started', evidence: [], decisions: [] },
    privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: true },
    contributionToken: 'chema-sibusiso-ncube-demo',
    activated: false,
    mandate: [
      { userId: 'u-ncube', name: 'Tafara Ncube', role: 'administrator', addedAt: daysAgo(1) },
    ],
    approvalThreshold: 150,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'cw-fr-khumalo',
    funeralRecordId: 'fr-khumalo',
    caseRef: 'FDR-2026-0410-LK',
    deceasedName: 'Lindiwe Khumalo',
    dateOfDeath: '2026-03-30',
    funeralDate: '2026-04-09',
    funeralInfo: 'Service at Bulawayo Baptist Church · Burial at West Park Cemetery',
    targetAmount: 700,
    currency: 'USD',
    status: 'verified',
    verification: {
      status: 'approved',
      submittedAt: daysAgo(11),
      reviewedAt: daysAgo(10),
      reviewer: 'Fidelity Operations reviewer',
      reasonCode: 'VER-OK',
      note: 'Evidence checked. Community verification only.',
      evidence: [
        { id: 'ev-l1', type: 'death_certificate', label: 'Death record / certificate', fileName: 'lindiwe-khumalo-death-record.pdf', uploadedAt: daysAgo(11), uploadedBy: 'Lindiwe Khumalo', scan: 'clean' },
        { id: 'ev-l2', type: 'national_id', label: 'Wallet administrator identity', fileName: 'lindiwe-khumalo-id.pdf', uploadedAt: daysAgo(11), uploadedBy: 'Lindiwe Khumalo', scan: 'clean' },
        { id: 'ev-l3', type: 'authority_letter', label: 'Authority to administer community funds', fileName: 'khumalo-family-authority.pdf', uploadedAt: daysAgo(10), uploadedBy: 'Lindiwe Khumalo', scan: 'clean' },
      ],
      decisions: [
        { at: daysAgo(10), by: 'Fidelity Operations reviewer', decision: 'approved', reasonCode: 'VER-OK' },
      ],
    },
    privacy: { showDeceasedName: true, showAmounts: true, showProgress: true, showTributes: true, showContributors: true },
    contributionToken: 'chema-lindiwe-khumalo-demo',
    activated: true,
    activatedAt: daysAgo(10),
    coordinator: { userId: 'u-khumalo', name: 'Lindiwe Khumalo', phone: '+263 77 410 0006', assignedBy: 'Nomsa Ndlovu', assignedAt: daysAgo(9) },
    mandate: [
      { userId: 'u-khumalo', name: 'Lindiwe Khumalo', role: 'administrator', phoneMasked: '+263 •• ••• 0006', addedAt: daysAgo(11) },
      { userId: 'u-dlamini', name: 'Nomsa Dlamini', role: 'approver', phoneMasked: '+263 •• ••• 0003', addedAt: daysAgo(11) },
    ],
    approvalThreshold: 150,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
  },
]

const contributions: ChemaContribution[] = [
  contribution({ id: 'c-grace-1', caseId: 'cw-fr-nyathi', amount: 100, method: 'ecocash', kind: 'digital', status: 'successful', contributorName: 'Tendai Chikore', anonymous: false, message: 'With deepest sympathy. Grace welcomed everyone into her home.', tributeStatus: 'approved', createdAt: daysAgo(12), confirmedAt: daysAgo(12), receiptRef: 'CHEMA-DEMO-A1B2C3', reconciled: true }),
  contribution({ id: 'c-grace-2', caseId: 'cw-fr-nyathi', amount: 50, method: 'onemoney', kind: 'digital', status: 'successful', contributorName: 'Anonymous', anonymous: true, createdAt: daysAgo(10), confirmedAt: daysAgo(10), receiptRef: 'CHEMA-DEMO-D4E5F6', reconciled: true }),
  contribution({ id: 'c-grace-3', caseId: 'cw-fr-nyathi', amount: 75, method: 'card', kind: 'digital', status: 'successful', contributorName: 'Church Choir Group', anonymous: false, message: 'From the choir family. Her voice will be missed.', tributeStatus: 'approved', createdAt: daysAgo(8), confirmedAt: daysAgo(8), receiptRef: 'CHEMA-DEMO-G7H8I9', reconciled: true }),
  contribution({ id: 'c-grace-4', caseId: 'cw-fr-nyathi', amount: 125, method: 'ecocash', kind: 'digital', status: 'successful', contributorName: 'Memory Dube', anonymous: false, message: 'Sending love and strength to the Nyathi family.', tributeStatus: 'approved', createdAt: daysAgo(5), confirmedAt: daysAgo(5), receiptRef: 'CHEMA-DEMO-J1K2L3', reconciled: true }),
  contribution({ id: 'c-grace-5', caseId: 'cw-fr-nyathi', amount: 20, method: 'ecocash', kind: 'digital', status: 'pending', contributorName: 'Pastor Elias Ncube', anonymous: false, message: 'Praying for the family.', tributeStatus: 'pending', createdAt: hoursAgo(6), reconciled: false }),
  contribution({ id: 'c-grace-6', caseId: 'cw-fr-nyathi', amount: 40, method: 'ecocash', kind: 'cash', status: 'successful', contributorName: 'Neighbourhood collection', anonymous: false, message: 'Cash collected at the homestead (recorded separately).', createdAt: daysAgo(4), confirmedAt: daysAgo(4), receiptRef: 'CHEMA-CASH-M4N5O6', recordedBy: 'Brian Sibanda', reconciled: true }),
  contribution({ id: 'c-grace-7', caseId: 'cw-fr-nyathi', amount: 40, method: 'card', kind: 'digital', status: 'successful', contributorName: 'Farai Moyo', anonymous: false, createdAt: daysAgo(2), confirmedAt: daysAgo(2), receiptRef: 'CHEMA-DEMO-P7Q8R9', reconciled: true }),
  contribution({ id: 'c-grace-8', caseId: 'cw-fr-nyathi', amount: 30, method: 'ecocash', kind: 'digital', status: 'failed', contributorName: 'Rutendo Moyo', anonymous: false, createdAt: daysAgo(1), failedAt: daysAgo(1), reconciled: true }),
  contribution({ id: 'c-lindiwe-1', caseId: 'cw-fr-khumalo', amount: 80, method: 'ecocash', kind: 'digital', status: 'successful', contributorName: 'Work colleagues', anonymous: false, message: 'From all of us at the office. Rest in peace.', tributeStatus: 'approved', createdAt: daysAgo(7), confirmedAt: daysAgo(7), receiptRef: 'CHEMA-DEMO-S1T2U3', reconciled: true }),
  contribution({ id: 'c-lindiwe-2', caseId: 'cw-fr-khumalo', amount: 45, method: 'card', kind: 'digital', status: 'successful', contributorName: 'Anonymous', anonymous: true, createdAt: daysAgo(3), confirmedAt: daysAgo(3), receiptRef: 'CHEMA-DEMO-V4W5X6', reconciled: true }),
]

const payouts: ChemaPayoutRequest[] = [
  {
    id: 'p-grace-1',
    caseId: 'cw-fr-nyathi',
    amount: 250,
    currency: 'USD',
    purpose: 'Funeral service, catering and transport balance',
    destinationMasked: 'EcoCash ···· 0241',
    requestedBy: 'Nomsa Ndlovu',
    requestedByUserId: 'u-ndlovu-admin',
    requestedAt: daysAgo(2),
    status: 'awaiting_approval',
    requiredApprovals: 2,
    approvals: [
      { by: 'Thabo Ndlovu', byUserId: 'u-ndlovu', at: daysAgo(1), decision: 'approved', note: 'Family confirms the service expense.' },
    ],
    note: 'Quotes from the parlour and caterer are attached to the case evidence pack (demo).',
  },
  {
    id: 'p-lindiwe-1',
    caseId: 'cw-fr-khumalo',
    amount: 30,
    currency: 'USD',
    purpose: 'Grave marker deposit',
    destinationMasked: 'OneMoney ···· 1188',
    requestedBy: 'Lindiwe Khumalo',
    requestedByUserId: 'u-khumalo',
    requestedAt: daysAgo(3),
    status: 'paid',
    requiredApprovals: 1,
    approvals: [
      { by: 'Nomsa Dlamini', byUserId: 'u-dlamini', at: daysAgo(2), decision: 'approved', note: 'Approved as the additional family approver.' },
    ],
    providerRef: 'SIM-PAYOUT-1188',
    paidAt: daysAgo(1),
  },
]

const disputes: ChemaDispute[] = [
  {
    id: 'd-grace-1',
    caseId: 'cw-fr-nyathi',
    category: 'payment',
    severity: 'medium',
    status: 'investigating',
    amount: 25,
    source: 'community',
    summary: 'Contributor reports a possible duplicate EcoCash charge. Only the affected amount is held while Finance checks the provider statement.',
    owner: 'Finance operations',
    reporter: 'Tendai Chikore',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'd-grace-2',
    caseId: 'cw-fr-nyathi',
    category: 'report',
    severity: 'medium',
    status: 'triaged',
    source: 'community',
    summary: 'Public page reported for possible impersonation. Trust & safety is checking the family authority evidence and sharing history.',
    owner: 'Trust & safety',
    reporter: 'Anonymous visitor',
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(7),
  },
  {
    id: 'd-khumalo-1',
    caseId: 'cw-fr-khumalo',
    category: 'reconciliation',
    severity: 'low',
    status: 'resolved',
    amount: 5,
    source: 'community',
    summary: 'Provider settlement differed by USD 5.00 due to a transaction fee. Finance confirmed the fee disclosure and released the hold.',
    owner: 'Finance operations',
    reporter: 'Reconciliation service',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    resolution: 'Fee confirmed as disclosed and posted. No customer loss.',
  },
]

const holds: ChemaHold[] = [
  {
    id: 'h-grace-1',
    caseId: 'cw-fr-nyathi',
    disputeId: 'd-grace-1',
    amount: 25,
    source: 'community',
    reason: 'Possible duplicate EcoCash charge under investigation',
    status: 'active',
    createdAt: daysAgo(1),
    createdBy: 'Finance operations',
  },
]

const ledger: LedgerEntry[] = [
  ...contributions.filter((c) => c.status === 'successful').flatMap(ledgerForContribution),
  ...payouts.filter((p) => p.status === 'paid').flatMap(ledgerForPaidPayout),
]

const audit: ChemaAuditEntry[] = [
  { id: 'a-grace-1', caseId: 'cw-fr-nyathi', at: daysAgo(26), by: 'Nomsa Ndlovu', action: 'Funeral case drafted', details: 'Community wallet case created from funeral record FDR-2025-0903-GN.', kind: 'case' },
  { id: 'a-grace-2', caseId: 'cw-fr-nyathi', at: daysAgo(24), by: 'Nomsa Ndlovu', action: 'Verification evidence submitted', details: 'Death record, administrator identity and authority letter attached.', kind: 'verification' },
  { id: 'a-grace-3', caseId: 'cw-fr-nyathi', at: daysAgo(23), by: 'Fidelity Operations reviewer', action: 'Community verification approved', details: 'Reason VER-OK. This is not an insurance claim decision.', kind: 'verification' },
  { id: 'a-grace-4', caseId: 'cw-fr-nyathi', at: daysAgo(23), by: 'Nomsa Ndlovu', action: 'Public contribution page activated', details: 'Unique link and QR code generated after verification approval.', kind: 'activation' },
  { id: 'a-grace-5', caseId: 'cw-fr-nyathi', at: daysAgo(20), by: 'Nomsa Ndlovu', action: 'Chema Coordinator assigned', details: 'Brian Sibanda appointed. No payout authority granted.', kind: 'case' },
  { id: 'a-grace-6', caseId: 'cw-fr-nyathi', at: daysAgo(12), by: 'Tendai Chikore', action: 'Document contribution confirmed', details: 'EcoCash USD 100.00 · receipt CHEMA-DEMO-A1B2C3.', kind: 'contribution' },
  { id: 'a-grace-7', caseId: 'cw-fr-nyathi', at: daysAgo(4), by: 'Brian Sibanda', action: 'Physical cash recorded', details: 'USD 40.00 recorded separately. No digital transfer occurred.', kind: 'contribution' },
  { id: 'a-grace-8', caseId: 'cw-fr-nyathi', at: daysAgo(2), by: 'Nomsa Ndlovu', action: 'Payout request submitted', details: 'USD 250.00 for funeral service, catering and transport. Maker-checker required.', kind: 'payout' },
  { id: 'a-grace-9', caseId: 'cw-fr-nyathi', at: daysAgo(1), by: 'Thabo Ndlovu', action: 'Payout approval recorded', details: 'First approval recorded by a family approver. Second approval still required.', kind: 'payout' },
  { id: 'a-grace-10', caseId: 'cw-fr-nyathi', at: daysAgo(1), by: 'Finance operations', action: 'Source-specific hold placed', details: 'USD 25.00 held on the community source only pending a duplicate-payment check.', kind: 'dispute' },
  { id: 'a-grace-11', caseId: 'cw-fr-nyathi', at: hoursAgo(8), by: 'Anonymous visitor', action: 'Suspicious case reported', details: 'Report routed to Trust & safety for review. No automated adverse decision.', kind: 'report' },
  { id: 'a-moyo-1', caseId: 'cw-fr-moyo', at: daysAgo(3), by: 'Tendai Phiri', action: 'Funeral case drafted', details: 'Community wallet case created.', kind: 'case' },
  { id: 'a-moyo-2', caseId: 'cw-fr-moyo', at: daysAgo(2), by: 'Tendai Phiri', action: 'Verification evidence submitted', details: 'Case entered the community verification queue. Public sharing disabled.', kind: 'verification' },
  { id: 'a-chikore-1', caseId: 'cw-fr-chikore', at: daysAgo(6), by: 'Memory Chikore', action: 'Funeral case drafted', details: 'Community wallet case created.', kind: 'case' },
  { id: 'a-chikore-2', caseId: 'cw-fr-chikore', at: daysAgo(5), by: 'Memory Chikore', action: 'Verification evidence submitted', details: 'Case entered the community verification queue.', kind: 'verification' },
  { id: 'a-chikore-3', caseId: 'cw-fr-chikore', at: daysAgo(4), by: 'Fidelity Operations reviewer', action: 'Verification returned for correction', details: 'Reason VER-EVIDENCE. Public sharing remains disabled.', kind: 'verification' },
  { id: 'a-ncube-1', caseId: 'cw-fr-ncube', at: daysAgo(1), by: 'Tafara Ncube', action: 'Funeral case drafted', details: 'Draft created. Public page cannot be shared until verification passes.', kind: 'case' },
  { id: 'a-khumalo-1', caseId: 'cw-fr-khumalo', at: daysAgo(10), by: 'Fidelity Operations reviewer', action: 'Community verification approved', details: 'Reason VER-OK.', kind: 'verification' },
  { id: 'a-khumalo-2', caseId: 'cw-fr-khumalo', at: daysAgo(10), by: 'Lindiwe Khumalo', action: 'Public contribution page activated', details: 'Unique link and QR code generated.', kind: 'activation' },
  { id: 'a-khumalo-3', caseId: 'cw-fr-khumalo', at: daysAgo(3), by: 'Lindiwe Khumalo', action: 'Payout request submitted', details: 'USD 30.00 for a grave marker deposit.', kind: 'payout' },
  { id: 'a-khumalo-4', caseId: 'cw-fr-khumalo', at: daysAgo(2), by: 'Nomsa Dlamini', action: 'Payout approved', details: 'Approval recorded and instruction sent to the provider (simulated).', kind: 'payout' },
  { id: 'a-khumalo-5', caseId: 'cw-fr-khumalo', at: daysAgo(1), by: 'Payment provider', action: 'Payout settled', details: 'Provider confirmed settlement (simulated). Ledger entry posted.', kind: 'ledger' },
]

export function seedChemaState(): ChemaState {
  return {
    cases: structuredClone(cases),
    contributions: structuredClone(contributions),
    payouts: structuredClone(payouts),
    disputes: structuredClone(disputes),
    holds: structuredClone(holds),
    ledger: structuredClone(ledger),
    audit: structuredClone(audit),
  }
}

/** Used by the demo tools to prove a fresh-state walkthrough. */
export function emptyChemaState(): ChemaState {
  return { cases: [], contributions: [], payouts: [], disputes: [], holds: [], ledger: [], audit: [] }
}

/** Deterministic reference used by receipt and payment-intent generators. */
export function makeReference(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
