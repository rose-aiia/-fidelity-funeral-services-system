export type PolicyStatus = 'active' | 'grace' | 'lapsed'

export type Beneficiary = {
  name: string
  relationship: string
  /** Percentage of the benefit, summing to 100 across a policy. */
  share: number
}

export type PolicyDocument = {
  id: string
  name: string
  sizeKb: number
}

export type Policy = {
  number: string
  planName: string
  holderName: string
  status: PolicyStatus
  /** Benefit paid out, whole US dollars. */
  coverAmount: number
  /** Monthly premium, whole US dollars. */
  monthlyPremium: number
  /** Day of the month the premium falls due (1-28). */
  paymentDay: number
  /** ISO date the policy started. */
  startDate: string
  monthsPaid: number
  /** Months of premiums before natural-death cover is payable in full. */
  waitingPeriodMonths: number
  beneficiaries: Beneficiary[]
  documents: PolicyDocument[]
}

export type RequestKind = 'bereavement' | 'claim' | 'general'

export type RequestStatus = 'received' | 'assigned' | 'in_progress' | 'complete'

export type ContactPreference = 'call' | 'whatsapp' | 'sms'

export type AssistanceRequest = {
  id: string
  /** Human-readable reference a family can quote when they phone. */
  reference: string
  kind: RequestKind
  message: string
  contactPreference: ContactPreference
  status: RequestStatus
  /** ISO timestamp. */
  createdAt: string
  /** Name of the adviser handling it, once assigned. */
  assignedTo?: string
}

export type NewRequest = {
  kind: RequestKind
  message: string
  contactPreference: ContactPreference
}

export type LinkPolicyInput = { policyNumber: string; idNumber: string }

export const REQUEST_KINDS: { value: RequestKind; label: string; hint: string }[] = [
  { value: 'bereavement', label: 'A loved one has passed away', hint: 'An adviser will call you first.' },
  { value: 'claim', label: 'Make a claim', hint: 'We’ll guide you through the documents.' },
  { value: 'general', label: 'Something else', hint: 'Questions about cover, payments or services.' },
]

export const REQUEST_STEPS: { value: RequestStatus; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'assigned', label: 'Adviser assigned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'complete', label: 'Complete' },
]

export const CONTACT_OPTIONS: { value: ContactPreference; label: string }[] = [
  { value: 'call', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
]

export const MESSAGE_MAX_LENGTH = 600

/** Shown beside policy fields in mock mode so a demo can link a real-looking policy in one go. */
export const DEMO_POLICY_HINT = 'Demo mode: try policy FLA-318227 with ID number 08-765432-B-15.'

export const requestKindLabel: Record<RequestKind, string> = {
  bereavement: 'Bereavement support',
  claim: 'Claim',
  general: 'General enquiry',
}
