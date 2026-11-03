import { describe, expect, it } from 'vitest'
import { formatUsd } from '@/lib/format'
import { DEFAULT_PLAN_ID, plans } from './data'
import { estimateTotal, SERVICE_TYPES, TOWNS } from './pricing'

const plan = (id: string) => plans.find((p) => p.id === id)!

describe('estimateTotal', () => {
  it('adds the town surcharge to the plan price for a plain burial', () => {
    expect(estimateTotal(plan('essential'), 'Harare', 'Traditional burial')).toBe(4200 + 1200)
  })

  it('adds the service surcharge on top', () => {
    expect(estimateTotal(plan('comfort'), 'Bulawayo', 'Repatriation support')).toBe(7800 + 1500 + 2600)
  })

  it('never returns less than the plan price', () => {
    for (const p of plans) {
      for (const town of TOWNS) {
        for (const type of SERVICE_TYPES) {
          expect(estimateTotal(p, town, type)).toBeGreaterThanOrEqual(p.price)
        }
      }
    }
  })
})

describe('plans data', () => {
  it('has a default plan that exists', () => {
    expect(plans.some((p) => p.id === DEFAULT_PLAN_ID)).toBe(true)
  })

  it('has unique plan ids', () => {
    expect(new Set(plans.map((p) => p.id)).size).toBe(plans.length)
  })
})

describe('formatUsd', () => {
  it('formats with a US$ prefix and thousands separators', () => {
    expect(formatUsd(12600)).toBe('US$12,600')
  })
})
