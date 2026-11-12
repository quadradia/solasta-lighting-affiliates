import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './api'

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

afterEach(() => vi.unstubAllGlobals())

describe('apiFetch', () => {
  it('sends the bearer token and query, and unwraps the payload', async () => {
    const fetch = respond(200, { code: 0, message: 'Success', payload: { items: [], totalCount: 0 } })
    vi.stubGlobal('fetch', fetch)

    const result = await apiFetch('api/affiliates', { accessToken: 'abc', query: { page: 2, search: '', status: undefined } })

    expect(result).toEqual({ items: [], totalCount: 0 })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.test/api/affiliates?page=2')
    expect(init.headers.Authorization).toBe('Bearer abc')
  })

  it('posts JSON bodies', async () => {
    const fetch = respond(200, { payload: { ok: true } })
    vi.stubGlobal('fetch', fetch)

    await apiFetch('api/x', { method: 'POST', body: { reason: 'no' }, accessToken: 't' })

    const [, init] = fetch.mock.calls[0]
    expect(init.body).toBe('{"reason":"no"}')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('surfaces validation errors and the trace id', async () => {
    vi.stubGlobal(
      'fetch',
      respond(400, { message: 'Validation failed', apiTraceId: 'trace-1', validationErrors: { reason: ['Too short'] } }),
    )

    const error = await apiFetch('api/x', { accessToken: 't' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).details).toEqual(['Too short'])
    expect((error as ApiError).traceId).toBe('trace-1')
  })

  it('replaces the generic server-fault label with a plain message', async () => {
    vi.stubGlobal('fetch', respond(500, { message: 'API-APPVLD-02000 General application validation error' }))

    const error = (await apiFetch('api/x', { accessToken: 't' }).catch((e: unknown) => e)) as ApiError

    expect(error.message).toBe('Something went wrong on our side (500). Try again in a moment.')
  })

  it('explains a 403 as a login without an affiliate account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))

    const error = (await apiFetch('api/x', { accessToken: 't' }).catch((e: unknown) => e)) as ApiError

    expect(error.message).toMatch(/affiliate account/)
  })

  it('reports an unreachable API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = (await apiFetch('api/x', { accessToken: 't' }).catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(0)
  })
})
