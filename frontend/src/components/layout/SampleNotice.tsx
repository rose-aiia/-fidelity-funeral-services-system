import { useState } from 'react'

const KEY = 'fidelity.sampleNoticeDismissed'

const wasDismissed = () => {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** A slim, dismissible line saying the content is fictional, so the hero doesn't have to. */
export function SampleNotice() {
  const [dismissed, setDismissed] = useState(wasDismissed)
  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(KEY, '1')
    } catch {
      // Storage unavailable: the notice returns on the next visit.
    }
  }

  return (
    <div className="sample-notice" role="note">
      <p>Demonstration prototype. Every plan, price, policy and person here is fictional.</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss this notice">
        Dismiss
      </button>
    </div>
  )
}
