import { describe, expect, it } from 'vitest'
import { coverProgress, greeting } from './cover'
import { findPolicyRecord, normaliseKey } from './policy-records'

describe('coverProgress', () => {
  it('reports progress through the waiting period', () => {
    expect(coverProgress({ monthsPaid: 3, waitingPeriodMonths: 6 })).toEqual({
      fraction: 0.5,
      isComplete: false,
      monthsRemaining: 3,
    })
  })

  it('caps at complete', () => {
    expect(coverProgress({ monthsPaid: 18, waitingPeriodMonths: 6 })).toEqual({
      fraction: 1,
      isComplete: true,
      monthsRemaining: 0,
    })
  })

  it('treats no waiting period as complete', () => {
    expect(coverProgress({ monthsPaid: 0, waitingPeriodMonths: 0 }).isComplete).toBe(true)
  })
})

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good morning')
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon')
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening')
  })
})

describe('policy matching', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(normaliseKey('fla 204815')).toBe('FLA204815')
    expect(findPolicyRecord('fla-204815', '63 123456 k 42')?.policy.holderName).toBe('Rutendo Moyo')
  })

  it('needs both the policy number and the matching ID', () => {
    expect(findPolicyRecord('FLA-204815', '08-765432-B-15')).toBeUndefined()
    expect(findPolicyRecord('FLA-000000', '63-123456-K-42')).toBeUndefined()
  })
})
