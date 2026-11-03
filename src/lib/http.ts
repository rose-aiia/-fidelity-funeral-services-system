import { ApiError } from './api-error'
import { env } from './env'

const DEFAULT_TIMEOUT_MS = 10_000

type RequestOptions = {
  query?: Record<string, string | number | undefined>
  /** Lets the caller cancel the request (React Query passes one). Cancellation rethrows the abort error. */
  signal?: AbortSignal
  timeoutMs?: number
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function buildUrl(path: string, query: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return `${env.apiBaseUrl}${path}${search ? `?${search}` : ''}`
}

let unauthorizedHandler: (() => void) | undefined

/**
 * Registers the app's reaction to a 401 (the session expired or was revoked). Returns an unsubscribe.
 * Kept as a callback so the HTTP layer doesn't depend on auth code.
 */
export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: { code?: unknown; message?: unknown; details?: unknown } = {}
  try {
    body = await response.json()
  } catch {
    // Non-JSON error body (e.g. a proxy's HTML 502 page); fall through to defaults.
  }
  const code = typeof body.code === 'string' ? body.code : `http_${response.status}`
  const message = typeof body.message === 'string' ? body.message : response.statusText || 'Request failed'
  return new ApiError(response.status, code, message, body.details)
}

async function request<T>(method: Method, path: string, body: unknown, options: RequestOptions): Promise<T> {
  const { query, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const controller = new AbortController()
  let timedOut = false

  const timer = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const onCallerAbort = () => controller.abort()
  signal?.addEventListener('abort', onCallerAbort)

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 401) unauthorizedHandler?.()
      throw await toApiError(response)
    }
    if (response.status === 204) return undefined as T

    try {
      return (await response.json()) as T
    } catch {
      throw new ApiError(response.status, 'invalid_response', 'The server returned an unreadable response')
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (timedOut) throw new ApiError(0, 'timeout', 'The request timed out')
    if (signal?.aborted) throw error
    throw new ApiError(0, 'network_error', 'The request could not be completed')
  } finally {
    globalThis.clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}

export const get = <T>(path: string, options: RequestOptions = {}) => request<T>('GET', path, undefined, options)

export const post = <T>(path: string, body: unknown, options: RequestOptions = {}) =>
  request<T>('POST', path, body, options)

export const patch = <T>(path: string, body: unknown, options: RequestOptions = {}) =>
  request<T>('PATCH', path, body, options)

export const del = (path: string, options: RequestOptions = {}) => request<void>('DELETE', path, undefined, options)
