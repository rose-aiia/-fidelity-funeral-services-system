import type { Router } from 'express'
import { env } from '../config/env'
import { getBoss } from '../lib/jobs/boss'
import { prisma } from '../lib/prisma'
import { createAdminRouter } from './adminRoutes'
import { PrismaAlertStore } from './prismaStore'
import { ensureQueues, enqueueOutbox } from './queues'
import { createAlertsRouter } from './routes'
import type { AlertStore } from './types'

export interface AlertsRuntime { router: Router; adminRouter: Router; store: AlertStore }

/**
 * Wires the alert pipeline into the API: the Prisma store, the pg-boss queue the API sends jobs to, and the
 * routers. Returns null (and mounts nothing) unless ALERTS_ENABLED=true.
 *
 * The API only enqueues. SMS is sent by the worker (src/worker.ts) and WhatsApp by the bridge
 * (src/whatsapp/bridge.ts); both must be running for messages to leave.
 */
export async function createAlertsRuntime(): Promise<AlertsRuntime | null> {
  if (!env.alerts.enabled) return null
  const store = new PrismaAlertStore(prisma)
  const boss = await getBoss('fidelity-api')
  await ensureQueues(boss)
  console.log(`[alerts] enabled, mode=${env.alerts.mode}`)
  return {
    store,
    router: createAlertsRouter(store, (row) => enqueueOutbox(boss, row)),
    adminRouter: createAdminRouter(),
  }
}
