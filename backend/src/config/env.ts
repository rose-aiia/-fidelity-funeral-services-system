import dotenv from 'dotenv'

dotenv.config()

const nodeEnv = process.env.NODE_ENV || 'development'
const DEVELOPMENT_JWT_SECRET = 'development-secret-change-me'
const jwtSecret = process.env.JWT_SECRET || DEVELOPMENT_JWT_SECRET

// Never boot production with a fallback/sample secret. Fail fast instead.
if (nodeEnv === 'production' && (jwtSecret === DEVELOPMENT_JWT_SECRET || jwtSecret.length < 32)) {
  throw new Error(
    'JWT_SECRET must be set to a strong value (32+ characters) when NODE_ENV=production.',
  )
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/funeral_service_dev?schema=public',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX || 5),
  queueSchema: process.env.PGBOSS_SCHEMA || 'pgboss',
  alerts: {
    /** Master kill switch. Nothing is sent, and no worker runs, unless this is true. */
    enabled: process.env.ALERTS_ENABLED === 'true',
    /** `log` writes messages to the console instead of calling a provider. */
    mode: (process.env.ALERTS_MODE === 'live' ? 'live' : 'log') as 'live' | 'log',
    /** Interim shared secret for the dispatch/outbox endpoints until user authentication exists. */
    apiToken: process.env.ALERTS_API_TOKEN || '',
    africasTalking: {
      apiKey: process.env.AFRICASTALKING_API_KEY || '',
      username: process.env.AFRICASTALKING_USERNAME || '',
      from: process.env.AFRICASTALKING_FROM || '',
      callbackSecret: process.env.AFRICASTALKING_CALLBACK_SECRET || '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_PHONE_NUMBER || '',
    },
    whatsapp: {
      /** Shared secret between the API and the bridge's localhost control server. The bridge refuses to start without it. */
      bridgeSecret: process.env.WHATSAPP_BRIDGE_SECRET || '',
      bridgePort: Number(process.env.WHATSAPP_INTERNAL_PORT || 3003),
      /** Where Baileys keeps the paired session's credentials. Must be a persistent, private directory. */
      sessionDir: process.env.WHATSAPP_SESSION_DIR || '.whatsapp-session',
      /** Pacing for an unofficial client on a business number: minimum gap between sends, plus random jitter. */
      minIntervalMs: Number(process.env.WHATSAPP_MIN_INTERVAL_MS || 1500),
      jitterMs: Number(process.env.WHATSAPP_JITTER_MS || 1000),
    },
    /** Public base URL providers call back to, for status webhooks. */
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  },
}
