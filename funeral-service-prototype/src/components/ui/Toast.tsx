import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Rendered into document.body so a transformed ancestor can't break its fixed positioning. */
export function Toast({ children }: { children: ReactNode }) {
  return createPortal(
    <div className="toast" role="status" aria-live="polite">
      {children}
    </div>,
    document.body,
  )
}
