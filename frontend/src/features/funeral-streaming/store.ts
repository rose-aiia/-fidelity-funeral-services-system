import type { FuneralStream, StreamStatus, ViewerStatus } from './data'
import { nextId } from './data'
import { seedStreams } from './seed'

const KEY = 'fidelity.mock.funeralStreams'
const read = (): FuneralStream[] => { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r) as FuneralStream[] } catch {} const s = seedStreams(); localStorage.setItem(KEY, JSON.stringify(s)); return s }
const write = (items: FuneralStream[]) => { localStorage.setItem(KEY, JSON.stringify(items)); return items }

export const funeralStreamingStore = {
  list: () => read(),
  get: (id: string) => read().find((x) => x.id === id),
  setStatus: (id: string, status: StreamStatus) => write(read().map((s) => s.id === id ? { ...s, status, recordingAvailable: status === 'ended' ? true : s.recordingAvailable, updatedAt: new Date().toISOString() } : s)).find((s) => s.id === id),
  addViewer: (id: string, name: string, contact: string) => write(read().map((s) => s.id === id ? { ...s, viewers: [{ id: nextId('sv'), name, contact, status: 'invited', invitedAt: new Date().toISOString() }, ...s.viewers], updatedAt: new Date().toISOString() } : s)).find((s) => s.id === id),
  setViewer: (id: string, viewerId: string, status: ViewerStatus) => write(read().map((s) => s.id === id ? { ...s, viewers: s.viewers.map((v) => v.id === viewerId ? { ...v, status, accessedAt: status === 'accessed' ? new Date().toISOString() : v.accessedAt } : v), updatedAt: new Date().toISOString() } : s)).find((s) => s.id === id),
  saveRecording: (id: string, archiveId: string) => write(read().map((s) => s.id === id ? { ...s, savedToArchiveId: archiveId, updatedAt: new Date().toISOString() } : s)).find((s) => s.id === id),
}
