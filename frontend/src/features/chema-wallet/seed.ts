import type { ChemaState } from './data'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()

export function seedChemaState(): ChemaState {
  return {
    cases: [
      {
        id: 'cw-fr-nyathi',
        funeralRecordId: 'fr-nyathi',
        caseRef: 'FDR-2025-0903-GN',
        deceasedName: 'Grace Nyathi',
        funeralInfo: "Service: 10 Sep 2025, St Mary's Church, Makokoba, Bulawayo. Burial at Athlone Cemetery.",
        memorialSlug: 'grace-nyathi',
        activated: true,
        verified: true,
        contributionToken: 'chema-grace-nyathi-demo',
        coordinator: {
          userId: 'u-sibanda',
          name: 'Brian Sibanda',
          phone: '+263774100001',
          assignedBy: 'Nomsa Ndlovu',
          assignedAt: daysAgo(20),
        },
        payoutRequests: [
          {
            id: 'pr-1',
            caseId: 'cw-fr-nyathi',
            amount: 250,
            requestedBy: 'Nomsa Ndlovu',
            requestedAt: daysAgo(2),
            status: 'requested',
            note: 'Demo payout request for service-related expenses (simulation only).',
          },
        ],
        audit: [
          { id: 'a1', at: daysAgo(21), by: 'Nomsa Ndlovu', action: 'Funeral case verified', details: 'Verification completed for Chema Wallet activation (demo workflow).' },
          { id: 'a2', at: daysAgo(21), by: 'Nomsa Ndlovu', action: 'Chema Wallet activated', details: 'Wallet enabled for verified funeral case FDR-2025-0903-GN.' },
          { id: 'a3', at: daysAgo(20), by: 'Nomsa Ndlovu', action: 'Coordinator assigned', details: 'Brian Sibanda appointed as Chema Coordinator for this funeral.' },
          { id: 'a4', at: daysAgo(2), by: 'Nomsa Ndlovu', action: 'Payout request submitted', details: 'Demo payout review requested for USD 250.00 (no real settlement).' },
        ],
        createdAt: daysAgo(21),
        updatedAt: hoursAgo(2),
      },
      {
        id: 'cw-fr-moyo',
        funeralRecordId: 'fr-moyo',
        caseRef: 'FDR-2026-0412-TM',
        deceasedName: 'Tendai Moyo',
        funeralInfo: 'Service arrangements in progress, Harare (demo case).',
        activated: false,
        verified: true,
        contributionToken: 'chema-tendai-moyo-demo',
        payoutRequests: [],
        audit: [
          { id: 'b1', at: daysAgo(3), by: 'Nomsa Ndlovu', action: 'Funeral case verified', details: 'Case verified and eligible for Chema Wallet activation (demo).' },
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ],
    contributions: [
      { id: 'c1', caseId: 'cw-fr-nyathi', amount: 50, currency: 'USD', contributorName: 'Nomsa Dlamini', anonymous: false, message: 'With deepest sympathy.', method: 'ecocash', kind: 'digital', status: 'successful', createdAt: daysAgo(5), receiptRef: 'CHEMA-DEMO-A1B2C3', simulated: true },
      { id: 'c2', caseId: 'cw-fr-nyathi', amount: 30, currency: 'USD', contributorName: 'Anonymous', anonymous: true, method: 'onemoney', kind: 'digital', status: 'successful', createdAt: daysAgo(4), receiptRef: 'CHEMA-DEMO-D4E5F6', simulated: true },
      { id: 'c3', caseId: 'cw-fr-nyathi', amount: 100, currency: 'USD', contributorName: 'Church Choir Group', anonymous: false, message: 'From the choir family.', method: 'card', kind: 'digital', status: 'successful', createdAt: daysAgo(3), receiptRef: 'CHEMA-DEMO-G7H8I9', simulated: true },
      { id: 'c4', caseId: 'cw-fr-nyathi', amount: 20, currency: 'USD', contributorName: 'Pastor Elias Ncube', anonymous: false, method: 'ecocash', kind: 'digital', status: 'pending', createdAt: hoursAgo(6), receiptRef: 'CHEMA-DEMO-J1K2L3', simulated: true },
      { id: 'c5', caseId: 'cw-fr-nyathi', amount: 75, currency: 'USD', contributorName: 'Neighbourhood collection', anonymous: false, message: 'Cash collected at the homestead (recorded separately).', method: 'ecocash', kind: 'cash', status: 'successful', createdAt: daysAgo(2), recordedBy: 'Brian Sibanda', receiptRef: 'CHEMA-DEMO-M4N5O6', simulated: true },
    ],
  }
}
