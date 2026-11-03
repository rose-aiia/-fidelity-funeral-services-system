import { env } from './env'

/** Resolves with a copy of `value` after an optional delay, mimicking a network call. */
export function mockResponse<T>(value: T, delayMs = 0): Promise<T> {
  return new Promise((resolve) => globalThis.setTimeout(() => resolve(structuredClone(value)), delayMs))
}

/**
 * Seeds a query with sample data in mock mode so pages render synchronously, exactly as they did
 * before the API layer existed. In live mode there is no seed and the query shows its loading state.
 */
export const seedInMockMode =
  <T>(fixture: T) =>
  (): T | undefined =>
    env.useMock ? fixture : undefined
