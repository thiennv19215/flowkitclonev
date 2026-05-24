import { useSettings } from '@/store/settings'

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Optional JSON body — will be stringified and sent with `Content-Type: application/json`. */
  json?: unknown
  /** Raw body, takes precedence over `json` if provided. */
  body?: BodyInit | null
  /** Override the base URL for a single call. Defaults to the value in the settings store. */
  baseUrl?: string
  /** Optional AbortSignal. */
  signal?: AbortSignal
}

/**
 * Error thrown by `apiFetch` for non-2xx responses or network failures.
 *
 * For non-2xx, `status` is the HTTP status code and `data` holds any parsed
 * JSON body (or the raw text). For network/abort failures, `status` is 0.
 */
export class ApiError extends Error {
  public readonly status: number
  public readonly data: unknown
  public readonly url: string

  constructor(message: string, status: number, url: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    this.data = data
  }
}

/** Resolve the base URL — caller override > settings store > default. */
function resolveBaseUrl(override?: string): string {
  if (override && override.trim()) return override.replace(/\/+$/, '')
  return useSettings.getState().apiBaseUrl
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const left = base.replace(/\/+$/, '')
  const right = path.startsWith('/') ? path : `/${path}`
  return `${left}${right}`
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return null
    }
  }
  try {
    const text = await res.text()
    return text.length > 0 ? text : null
  } catch {
    return null
  }
}

/**
 * Thin fetch wrapper for the FlowKit backend.
 *
 * - Resolves the base URL from the Zustand settings store on every call so
 *   changes in Settings take effect immediately without reloading.
 * - Auto-serializes `json` and sets `Content-Type: application/json`.
 * - Throws `ApiError` on non-2xx responses with the parsed body on `.data`.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, body, baseUrl, headers, ...rest } = options
  const url = joinUrl(resolveBaseUrl(baseUrl), path)

  const finalHeaders = new Headers(headers)
  let finalBody: BodyInit | null | undefined = body ?? undefined

  if (finalBody === undefined && json !== undefined) {
    finalBody = JSON.stringify(json)
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json')
    }
  }

  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json')
  }

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    throw new ApiError(message, 0, url)
  }

  if (!res.ok) {
    const data = await parseBody(res)
    const message =
      (typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : null) ??
      `HTTP ${res.status} ${res.statusText}`
    throw new ApiError(message, res.status, url, data)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await parseBody(res)
  return data as T
}

/** Convenience helpers. */
export const api = {
  get: <T = unknown>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, json?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', json }),
  put: <T = unknown>(path: string, json?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', json }),
  patch: <T = unknown>(path: string, json?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', json }),
  delete: <T = unknown>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}
