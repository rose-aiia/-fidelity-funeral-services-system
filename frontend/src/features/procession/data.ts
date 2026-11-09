/** BRD 6.11: funeral schedule, directions and simulated procession tracking. No real location data is used or collected. */

export type StopKind = 'departure' | 'venue' | 'cemetery'

export type Stop = {
  id: string
  kind: StopKind
  label: string
  time: string
  address: string
  directions: string
}

export type FuneralDay = {
  id: string
  person: string
  date: string
  stops: Stop[]
}

export type ShareState = {
  /** ISO time sharing started, or null when it is off. */
  startedAt: string | null
  durationMin: number
  viewers: string[]
  /** Set when the family stopped sharing early or it ran out. */
  endedAt: string | null
}

export const durationOptions = [30, 60, 120] as const

/** Simulated seconds for the vehicle to travel each leg, so the demonstration can be watched in a minute or so. */
export const LEG_SECONDS = 12

export const funeralDays: FuneralDay[] = [
  {
    id: 'fd-sample',
    person: 'Sample Family Service',
    date: '2026-06-20',
    stops: [
      { id: 's1', kind: 'departure', label: 'Family home (sample)', time: '08:30', address: '12 Sample Road, Harare (fictional)', directions: 'The cortege leaves from the family home. Please arrive by 08:15.' },
      { id: 's2', kind: 'venue', label: 'Harare Chapel (sample venue)', time: '10:00', address: 'Sample Chapel, Sample Avenue (fictional)', directions: 'Sample directions: from the city centre take the sample ring road east, turn left at the sample roundabout. Parking is behind the chapel.' },
      { id: 's3', kind: 'cemetery', label: 'Sample Eastlea Memorial Park', time: '12:30', address: 'Sample Cemetery Road (fictional)', directions: 'Sample directions: follow the cortege from the chapel, about 20 minutes. The burial is in Section B.' },
    ],
  },
]

export type Position = { legIndex: number; fraction: number; arrived: boolean }

/** Where the simulated vehicle is after `elapsedMs`: on leg `legIndex` (between stop legIndex and legIndex + 1). */
export function simulatedPosition(elapsedMs: number, stopCount: number): Position {
  const legs = Math.max(stopCount - 1, 1)
  const total = legs * LEG_SECONDS * 1000
  if (elapsedMs >= total) return { legIndex: legs - 1, fraction: 1, arrived: true }
  const t = Math.max(elapsedMs, 0) / (LEG_SECONDS * 1000)
  const legIndex = Math.floor(t)
  return { legIndex, fraction: t - legIndex, arrived: false }
}

/** Whether sharing is switched on and has not run out at `now`. */
export function isSharing(share: ShareState, now: number): boolean {
  if (!share.startedAt || share.endedAt) return false
  return now < new Date(share.startedAt).getTime() + share.durationMin * 60_000
}

export function minutesLeft(share: ShareState, now: number): number {
  if (!share.startedAt) return 0
  return Math.max(0, Math.ceil((new Date(share.startedAt).getTime() + share.durationMin * 60_000 - now) / 60_000))
}

export const emptyShare = (): ShareState => ({ startedAt: null, durationMin: 60, viewers: [], endedAt: null })
