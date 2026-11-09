import type { ExhumationAccess, ExhumationEvent, ExhumationStatus } from './data'
import { nextId } from './data'
import { seedExhumationEvents } from './seed'

const KEY = 'fidelity.mock.exhumationCoverage'
const AUTH_KEY = 'fidelity.mock.exhumationAuth'
const read = (): ExhumationEvent[] => { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r) as ExhumationEvent[] } catch {} const s = seedExhumationEvents(); localStorage.setItem(KEY, JSON.stringify(s)); return s }
const write = (items: ExhumationEvent[]) => { localStorage.setItem(KEY, JSON.stringify(items)); return items }
const audit = (e: ExhumationEvent, by: string, action: string, details?: string): ExhumationEvent => ({ ...e, updatedAt: new Date().toISOString(), audit: [{ id: nextId('ea'), at: new Date().toISOString(), by, action, details }, ...e.audit] })

export const exhumationAuthStore = {
  hasLocalAuthorization: (caseId: string, userId = 'current') => { try { return Boolean((JSON.parse(localStorage.getItem(AUTH_KEY) || '{}') as Record<string, boolean>)[`${userId}:${caseId}`]) } catch { return false } },
  grantLocalAuthorization: (caseId: string, userId = 'current') => { try { const v = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}') as Record<string, boolean>; v[`${userId}:${caseId}`] = true; localStorage.setItem(AUTH_KEY, JSON.stringify(v)) } catch {} },
}

export const exhumationStore = {
  list: () => read(),
  get: (id: string) => read().find((x) => x.id === id),
  setStatus: (id: string, status: ExhumationStatus, by: string) => write(read().map((e) => e.id === id ? audit({ ...e, status }, by, 'Coverage status updated', `Status set to ${status}.`) : e)).find((e) => e.id === id),
  setViewer: (id: string, viewerId: string, status: ExhumationAccess, by: string) => write(read().map((e) => e.id === id ? audit({ ...e, viewers: e.viewers.map((v) => v.id === viewerId ? { ...v, status, updatedAt: new Date().toISOString(), updatedBy: by } : v) }, by, 'Viewer access changed', `${e.viewers.find((v) => v.id === viewerId)?.name ?? 'Viewer'}: ${status}.`) : e)).find((e) => e.id === id),
  suspendAll: (id: string, by: string) => write(read().map((e) => e.id === id ? audit({ ...e, status: 'suspended', viewers: e.viewers.map((v) => ({ ...v, status: v.status === 'revoked' ? 'revoked' : 'suspended', updatedAt: new Date().toISOString(), updatedBy: by })) }, by, 'All access suspended', 'Coverage suspended and active viewer sessions marked suspended.') : e)).find((e) => e.id === id),
}
