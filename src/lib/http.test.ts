import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getErrorMessage, isRetryable } from './api-error'
import { get, post } from './http'

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, ...init })

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('http', () => {
  it('GETs JSON from the base URL and serialises the query, skipping undefined values', async () => {
    fetchMock.mockResolvedValue(json([{ id: 'a' }]))

    const result = await get<{ id: string }[]>('/items', { query: { category: 'Flowers', page: 2, skip: undefined } })

    expect(result).toEqual([{ id: 'a' }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/items?category=Flowers&page=2')
    expect(init?.method).toBe('GET')
    expect(init?.body).toBeUndefined()
  })

  it('POSTs a JSON body with a content type', async () => {
    fetchMock.mockResolvedValue(json({ id: '1' }, { status: 201 }))

    await post('/quote-requests', { planId: 'comfort' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"planId":"comfort"}')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(post('/x', {})).resolves.toBeUndefined()
  })

  it('turns an error body into an ApiError', async () => {
    fetchMock.mockResolvedValue(
      json({ code: 'validation_failed', message: 'Bad town', details: { field: 'town' } }, { status: 422 }),
    )

    const error = await get('/x').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, code: 'validation_failed', message: 'Bad town', details: { field: 'town' } })
  })

  it('falls back to a status-based code when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(get('/x')).rejects.toMatchObject({ status: 502, code: 'http_502' })
  })

  it('reports an unreadable success body', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 200 }))
    await expect(get('/x')).rejects.toMatchObject({ status: 200, code: 'invalid_response' })
  })

  it('wraps network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(get('/x')).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })

  it('times out slow requests', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )

    const pending = get('/x', { timeoutMs: 500 }).catch((e) => e)
    await vi.advanceTimersByTimeAsync(500)

    expect(await pending).toMatchObject({ status: 0, code: 'timeout' })
  })

  it('lets caller cancellation propagate instead of reporting a network error', async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const controller = new AbortController()

    const pending = get('/x', { signal: controller.signal }).catch((e) => e)
    controller.abort()

    const error = await pending
    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })
})

describe('error helpers', () => {
  it('does not retry client errors, but retries network, server and rate-limit errors', () => {
    expect(isRetryable(new ApiError(404, 'not_found', ''))).toBe(false)
    expect(isRetryable(new ApiError(422, 'validation_failed', ''))).toBe(false)
    expect(isRetryable(new ApiError(429, 'rate_limited', ''))).toBe(true)
    expect(isRetryable(new ApiError(503, 'http_503', ''))).toBe(true)
    expect(isRetryable(new ApiError(0, 'network_error', ''))).toBe(true)
  })

  it('never leaks server messages to users', () => {
    const message = getErrorMessage(new ApiError(500, 'db_error', 'connection to pg-primary refused'))
    expect(message).not.toMatch(/pg-primary/)
    expect(getErrorMessage(new ApiError(0, 'timeout', ''))).toMatch(/connection/)
    expect(getErrorMessage(new ApiError(422, 'validation_failed', ''))).toMatch(/check the details/)
    expect(getErrorMessage('boom')).toMatch(/Something went wrong/)
  })
})
