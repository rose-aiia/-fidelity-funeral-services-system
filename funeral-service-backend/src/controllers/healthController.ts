import type { Request, Response } from 'express'
import type { HealthStatus } from '../types/app'

export const getHealth = (_req: Request, res: Response<HealthStatus>) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    database: 'disconnected',
  })
}
