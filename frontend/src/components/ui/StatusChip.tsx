import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** A small pill whose colour carries a state; the text always says it too, so colour is never the only signal. */
export function StatusChip({ tone = 'neutral', children }: { tone?: StatusTone; children: ReactNode }) {
  return <span className={`status-chip status-chip--${tone}`}>{children}</span>
}
