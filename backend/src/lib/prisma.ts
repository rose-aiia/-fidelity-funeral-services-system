import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

// Prisma 7 talks to Postgres through a driver adapter. One client per process.
declare global {
  // eslint-disable-next-line no-var
  var __fidelityPrisma: PrismaClient | undefined
}

function create(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl, max: env.databasePoolMax })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalThis.__fidelityPrisma ?? (globalThis.__fidelityPrisma = create())
