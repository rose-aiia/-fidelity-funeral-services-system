export const formatUsd = (amount: number) => `US$${amount.toLocaleString('en-US')}`

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDate = (value: string | Date) => dateFormat.format(new Date(value))

/** The next date a premium falls due: this month's payment day, or next month's if it has passed. */
export function nextDueDate(paymentDay: number, from: Date = new Date()): Date {
  const due = new Date(from.getFullYear(), from.getMonth(), paymentDay)
  if (due < new Date(from.getFullYear(), from.getMonth(), from.getDate())) due.setMonth(due.getMonth() + 1)
  return due
}

/** "3 days ago", "yesterday", "today" for a past ISO timestamp. */
export function formatRelativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/** Two-letter initials for an avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0]!
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}

/** 1 -> "1st", 22 -> "22nd", 28 -> "28th". */
export function ordinal(n: number): string {
  const rest = n % 100
  if (rest >= 11 && rest <= 13) return `${n}th`
  const suffix = ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${suffix}`
}
