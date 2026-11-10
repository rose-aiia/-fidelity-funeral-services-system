import { describe, expect, it } from 'vitest'
import { cemeteries, searchCemeteries, searchGraves } from './data'

describe('cemetery search', () => {
  it('returns everything for an empty query', () => {
    expect(searchCemeteries('', false)).toHaveLength(cemeteries.length)
  })
  it('matches by town, ignoring case and spacing', () => {
    expect(searchCemeteries('  BULAWAYO ', false).map((c) => c.town)).toEqual(['Bulawayo'])
  })
  it('can hide cemeteries with no published plots', () => {
    expect(searchCemeteries('mutare', true)).toHaveLength(0)
  })
})

describe('grave search', () => {
  it('needs a name', () => {
    expect(searchGraves('  ')).toEqual([])
  })
  it('narrows by year of death', () => {
    expect(searchGraves('tendai moyo')).toHaveLength(2)
    expect(searchGraves('tendai moyo', 2021).map((g) => g.plot)).toEqual(['B-114'])
  })
  it('flags unverified records', () => {
    expect(searchGraves('tendai moyo', 2020)[0].verified).toBe(false)
  })
})
