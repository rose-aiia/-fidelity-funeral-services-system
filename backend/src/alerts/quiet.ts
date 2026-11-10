// Mirrors frontend/src/features/alerts/rules.ts: Harare is UTC+2 with no DST; quiet hours are 21:00-06:00.
import type { AlertEvent } from './types'

const HARARE_OFFSET_HOURS = 2
const QUIET_START = 21
const QUIET_END = 6

/** Time-critical events ignore quiet hours. */
export const URGENT: ReadonlySet<AlertEvent> = new Set<AlertEvent>([
  'procession.started', 'procession.stopped', 'stream.live', 'funeral.schedule_changed',
])

export function inQuietHours(now: Date): boolean {
  const h = (now.getUTCHours() + HARARE_OFFSET_HOURS) % 24
  return h >= QUIET_START || h < QUIET_END
}

/** Next 06:00 Harare after `now`. */
export function quietHoursEnd(now: Date): Date {
  const end = new Date(now)
  end.setUTCHours(QUIET_END - HARARE_OFFSET_HOURS, 0, 0, 0)
  if (end.getTime() <= now.getTime()) end.setUTCDate(end.getUTCDate() + 1)
  return end
}
