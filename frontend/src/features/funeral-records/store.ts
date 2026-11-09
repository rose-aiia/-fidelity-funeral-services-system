import type { AccessGrant, AccessStatus, FuneralRecordArchive, RecordMedia, RecordStageId } from './data'
import { nextId } from './data'
import { seedFuneralRecords } from './seed'

const KEY = 'fidelity.mock.funeralRecords'
const read = (): FuneralRecordArchive[] => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as FuneralRecordArchive[] } catch {}
  const seed = seedFuneralRecords(); localStorage.setItem(KEY, JSON.stringify(seed)); return seed
}
const write = (items: FuneralRecordArchive[]) => { localStorage.setItem(KEY, JSON.stringify(items)); return items }
const touch = (a: FuneralRecordArchive, entry: { by: string; action: string; details?: string }) => ({
  ...a, updatedAt: new Date().toISOString(), audit: [{ id: nextId('au'), at: new Date().toISOString(), ...entry }, ...a.audit],
})

export const funeralRecordsStore = {
  list: () => read(),
  get: (id: string) => read().find((x) => x.id === id),
  addMedia: (archiveId: string, input: { kind: RecordMedia['kind']; title: string; stage: RecordStageId; url?: string; mime?: string; note?: string; addedBy: string }) => {
    const item: RecordMedia = { id: nextId(input.kind === 'document' ? 'rd' : 'rm'), ...input, addedAt: new Date().toISOString(), simulated: true }
    return write(read().map((a) => {
      if (a.id !== archiveId) return a
      const next = item.kind === 'document'
        ? { ...a, documents: [item, ...a.documents] }
        : { ...a, media: [item, ...a.media] }
      return touch(next, { by: input.addedBy, action: item.kind === 'document' ? 'Document added' : 'Media added', details: item.title })
    })).find((a) => a.id === archiveId)
  },
  setAccess: (archiveId: string, accessId: string, status: AccessStatus, by: string) => {
    return write(read().map((a) => a.id !== archiveId ? a : touch({ ...a, access: a.access.map((g) => g.id === accessId ? { ...g, status, grantedAt: status === 'granted' ? new Date().toISOString() : g.grantedAt, grantedBy: by } : g) }, { by, action: 'Access updated', details: `${a.access.find((g) => g.id === accessId)?.name ?? 'Viewer'} set to ${status}.` }))).find((a) => a.id === archiveId)
  },
  addAccess: (archiveId: string, input: Pick<AccessGrant, 'name' | 'relationship' | 'channel' | 'level'>, by: string) => {
    const grant: AccessGrant = { id: nextId('ra'), ...input, status: 'pending' }
    return write(read().map((a) => a.id !== archiveId ? a : touch({ ...a, access: [grant, ...a.access] }, { by, action: 'Access invitation created', details: `${grant.name} invited as ${grant.level}.` }))).find((a) => a.id === archiveId)
  },
}
