import { describe, expect, it } from 'vitest'
import {
  ageAtDeath,
  approvedTributes,
  biographyParagraphs,
  completeness,
  lifespan,
  slugify,
  uniqueSlug,
  type Memorial,
  type Tribute,
} from './data'
import { seedMemorials, seedTributes } from './seed'
import { fromHarareInput, toHarareInput } from './service-time'
import { hasErrors, isIsoDay, validateDates, validateNewMemorial, validateTimeline, validateTribute } from './validation'

describe('slugify', () => {
  it('makes a readable path segment', () => {
    expect(slugify('Grace Nyathi')).toBe('grace-nyathi')
    expect(slugify('  Tendai   O’Brien-Moyo! ')).toBe('tendai-o-brien-moyo')
    expect(slugify('José Ñandú')).toBe('jose-nandu')
  })

  it('never returns an empty slug', () => {
    expect(slugify('***')).toBe('memorial')
  })

  it('caps the length without leaving a trailing dash', () => {
    const slug = slugify(`${'a'.repeat(59)} b`)
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug.endsWith('-')).toBe(false)
  })
})

describe('uniqueSlug', () => {
  it('adds a counter only when needed', () => {
    expect(uniqueSlug('Grace Nyathi', [])).toBe('grace-nyathi')
    expect(uniqueSlug('Grace Nyathi', ['grace-nyathi'])).toBe('grace-nyathi-2')
    expect(uniqueSlug('Grace Nyathi', ['grace-nyathi', 'grace-nyathi-2'])).toBe('grace-nyathi-3')
  })
})

describe('dates', () => {
  it('computes age, including the birthday not having happened yet', () => {
    expect(ageAtDeath('1949-06-12', '2025-09-03')).toBe(76)
    expect(ageAtDeath('1949-09-04', '2025-09-03')).toBe(75)
    expect(ageAtDeath('2000-01-01', '1999-01-01')).toBeNull()
    expect(lifespan('1949-06-12', '2025-09-03')).toBe('1949 – 2025')
  })

  it('validates calendar days', () => {
    expect(isIsoDay('2025-02-29')).toBe(false)
    expect(isIsoDay('2024-02-29')).toBe(true)
    expect(isIsoDay('25-1-1')).toBe(false)
  })

  it('rejects a passing before the birth or in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(validateDates('1950-01-01', '2020-01-01', now)).toEqual({})
    expect(validateDates('1950-01-01', '1940-01-01', now).died).toMatch(/before/)
    expect(validateDates('1950-01-01', '2027-01-01', now).died).toMatch(/future/)
    expect(validateDates('', '', now)).toHaveProperty('born')
  })
})

describe('validation', () => {
  it('flags a missing name and over-long tagline', () => {
    const errors = validateNewMemorial({ name: ' ', born: '1950-01-01', died: '2020-01-01', tagline: 'x'.repeat(121) })
    expect(errors.name).toBeDefined()
    expect(errors.tagline).toBeDefined()
    expect(hasErrors(validateNewMemorial({ name: 'Grace Nyathi', born: '1950-01-01', died: '2020-01-01' }))).toBe(false)
  })

  it('needs an author and a message for a tribute', () => {
    expect(validateTribute({ authorName: '', message: '' })).toHaveProperty('authorName')
    expect(validateTribute({ authorName: 'Nomsa', message: 'x'.repeat(501) })).toHaveProperty('message')
    expect(hasErrors(validateTribute({ authorName: 'Nomsa', message: 'Rest well.' }))).toBe(false)
  })

  it('needs a year and title on each timeline moment', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(validateTimeline([{ id: 'a', year: 1970, title: 'Qualified' }], now)).toBeUndefined()
    expect(validateTimeline([{ id: 'a', year: 3000, title: 'Soon' }], now)).toBeDefined()
    expect(validateTimeline([{ id: 'a', year: 1970, title: ' ' }], now)).toBeDefined()
  })
})

describe('biography and completeness', () => {
  const sample = seedMemorials()[0]!

  it('splits paragraphs on blank lines', () => {
    expect(biographyParagraphs('One.\n\n\nTwo.\n\n  \nThree.')).toEqual(['One.', 'Two.', 'Three.'])
  })

  it('reports what is left to do', () => {
    const empty: Memorial = { ...sample, biography: '', timeline: [], photos: [], portraitId: undefined, tagline: undefined, service: undefined }
    expect(completeness(empty).percent).toBe(0)
    expect(completeness(empty).steps.every((step) => !step.done)).toBe(true)
  })

  it('counts the finished sample as fully done except the portrait', () => {
    const { percent, steps } = completeness(sample)
    expect(steps.find((step) => step.id === 'portrait')?.done).toBe(false)
    expect(percent).toBe(83)
  })
})

describe('tributes', () => {
  it('shows only approved tributes, newest first', () => {
    const all = Object.values(seedTributes()).flat()
    const shown = approvedTributes(all as Tribute[])
    expect(shown.length).toBe(3)
    expect(shown.every((tribute) => tribute.status === 'approved')).toBe(true)
    expect([...shown].sort((a, b) => b.createdAt.localeCompare(a.createdAt))).toEqual(shown)
  })
})

describe('service time', () => {
  it('round-trips Harare wall time', () => {
    expect(toHarareInput('2025-09-10T10:00:00+02:00')).toBe('2025-09-10T10:00')
    expect(toHarareInput('2025-09-10T08:00:00Z')).toBe('2025-09-10T10:00')
    expect(fromHarareInput('2025-09-10T10:00')).toBe('2025-09-10T10:00:00+02:00')
    expect(fromHarareInput('')).toBe('')
    expect(toHarareInput('nonsense')).toBe('')
  })
})
