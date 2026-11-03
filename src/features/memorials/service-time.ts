// Services are held in Zimbabwe, which has no daylight saving: local time is always UTC+2.
const HARARE_OFFSET_HOURS = 2

/** An ISO date-time -> the `YYYY-MM-DDTHH:mm` a datetime-local input expects, in Harare time. */
export function toHarareInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() + HARARE_OFFSET_HOURS * 3_600_000).toISOString().slice(0, 16)
}

/** The inverse: what a datetime-local input holds (Harare wall time) -> an ISO date-time with its offset. */
export function fromHarareInput(value: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+0${HARARE_OFFSET_HOURS}:00` : ''
}
