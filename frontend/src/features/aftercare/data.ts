/** BRD 6.9: post-funeral communication and aftercare. Messages are simulated: nothing is sent to anyone. */

export type ThankYou = {
  id: string
  recipients: string[]
  message: string
  /** When the user "sent" it. In this prototype that only saves it in the browser. */
  sentAt: string
}

export type ReminderKind = 'anniversary' | 'birthday' | 'unveiling' | 'other'

export type Reminder = {
  id: string
  person: string
  kind: ReminderKind
  /** The original date, YYYY-MM-DD. The reminder repeats every year on the same month and day. */
  date: string
  note: string
}

export type AftercareState = { thankYous: ThankYou[]; reminders: Reminder[] }

export const kindLabels: Record<ReminderKind, string> = {
  anniversary: 'Anniversary of passing',
  birthday: 'Birthday remembered',
  unveiling: 'Unveiling or memorial service',
  other: 'Other',
}

export const defaultThankYou = (person: string) =>
  `Dear friends and family,\n\nThank you for standing with us at the funeral of ${person || 'our loved one'}. Your presence, messages and kindness meant a great deal to us in a very difficult time.\n\nWith gratitude,\nThe family`

export const supportResources = [
  { title: 'Grief and counselling', detail: 'Speak to a qualified counsellor, your doctor, a faith leader or a local support group. If you feel unable to cope or at risk of harming yourself, contact emergency services or a crisis line straight away.' },
  { title: 'Check in on each other', detail: 'Grief often feels heaviest weeks after the funeral, when the visitors have gone. Agree on a regular time for the family to call each other.' },
  { title: 'Memorials and tributes', detail: 'Keep the memorial page up to date, and invite relatives to add memories and photographs.' },
  { title: 'Estate and paperwork', detail: 'Use the estate checklist to keep track of documents, appointments and contacts.' },
]

/** Splits a list typed as names separated by commas or new lines. */
export function parseRecipients(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(/[,\n;]/)) {
    const name = raw.trim()
    const key = name.toLowerCase()
    if (name && !seen.has(key)) { seen.add(key); out.push(name) }
  }
  return out
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** The next time a yearly reminder falls, on or after `today`. A 29 February reminder falls on 28 February in non-leap years. */
export function nextOccurrence(date: string, today: Date = new Date()): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  if (month < 0 || month > 11 || day < 1 || day > 31) return null
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let year = start.getFullYear(); year <= start.getFullYear() + 1; year++) {
    const d = month === 1 && day === 29 && !isLeap(year) ? 28 : day
    const candidate = new Date(year, month, d)
    if (candidate.getMonth() !== month) return null
    if (candidate >= start) return candidate
  }
  return null
}

export function daysUntil(date: Date, today: Date = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((date.getTime() - start.getTime()) / 86_400_000)
}

export const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
