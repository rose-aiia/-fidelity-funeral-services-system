// Pure planner for date-driven alerts (aftercare reminders, premium due). Time is passed in.
import { daysUntil, kindLabels, nextOccurrence, type Reminder } from '../aftercare/data'
import { formatUsd, nextDueDate } from '../../lib/format'
import type { PlanInput } from './rules'
import type { AlertLanguage } from './types'

export const REMINDER_LEAD_DAYS = [7, 1] as const
export const PREMIUM_LEAD_DAYS = [3] as const

const dayLabel = (days: number, date: Date) =>
  days === 1 ? 'tomorrow' : `on ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`

export interface Account { name: string; phone: string; language?: AlertLanguage }

export function scheduledAlerts(
  account: Account,
  reminders: Reminder[],
  policy: { monthlyPremium: number; paymentDay: number } | undefined,
  today: Date,
): PlanInput[] {
  const first = account.name.split(' ')[0]
  const recipient = { phone: account.phone, language: account.language }
  const inputs: PlanInput[] = []

  for (const r of reminders) {
    const next = nextOccurrence(r.date, today)
    if (!next) continue
    const days = daysUntil(next, today)
    if (!(REMINDER_LEAD_DAYS as readonly number[]).includes(days)) continue
    inputs.push({
      event: 'aftercare.reminder', recipient,
      payload: { name: first, person: r.person, kind: kindLabels[r.kind].toLowerCase(), when: dayLabel(days, next) },
      ref: `${r.id}:${next.toISOString().slice(0, 10)}:${days}`,
    })
  }

  if (policy) {
    const due = nextDueDate(policy.paymentDay, today)
    const days = daysUntil(due, today)
    if ((PREMIUM_LEAD_DAYS as readonly number[]).includes(days)) {
      inputs.push({
        event: 'premium.due', recipient,
        payload: { name: first, amount: formatUsd(policy.monthlyPremium), date: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) },
        ref: `premium:${due.toISOString().slice(0, 10)}`,
      })
    }
  }
  return inputs
}
