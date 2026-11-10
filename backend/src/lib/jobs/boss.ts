import { PgBoss } from 'pg-boss'
import { env } from '../../config/env'

/**
 * Shared pg-boss instance (Postgres-backed job queue, in its own `pgboss` schema of the app database).
 *
 * Process roles: the API, the worker and the WhatsApp bridge each call getBoss() to send or consume jobs.
 * Each passes its own `applicationName` the first time so the connections are identifiable in pg_stat_activity.
 * Only start it in a process that actually needs the queue; it runs migrations on first start.
 */
declare global {
  // eslint-disable-next-line no-var
  var __fidelityBoss: Promise<PgBoss> | undefined
}

export const QUEUE_SCHEMA = env.queueSchema

export function getBoss(applicationName = 'fidelity-jobs'): Promise<PgBoss> {
  if (!globalThis.__fidelityBoss) {
    // Cache the promise, not the instance, so concurrent first callers share one start().
    const starting = (async () => {
      const boss = new PgBoss({
        connectionString: env.databaseUrl,
        schema: QUEUE_SCHEMA,
        max: 5,
        application_name: applicationName,
      })
      boss.on('error', (err: Error) => console.error('[jobs] pg-boss error:', err.message))
      await boss.start()
      return boss
    })()
    globalThis.__fidelityBoss = starting
    // A failed start must not poison later attempts.
    starting.catch(() => { if (globalThis.__fidelityBoss === starting) globalThis.__fidelityBoss = undefined })
  }
  return globalThis.__fidelityBoss
}

/** Graceful shutdown: lets in-flight jobs finish before closing pools. */
export async function stopBoss(timeoutSeconds = 30): Promise<void> {
  const pending = globalThis.__fidelityBoss
  if (!pending) return
  globalThis.__fidelityBoss = undefined
  const boss = await pending.catch(() => undefined)
  await boss?.stop({ graceful: true, timeout: timeoutSeconds, close: true })
}
