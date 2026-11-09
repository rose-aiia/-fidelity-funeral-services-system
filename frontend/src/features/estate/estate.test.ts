import { describe, expect, it } from 'vitest'
import { defaultState, groupOrder, progress } from './data'

describe('estate checklist', () => {
  it('starts with every task open and every group represented', () => {
    const s = defaultState()
    expect(progress(s.tasks)).toMatchObject({ done: 0, percent: 0 })
    for (const g of groupOrder) expect(s.tasks.some((t) => t.group === g)).toBe(true)
  })
  it('computes progress', () => {
    const s = defaultState()
    s.tasks[0].done = true
    s.tasks[1].done = true
    const p = progress(s.tasks)
    expect(p.done).toBe(2)
    expect(p.percent).toBe(Math.round((2 / s.tasks.length) * 100))
  })
  it('handles an empty list', () => {
    expect(progress([]).percent).toBe(0)
  })
})
