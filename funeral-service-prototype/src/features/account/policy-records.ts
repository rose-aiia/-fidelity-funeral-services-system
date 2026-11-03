// Sample "back-office" data for mock mode and scripts/mock-api.mjs (both import this file directly, so it
// has only type imports). The ID numbers are fictional. A real API never sends them to the browser.
import type { AssistanceRequest, Policy } from './data'

export type PolicyRecord = {
  policy: Policy
  /** What the holder must supply, together with the policy number, to link the policy to an account. */
  idNumber: string
}

/** A compact way to describe the extra demo customers' policies. */
function extraRecord(
  number: string,
  idNumber: string,
  holderName: string,
  planName: string,
  status: Policy['status'],
  coverAmount: number,
  monthlyPremium: number,
  monthsPaid: number,
  paymentDay: number,
  startMonthsAgo: number,
  waitingPeriodMonths: number,
  beneficiaries: [string, string, number][],
): PolicyRecord[] {
  const start = new Date(Date.UTC(2026, 10 - startMonthsAgo, Math.min(paymentDay, 28)))
  return [
    {
      idNumber,
      policy: {
        number,
        planName,
        holderName,
        status,
        coverAmount,
        monthlyPremium,
        paymentDay: Math.min(paymentDay, 28),
        startDate: start.toISOString().slice(0, 10),
        monthsPaid,
        waitingPeriodMonths,
        beneficiaries: beneficiaries.map(([name, relationship, share]) => ({ name, relationship, share })),
        documents: [
          { id: 'd1', name: 'Policy schedule', sizeKb: 172 },
          { id: 'd2', name: 'Terms and conditions', sizeKb: 412 },
        ],
      },
    },
  ]
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
  ...extraRecord('FLA-402118', '41-220985-M-30', 'Brian Sibanda', 'Comfort family plan', 'active', 7800, 14, 3, 20, 11, 6, [['Sipho Sibanda', 'Spouse', 100]]),
  ...extraRecord('FLA-512930', '29-114477-C-12', 'Memory Chikore', 'Legacy family plan', 'active', 12500, 22, 12, 26, 40, 6, [['Tendai Chikore', 'Spouse', 60], ['Ruvarashe Chikore', 'Daughter', 40]]),
  ...extraRecord('FLA-290775', '75-330120-D-07', 'Nomsa Dlamini', 'Essential plan', 'grace', 4200, 8, 18, 5, 8, 6, [['Zanele Dlamini', 'Mother', 100]]),
  ...extraRecord('FLA-377641', '12-998201-N-44', 'Thabo Ndlovu', 'Essential plan', 'active', 4200, 8, 6, 25, 6, 6, [['Nomalanga Ndlovu', 'Spouse', 100]]),
  ...extraRecord('FLA-455103', '60-571342-P-19', 'Tendai Phiri', 'Comfort family plan', 'lapsed', 7800, 14, 5, 12, 5, 6, [['Chiedza Phiri', 'Spouse', 100]]),
]

/** Which policy each built-in demo user already has linked. */
export const demoPolicyLinks: Record<string, string> = {
  'u-moyo': 'FLA-204815',
  'u-sibanda': 'FLA-402118',
  'u-chikore': 'FLA-512930',
  'u-dlamini': 'FLA-290775',
  'u-ndlovu': 'FLA-377641',
  'u-phiri': 'FLA-455103',
}

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

const HOUR_MS = 3_600_000

type SeedRequest = Omit<AssistanceRequest, 'createdAt'> & { ageHours: number }

const HARARE = { providerId: 'harare-funeral-care', providerName: 'Harare Funeral Care' }
const BULAWAYO = { providerId: 'bulawayo-memorial-services', providerName: 'Bulawayo Memorial Services' }

const seedRequestRows: Record<string, SeedRequest[]> = {
  'u-moyo': [
    {
      id: 'ar-demo-1',
      reference: 'AR-1042',
      kind: 'general',
      message: 'I would like to add my youngest daughter as a beneficiary.',
      contactPreference: 'whatsapp',
      status: 'assigned',
      ageHours: 48,
      assignedTo: HARARE.providerName,
      assignment: { ...HARARE, status: 'assigned', assignedAt: '', note: 'Customer prefers WhatsApp.' },
    },
  ],
  'u-sibanda': [
    {
      id: 'ar-demo-2',
      reference: 'AR-1051',
      kind: 'bereavement',
      message: 'My father passed this morning at Parirenyatwa. We need guidance on what to do next.',
      contactPreference: 'call',
      status: 'received',
      ageHours: 3,
    },
  ],
  'u-chikore': [
    {
      id: 'ar-demo-3',
      reference: 'AR-1047',
      kind: 'claim',
      message: 'I would like to start a claim for my late mother-in-law.',
      contactPreference: 'call',
      status: 'in_progress',
      ageHours: 30,
      assignedTo: BULAWAYO.providerName,
      assignment: { ...BULAWAYO, status: 'accepted', assignedAt: '', note: 'Claim documents requested.' },
    },
  ],
  'u-dlamini': [
    {
      id: 'ar-demo-4',
      reference: 'AR-1039',
      kind: 'general',
      message: 'Can you confirm my premium is paid up to date?',
      contactPreference: 'sms',
      status: 'complete',
      ageHours: 9 * 24,
      assignedTo: HARARE.providerName,
      assignment: { ...HARARE, status: 'completed', assignedAt: '' },
    },
  ],
  'u-ndlovu': [
    {
      id: 'ar-demo-5',
      reference: 'AR-1049',
      kind: 'bereavement',
      message: 'Our grandmother has passed in Gweru. Please call us.',
      contactPreference: 'whatsapp',
      status: 'assigned',
      ageHours: 20,
      assignedTo: HARARE.providerName,
      assignment: { ...HARARE, status: 'assigned', assignedAt: '', note: 'Family is in Gweru; arrange transport.' },
    },
  ],
  'u-phiri': [
    {
      id: 'ar-demo-6',
      reference: 'AR-1052',
      kind: 'general',
      message: 'My policy shows as lapsed. How do I reinstate it?',
      contactPreference: 'sms',
      status: 'received',
      ageHours: 26,
    },
  ],
  'u-khumalo': [
    {
      id: 'ar-demo-7',
      reference: 'AR-1044',
      kind: 'claim',
      message: 'Claim for my uncle. I have the death certificate ready.',
      contactPreference: 'call',
      status: 'received',
      ageHours: 60,
      assignment: { ...BULAWAYO, status: 'declined', assignedAt: '', note: 'Declined: family is outside our service area.' },
    },
  ],
}

/** Every built-in demo request, keyed by the user who made it, dated relative to `now` so none looks stale. */
export function seedRequests(now: Date = new Date()): Record<string, AssistanceRequest[]> {
  return Object.fromEntries(
    Object.entries(seedRequestRows).map(([userId, rows]) => [
      userId,
      rows.map(({ ageHours, ...row }): AssistanceRequest => {
        const createdAt = now.getTime() - ageHours * HOUR_MS
        const assignment = row.assignment && {
          ...row.assignment,
          assignedAt: new Date(createdAt + HOUR_MS).toISOString(),
          ...(row.assignment.status !== 'assigned' && { respondedAt: new Date(createdAt + 3 * HOUR_MS).toISOString() }),
        }
        return { ...row, createdAt: new Date(createdAt).toISOString(), ...(assignment && { assignment }) }
      }),
    ]),
  )
}

/** Requests the built-in demo users already have. */
export function demoRequestsFor(userId: string, now: Date = new Date()): AssistanceRequest[] {
  return seedRequests(now)[userId] ?? []
}
