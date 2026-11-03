import { describe, expect, it } from 'vitest'
import { formatRelativeDays, initials, nextDueDate, ordinal } from './format'

describe('nextDueDate', () => {
  it('is this month while the day is still ahead or today', () => {
    expect(nextDueDate(28, new Date(2026, 10, 3))).toEqual(new Date(2026, 10, 28))
    expect(nextDueDate(3, new Date(2026, 10, 3, 15))).toEqual(new Date(2026, 10, 3))
  })

  it('rolls to next month once the day has passed, including across the year end', () => {
    expect(nextDueDate(2, new Date(2026, 10, 3))).toEqual(new Date(2026, 11, 2))
    expect(nextDueDate(15, new Date(2026, 11, 20))).toEqual(new Date(2027, 0, 15))
  })
})

describe('formatRelativeDays', () => {
  const now = new Date('2026-11-03T12:00:00Z')
  it('speaks in days', () => {
    expect(formatRelativeDays('2026-11-03T08:00:00Z', now)).toBe('today')
    expect(formatRelativeDays('2026-11-02T08:00:00Z', now)).toBe('yesterday')
    expect(formatRelativeDays('2026-10-31T08:00:00Z', now)).toBe('3 days ago')
  })
})

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Rutendo Moyo')).toBe('RM')
    expect(initials('Chipo')).toBe('C')
    expect(initials('  ')).toBe('?')
  })
})

describe('ordinal', () => {
  it.each([[1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [22, '22nd'], [28, '28th']])('%i -> %s', (n, text) =>
    expect(ordinal(n)).toBe(text),
  )
})
