// Pure validation shared by the forms (inline errors) and the mock server (so both agree).
import {
  BIOGRAPHY_MAX_LENGTH,
  MAX_TIMELINE_ENTRIES,
  NAME_MAX_LENGTH,
  TAGLINE_MAX_LENGTH,
  TRIBUTE_AUTHOR_MAX_LENGTH,
  TRIBUTE_MAX_LENGTH,
  type NewMemorial,
  type NewTribute,
  type TimelineEntry,
} from './data'

export type FieldErrors<Key extends string> = Partial<Record<Key, string>>

export const hasErrors = (errors: object): boolean => Object.keys(errors).length > 0

/** True for a real calendar day written `YYYY-MM-DD`. */
export function isIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const todayIso = (now: Date) => now.toISOString().slice(0, 10)

export function validateDates(born: string, died: string, now: Date = new Date()): FieldErrors<'born' | 'died'> {
  const errors: FieldErrors<'born' | 'died'> = {}
  if (!isIsoDay(born)) errors.born = 'Enter the date of birth.'
  if (!isIsoDay(died)) errors.died = 'Enter the date of passing.'
  if (!errors.born && !errors.died) {
    if (died < born) errors.died = 'The date of passing can’t be before the date of birth.'
    else if (died > todayIso(now)) errors.died = 'The date of passing can’t be in the future.'
  }
  return errors
}

export function validateNewMemorial(
  input: NewMemorial,
  now: Date = new Date(),
): FieldErrors<'name' | 'born' | 'died' | 'tagline'> {
  const errors: FieldErrors<'name' | 'born' | 'died' | 'tagline'> = { ...validateDates(input.born, input.died, now) }
  const name = input.name.trim()
  if (name.length < 2) errors.name = 'Enter their full name.'
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Keep the name under ${NAME_MAX_LENGTH} characters.`
  if ((input.tagline?.trim().length ?? 0) > TAGLINE_MAX_LENGTH) {
    errors.tagline = `Keep this under ${TAGLINE_MAX_LENGTH} characters.`
  }
  return errors
}

export function validateBiography(biography: string): string | undefined {
  return biography.length > BIOGRAPHY_MAX_LENGTH ? `Keep the story under ${BIOGRAPHY_MAX_LENGTH} characters.` : undefined
}

export function validateTimeline(entries: TimelineEntry[], now: Date = new Date()): string | undefined {
  if (entries.length > MAX_TIMELINE_ENTRIES) return `A timeline can have up to ${MAX_TIMELINE_ENTRIES} moments.`
  const year = now.getUTCFullYear()
  const bad = entries.find(
    (entry) => !Number.isInteger(entry.year) || entry.year < 1800 || entry.year > year || !entry.title.trim(),
  )
  return bad ? 'Each moment needs a year and a title.' : undefined
}

export function validateTribute(input: NewTribute): FieldErrors<'authorName' | 'relationship' | 'message'> {
  const errors: FieldErrors<'authorName' | 'relationship' | 'message'> = {}
  const author = input.authorName.trim()
  if (!author) errors.authorName = 'Please tell the family who you are.'
  else if (author.length > TRIBUTE_AUTHOR_MAX_LENGTH) {
    errors.authorName = `Keep your name under ${TRIBUTE_AUTHOR_MAX_LENGTH} characters.`
  }
  if ((input.relationship?.trim().length ?? 0) > 60) errors.relationship = 'Keep this under 60 characters.'
  const message = input.message.trim()
  if (!message) errors.message = 'Write a few words for the family.'
  else if (message.length > TRIBUTE_MAX_LENGTH) errors.message = `Keep your message under ${TRIBUTE_MAX_LENGTH} characters.`
  return errors
}
