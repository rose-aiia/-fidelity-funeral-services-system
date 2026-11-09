export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'unavailable'
export type ViewerStatus = 'invited' | 'accessed' | 'revoked'

export type StreamViewer = {
  id: string
  name: string
  contact: string
  status: ViewerStatus
  invitedAt: string
  accessedAt?: string
}

export type FuneralStream = {
  id: string
  personName: string
  serviceTitle: string
  date: string
  time: string
  venue: string
  details: string
  status: StreamStatus
  viewers: StreamViewer[]
  recordingAvailable: boolean
  savedToArchiveId?: string
  updatedAt: string
}

export const statusLabels: Record<StreamStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended',
  unavailable: 'Unavailable',
}

export const statusTone: Record<StreamStatus, 'neutral' | 'danger' | 'success' | 'warning' | 'info'> = {
  scheduled: 'info',
  live: 'danger',
  ended: 'success',
  unavailable: 'warning',
}

export const nextId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
