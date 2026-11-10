import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'

export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Interim guard until user authentication exists: a shared bearer token (ALERTS_API_TOKEN).
 * Refuses everything when the token is unset. Replace with real staff authentication before exposing
 * these endpoints beyond a trusted network.
 */
export function requireToken(req: Request, res: Response, next: NextFunction) {
  const token = env.alerts.apiToken
  const header = req.header('authorization') ?? ''
  if (!token || !header.startsWith('Bearer ') || !safeEqual(header.slice(7), token)) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }
  next()
}
