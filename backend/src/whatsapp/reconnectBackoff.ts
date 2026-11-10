/**
 * How long to wait before retrying a WhatsApp connection that dropped.
 *
 * The attempt count lives here, per user, rather than on the session entry:
 * every retry builds a brand-new entry (startUserSession), so a counter kept
 * on the entry restarted at 0 each time and the delay never left the first
 * step — a long outage was retried every few seconds forever.
 *
 * The count only starts over once a connection has stayed open for
 * STABLE_AFTER_MS. Resetting on every "open" would let a link that opens and
 * dies at once (a conflict with another device, say) retry at the shortest
 * delay indefinitely, which is the very thing backing off is there to stop.
 */

export const BASE_DELAY_MS = 3_000;
export const MAX_DELAY_MS = 60_000;
/** A connection that lasted this long counts as having recovered. */
export const STABLE_AFTER_MS = 30_000;

type State = { attempts: number; openedAt: number | null };

const states = new Map<string, State>();

export type Backoff = { delayMs: number; attempt: number };

/** The connection dropped: how long to wait, and which attempt this is (1-based). */
export function nextBackoff(userId: string, now: number = Date.now()): Backoff {
  const state = states.get(userId) ?? { attempts: 0, openedAt: null };
  if (state.openedAt !== null && now - state.openedAt >= STABLE_AFTER_MS) state.attempts = 0;
  state.openedAt = null;

  const delayMs = Math.min(BASE_DELAY_MS * 2 ** state.attempts, MAX_DELAY_MS);
  state.attempts += 1;
  states.set(userId, state);
  return { delayMs, attempt: state.attempts };
}

/** The socket opened. Does not reset the count — only staying open does (see STABLE_AFTER_MS). */
export function markOpen(userId: string, now: number = Date.now()): void {
  const state = states.get(userId);
  if (state) state.openedAt = now;
}

/** A person asked for this, or the session ended for good: the next drop starts from the short delay. */
export function resetBackoff(userId: string): void {
  states.delete(userId);
}

/** For tests. */
export function _resetBackoffForTesting(): void {
  states.clear();
}
