import { describe, expect, it } from 'vitest'
import { daysUntil, defaultThankYou, nextOccurrence, parseRecipients } from './data'

const day = (y: number, m: number, d: number) => new Date(y, m - 1, d)

describe('nextOccurrence', () => {
  it('uses this year when the date has not passed', () => {
    expect(nextOccurrence('2019-09-12', day(2026, 3, 1))).toEqual(day(2026, 9, 12))
  })
  it('rolls to next year once it has passed', () => {
    expect(nextOccurrence('2019-02-01', day(2026, 3, 1))).toEqual(day(2027, 2, 1))
  })
  it('counts today as the occurrence', () => {
    expect(nextOccurrence('2020-03-01', day(2026, 3, 1))).toEqual(day(2026, 3, 1))
  })
  it('moves 29 February to 28 February in non-leap years', () => {
    expect(nextOccurrence('2020-02-29', day(2026, 1, 1))).toEqual(day(2026, 2, 28))
    expect(nextOccurrence('2020-02-29', day(2027, 3, 1))).toEqual(day(2028, 2, 29))
  })
  it('rejects bad dates', () => {
    expect(nextOccurrence('', day(2026, 1, 1))).toBeNull()
    expect(nextOccurrence('2020-02-31', day(2026, 1, 1))).toBeNull()
  })
})

describe('daysUntil', () => {
  it('counts whole days', () => {
    expect(daysUntil(day(2026, 3, 4), day(2026, 3, 1))).toBe(3)
    expect(daysUntil(day(2026, 3, 1), day(2026, 3, 1))).toBe(0)
  })
})

describe('thank-you helpers', () => {
  it('splits and de-duplicates recipients', () => {
    expect(parseRecipients('Anna, ben\n anna ;  ')).toEqual(['Anna', 'ben'])
  })
  it('names the person in the template', () => {
    expect(defaultThankYou('Tendai Moyo')).toContain('Tendai Moyo')
    expect(defaultThankYou('')).toContain('our loved one')
  })
})
