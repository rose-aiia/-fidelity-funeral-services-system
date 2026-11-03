// Sample "back-office" data for mock mode and scripts/mock-api.mjs (both import this file directly, so it
// has only type imports). The ID numbers are fictional. A real API never sends them to the browser.
import type { AssistanceRequest, Policy } from './data'

export type PolicyRecord = {
  policy: Policy
  /** What the holder must supply, together with the policy number, to link the policy to an account. */
  idNumber: string
}

export const policyRecords: PolicyRecord[] = [
  {
    idNumber: '63-123456-K-42',
    policy: {
      number: 'FLA-204815',
      planName: 'Comfort family plan',
      holderName: 'Rutendo Moyo',
      status: 'active',
      coverAmount: 7800,
      monthlyPremium: 14,
      paymentDay: 28,
      startDate: '2025-04-28',
      monthsPaid: 18,
      waitingPeriodMonths: 6,
      beneficiaries: [
        { name: 'Tendai Moyo', relationship: 'Spouse', share: 50 },
        { name: 'Farai Moyo', relationship: 'Son', share: 30 },
        { name: 'Nyasha Moyo', relationship: 'Daughter', share: 20 },
      ],
      documents: [
        { id: 'd1', name: 'Policy schedule', sizeKb: 184 },
        { id: 'd2', name: 'Terms and conditions', sizeKb: 412 },
        { id: 'd3', name: 'Beneficiary nomination form', sizeKb: 96 },
      ],
    },
  },
  {
    idNumber: '08-765432-B-15',
    policy: {
      number: 'FLA-318227',
      planName: 'Essential plan',
      holderName: 'Tafara Ncube',
      status: 'active',
      coverAmount: 4200,
      monthlyPremium: 8,
      paymentDay: 15,
      startDate: '2026-08-15',
      monthsPaid: 3,
      waitingPeriodMonths: 6,
      beneficiaries: [{ name: 'Rudo Ncube', relationship: 'Mother', share: 100 }],
      documents: [
        { id: 'd1', name: 'Policy schedule', sizeKb: 171 },
        { id: 'd2', name: 'Terms and conditions', sizeKb: 412 },
      ],
    },
  },
]

/** Which policy each built-in demo user already has linked. */
export const demoPolicyLinks: Record<string, string> = { 'u-moyo': 'FLA-204815' }

/** Policy numbers and IDs are matched ignoring case, spaces and punctuation. */
export const normaliseKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toUpperCase()

export function findPolicyRecord(policyNumber: string, idNumber: string): PolicyRecord | undefined {
  return policyRecords.find(
    (record) =>
      normaliseKey(record.policy.number) === normaliseKey(policyNumber) &&
      normaliseKey(record.idNumber) === normaliseKey(idNumber),
  )
}

export function findPolicyByNumber(policyNumber: string): Policy | undefined {
  return policyRecords.find((record) => normaliseKey(record.policy.number) === normaliseKey(policyNumber))?.policy
}

const DAY_MS = 86_400_000

/** Requests the built-in demo users already have, dated relative to `now` so they never look stale. */
export function demoRequestsFor(userId: string, now: Date = new Date()): AssistanceRequest[] {
  if (userId !== 'u-moyo') return []
  return [
    {
      id: 'ar-demo-1',
      reference: 'AR-1042',
      kind: 'general',
      message: 'I would like to add my youngest daughter as a beneficiary.',
      contactPreference: 'whatsapp',
      status: 'assigned',
      createdAt: new Date(now.getTime() - 2 * DAY_MS).toISOString(),
      assignedTo: 'Chipo Dube',
    },
  ]
}
