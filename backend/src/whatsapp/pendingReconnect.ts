/**
 * The one reconnect a user's dropped WhatsApp connection is waiting on.
 *
 * Why this is tracked at all: when a socket closes the session is removed from
 * the live-session map straight away, and the retry is only a `setTimeout`
 * until the backoff delay is over. A stop issued in that window found no
 * session to abort and cancelled nothing, so the timer fired and brought the
 * session back — "stop" could not stop a connection that was between retries,
 * which is exactly when QR codes and reconnects keep coming.
 *
 * At most one per user: scheduling again replaces the previous one, so two
 * overlapping drops can never fan out into two retry chains.
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Run `retry` after `delayMs` unless it is cancelled first. Replaces any retry already waiting for this user. */
export function scheduleReconnect(userId: string, delayMs: number, retry: () => void): void {
  cancelReconnect(userId);
  const timer = setTimeout(() => {
    // Only forget our own entry: a newer schedule may already own the slot.
    if (timers.get(userId) === timer) timers.delete(userId);
    retry();
  }, delayMs);
  timers.set(userId, timer);
}

/** Drop the retry this user is waiting on. True if there was one. */
export function cancelReconnect(userId: string): boolean {
  const timer = timers.get(userId);
  if (timer === undefined) return false;
  clearTimeout(timer);
  timers.delete(userId);
  return true;
}

/** Test seam, and for shutdown: no user keeps a retry pending. */
export function cancelAllReconnects(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}

/** Whether this user has a retry waiting. */
export function hasPendingReconnect(userId: string): boolean {
  return timers.has(userId);
}
