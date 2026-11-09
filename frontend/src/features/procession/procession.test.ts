import { describe, expect, it } from 'vitest'
import { emptyShare, isSharing, LEG_SECONDS, minutesLeft, simulatedPosition } from './data'

const leg = LEG_SECONDS * 1000

describe('simulatedPosition', () => {
  it('starts at the first stop', () => {
    expect(simulatedPosition(0, 3)).toEqual({ legIndex: 0, fraction: 0, arrived: false })
  })
  it('moves to the second leg after one leg of time', () => {
    const p = simulatedPosition(leg * 1.5, 3)
    expect(p.legIndex).toBe(1)
    expect(p.fraction).toBeCloseTo(0.5)
  })
  it('arrives at the end and stays there', () => {
    expect(simulatedPosition(leg * 2, 3)).toEqual({ legIndex: 1, fraction: 1, arrived: true })
    expect(simulatedPosition(leg * 50, 3).arrived).toBe(true)
  })
  it('never goes backwards for negative time', () => {
    expect(simulatedPosition(-500, 3).legIndex).toBe(0)
  })
})

describe('sharing window', () => {
  const start = new Date('2026-06-20T10:00:00Z')
  const share = { ...emptyShare(), startedAt: start.toISOString(), durationMin: 30 }
  it('is off until started', () => {
    expect(isSharing(emptyShare(), Date.now())).toBe(false)
  })
  it('is on inside the window and off once it expires', () => {
    expect(isSharing(share, start.getTime() + 29 * 60_000)).toBe(true)
    expect(isSharing(share, start.getTime() + 30 * 60_000)).toBe(false)
  })
  it('stops when the family ends it early', () => {
    expect(isSharing({ ...share, endedAt: start.toISOString() }, start.getTime() + 60_000)).toBe(false)
  })
  it('reports the minutes left', () => {
    expect(minutesLeft(share, start.getTime() + 10 * 60_000)).toBe(20)
    expect(minutesLeft(share, start.getTime() + 99 * 60_000)).toBe(0)
  })
})
