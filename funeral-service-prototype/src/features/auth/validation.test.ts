import { describe, expect, it } from 'vitest'
import { formatPhone, isEmail, isOtpCode, normalisePhone, safeNextPath } from './validation'

describe('normalisePhone', () => {
  it.each(['0771234567', '771234567', '+263771234567', '263771234567', '077 123 4567', '+263 (77) 123-4567'])(
    'accepts %s',
    (raw) => expect(normalisePhone(raw)).toBe('+263771234567'),
  )

  it.each(['', '12345', '0242123456', '+27821234567', '07712345678', 'abc'])('rejects %s', (raw) =>
    expect(normalisePhone(raw)).toBeNull(),
  )
})

describe('formatPhone', () => {
  it('groups a Zimbabwean number', () => expect(formatPhone('+263771234567')).toBe('+263 77 123 4567'))
  it('leaves anything else alone', () => expect(formatPhone('12345')).toBe('12345'))
})

describe('isOtpCode', () => {
  it('needs exactly six digits', () => {
    expect(isOtpCode('123456')).toBe(true)
    expect(isOtpCode('12345')).toBe(false)
    expect(isOtpCode('12345a')).toBe(false)
  })
})

describe('isEmail', () => {
  it('accepts ordinary addresses and rejects obvious typos', () => {
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('a@b')).toBe(false)
    expect(isEmail('a b@c.d')).toBe(false)
  })
})

describe('safeNextPath', () => {
  it('keeps same-site paths', () => expect(safeNextPath('/account/policy?x=1', '/')).toBe('/account/policy?x=1'))

  it.each([null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'account'])(
    'falls back for %s',
    (raw) => expect(safeNextPath(raw, '/account')).toBe('/account'),
  )
})
