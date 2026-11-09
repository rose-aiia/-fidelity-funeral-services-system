export type ExhumationStatus = 'pending-authorisation' | 'authorised' | 'scheduled' | 'live' | 'ended' | 'suspended'
export type ExhumationAccess = 'granted' | 'pending' | 'suspended' | 'revoked'

export type ExhumationViewer = {
  id: string
  name: string
  role: string
  status: ExhumationAccess
  updatedAt: string
  updatedBy: string
}

export type ExhumationAudit = { id: string; at: string; by: string; action: string; details?: string }

export type ExhumationEvent = {
  id: string
  reference: string
  caseName: string
  location: string
  scheduledAt: string
  approvalStatus: 'awaiting-approval' | 'approved' | 'suspended'
  authorisingBody: string
  status: ExhumationStatus
  details: string
  viewers: ExhumationViewer[]
  audit: ExhumationAudit[]
  recordingAvailable: boolean
  updatedAt: string
}

export const exhumationStatusLabels: Record<ExhumationStatus, string> = {
  'pending-authorisation': 'Pending authorisation',
  authorised: 'Authorised',
  scheduled: 'Scheduled',
  live: 'Live (simulated)',
  ended: 'Ended',
  suspended: 'Suspended',
}

export const nextId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
