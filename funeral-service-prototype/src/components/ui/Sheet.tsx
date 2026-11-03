import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import './sheet.css'

type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Small text above the title: a reference, a kind. */
  eyebrow?: string
  children: ReactNode
}

/** A panel that slides in from the right on a native <dialog>: focus is trapped, Esc and the backdrop close it. */
export function Sheet({ open, onClose, title, eyebrow, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
    >
      {open && (
        <div className="sheet__panel">
          <header className="sheet__head">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              <h2 id={titleId}>{title}</h2>
            </div>
            <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
              <Icon name="plus" size={20} className="sheet__x" />
            </button>
          </header>
          <div className="sheet__body">{children}</div>
        </div>
      )}
    </dialog>
  )
}
