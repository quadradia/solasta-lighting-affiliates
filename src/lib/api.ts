import { config } from './config'
import { userManager } from './auth'
import { translate } from '@/i18n'

/** The Solasta API's response wrapper (DSMEnvelopeDto on the server). */
export interface DsmEnvelope<T> {
  uniqueIEID: string
  errorIEID: string
  apiTraceId?: string | null
  message: string
  code: number
  validationErrors?: Record<string, string[]> | null
  payload?: T | null
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

/** A failed API call, with the envelope's message, field errors and trace id when present. */
export class ApiError extends Error {
  readonly status: number
  readonly validationErrors: Record<string, string[]>
  readonly traceId?: string

  constructor(status: number, message: string, validationErrors?: Record<string, string[]> | null, traceId?: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validationErrors = validationErrors ?? {}
    this.traceId = traceId ?? undefined
  }

  /** One readable line per field error, or the message when there are none. */
  get details(): string[] {
    const fields = Object.entries(this.validationErrors).flatMap(([, errors]) => errors)
    return fields.length > 0 ? fields : [this.message]
  }
}

type Query = Record<string, string | number | undefined | null>

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  query?: Query
  body?: unknown
  /** Override for tests; defaults to the signed-in user's access token. */
  accessToken?: string
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${config.apiBaseUrl}/${path.replace(/^\/+/, '')}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

/** Messages for statuses whose envelope text is not meant for affiliates, in the current language. */
function statusMessage(status: number): string | undefined {
  if (status === 401) return translate('api.401')
  if (status === 403) return translate('api.403')
  if (status === 404) return translate('api.404')
  return undefined
}

/**
 * Calls the Solasta API with the bearer token and unwraps the DSM envelope.
 * Resolves with the payload, or throws ApiError for any non-2xx response.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { query, body, accessToken, headers, ...init } = options
  const token = accessToken ?? (await userManager.getUser())?.access_token

  // FormData (file uploads) sets its own multipart Content-Type with the boundary.
  const isForm = body instanceof FormData
  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, translate('api.unreachable'))
  }

  const text = await response.text()
  let envelope: DsmEnvelope<T> | undefined
  try {
    envelope = text ? (JSON.parse(text) as DsmEnvelope<T>) : undefined
  } catch {
    envelope = undefined
  }

  if (!response.ok) {
    const fallback = statusMessage(response.status) ?? translate('api.other', { status: response.status })
    // The API's envelope messages are English and written for developers; affiliates get the translated
    // fallback, except for field errors (400), which ErrorPanel and forms show per field.
    const message = response.status === 400 && envelope?.message ? envelope.message : fallback
    throw new ApiError(response.status, message, envelope?.validationErrors, envelope?.apiTraceId)
  }

  return (envelope?.payload ?? undefined) as T
}

/** Downloads a protected file (for example the tenant logo) with the bearer token. Null on 404. */
export async function apiFetchBlob(path: string, signal?: AbortSignal): Promise<Blob | null> {
  const token = (await userManager.getUser())?.access_token
  const response = await fetch(buildUrl(path), {
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (response.status === 404) return null
  if (!response.ok) throw new ApiError(response.status, statusMessage(response.status) ?? translate('api.file'))
  return response.blob()
}
