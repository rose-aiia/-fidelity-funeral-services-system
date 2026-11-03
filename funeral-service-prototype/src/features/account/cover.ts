import type { Policy, PolicyStatus } from './data'

export type CoverProgress = {
  /** 0 to 1: how far through the waiting period the policy is. */
  fraction: number
  isComplete: boolean
  monthsRemaining: number
}

/** How far a policy is through its waiting period, the point at which the full benefit becomes payable. */
export function coverProgress(policy: Pick<Policy, 'monthsPaid' | 'waitingPeriodMonths'>): CoverProgress {
  const { monthsPaid, waitingPeriodMonths } = policy
  if (waitingPeriodMonths <= 0) return { fraction: 1, isComplete: true, monthsRemaining: 0 }
  const fraction = Math.min(1, Math.max(0, monthsPaid / waitingPeriodMonths))
  return {
    fraction,
    isComplete: monthsPaid >= waitingPeriodMonths,
    monthsRemaining: Math.max(0, waitingPeriodMonths - monthsPaid),
  }
}

export const statusDisplay: Record<PolicyStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Active', tone: 'success' },
  grace: { label: 'Grace period', tone: 'warning' },
  lapsed: { label: 'Lapsed', tone: 'danger' },
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
