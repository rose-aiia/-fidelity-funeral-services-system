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
}
