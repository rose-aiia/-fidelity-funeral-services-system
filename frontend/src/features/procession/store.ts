import { emptyShare, type ShareState } from './data'

const key = (id: string) => `fidelity.mock.procession.${id}`

export function loadShare(id: string): ShareState {
  try {
    const raw = localStorage.getItem(key(id))
    if (raw) return { ...emptyShare(), ...(JSON.parse(raw) as Partial<ShareState>) }
  } catch { /* storage unavailable */ }
  return emptyShare()
}

export function saveShare(id: string, share: ShareState) {
  try { localStorage.setItem(key(id), JSON.stringify(share)) } catch { /* storage unavailable */ }
}
