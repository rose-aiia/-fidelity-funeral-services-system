export type RecordStageId = 'parlour' | 'service' | 'procession' | 'burial'
export type RecordMediaKind = 'photo' | 'video' | 'document'
export type AccessLevel = 'owner' | 'family' | 'invited' | 'restricted'
export type AccessStatus = 'granted' | 'pending' | 'revoked'

export const stageOrder: RecordStageId[] = ['parlour', 'service', 'procession', 'burial']
export const stageLabels: Record<RecordStageId, string> = {
  parlour: '1. Funeral parlour arrangements',
  service: '2. Viewing or funeral service',
  procession: '3. Funeral procession',
  burial: '4. Burial',
}

export type AuditEntry = {
  id: string
  at: string
  by: string
  action: string
  details?: string
}

export type RecordMedia = {
  id: string
  kind: RecordMediaKind
  title: string
  stage: RecordStageId
  url?: string
  mime?: string
  note?: string
  addedAt: string
  addedBy: string
  simulated?: boolean
}

export type AccessGrant = {
  id: string
  name: string
  relationship: string
  channel: string
  level: AccessLevel
  status: AccessStatus
  grantedAt?: string
  grantedBy?: string
}

export type FuneralRecordArchive = {
  id: string
  personName: string
  reference: string
  summary: string
  stages: Array<{ id: RecordStageId; date?: string; location?: string; summary: string; completed: boolean }>
  media: RecordMedia[]
  documents: RecordMedia[]
  access: AccessGrant[]
  audit: AuditEntry[]
  linkedCoverageId?: string
  updatedAt: string
}

export function mediaByStage(archive: FuneralRecordArchive, stage: RecordStageId) {
  return archive.media.filter((m) => m.stage === stage)
}

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
