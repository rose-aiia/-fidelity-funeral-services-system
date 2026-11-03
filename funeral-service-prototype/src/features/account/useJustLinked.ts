import { useState } from 'react'
import type { Policy } from './data'

/**
 * Returns the policy only when it appeared during this visit (the page first saw "no policy", then one got
 * linked), so a celebration shows once at the moment it matters and never on a normal reload.
 */
export function useJustLinked(policy: Policy | null | undefined): Policy | null {
  const [sawNone, setSawNone] = useState(policy === null)
  // Derived during render rather than in an effect, so there is no extra paint between the two states.
  if (policy === null && !sawNone) setSawNone(true)

  return sawNone && policy ? policy : null
}
