import type { PlotEnquiry } from './data'

const KEY = 'fidelity.mock.plotEnquiries'

const read = (): PlotEnquiry[] => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as PlotEnquiry[]
  } catch { /* storage unavailable */ }
  return []
}

export const plotEnquiryStore = {
  list: () => read(),
  add: (e: Omit<PlotEnquiry, 'id' | 'createdAt'>): PlotEnquiry => {
    const item = { ...e, id: `pe-${Date.now().toString(36)}`, createdAt: new Date().toISOString() }
    try { localStorage.setItem(KEY, JSON.stringify([item, ...read()])) } catch { /* storage unavailable */ }
    return item
  },
}
