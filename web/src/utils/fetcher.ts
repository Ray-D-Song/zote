export interface FetcherOptions extends
  RequestInit {
  baseURL?: string
  timeout?: number
  params?: Record<string, string | number | boolean>
}

export interface FetcherResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export class FetcherError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
  ) {
    super(message)
    this.name = 'FetcherError'
  }
}

const DEFAULT_TIMEOUT = 30000

export async function fetcher<T = any>(
  url: string,
  options?: FetcherOptions,
): Promise<FetcherResponse<T>> {
  const {
    baseURL = '/api/v1',
    timeout = DEFAULT_TIMEOUT,
    params,
    headers: customHeaders,
    ...restOptions
  } = options || {}

  // Build URL with params
  let fullURL = baseURL + url
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    const paramString
      = searchParams.toString()
    fullURL += (fullURL.includes('?')
      ? '&'
      : '?') + paramString
  }

  // Setup headers
  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type')
    && restOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Setup timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() =>
    controller.abort(), timeout)

  try {
    const response = await fetch(fullURL, {
      ...restOptions,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new FetcherError(
        `HTTP ${response.status}: 
  ${response.statusText}`,
        response.status,
        response,
      )
    }

    // Parse response
    const contentType
      = response.headers.get('content-type')
    let data: T

    if (contentType?.includes('application/json')) {
      data = await response.json()
    }
    else if (contentType?.includes('text/')) {
      data = (await response.text()) as any
    }
    else {
      data = (await response.blob()) as any
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    }
  }
  catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof DOMException
      && error.name === 'AbortError') {
      throw new FetcherError('Request timeout')
    }

    if (error instanceof FetcherError) {
      throw error
    }

    throw new FetcherError(
      error instanceof Error
        ? error.message
        : 'Unknown error',
    )
  }
}

// Convenience methods
export const http = {
  get: <T = any>(url: string, options?: FetcherOptions) =>
    fetcher<T>(url, {
      ...options,
      method:
        'GET',
    }),

  post: <T = any>(url: string, data?: any, options?: FetcherOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'POST',
      body: data
        ? JSON.stringify(data)
        : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: FetcherOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'PUT',
      body: data
        ? JSON.stringify(data)
        : undefined,
    }),

  delete: <T = any>(url: string, options?: FetcherOptions) =>
    fetcher<T>(url, {
      ...options,
      method:
        'DELETE',
    }),

  patch: <T = any>(url: string, data?: any, options?: FetcherOptions) =>
    fetcher<T>(url, {
      ...options,
      method: 'PATCH',
      body: data
        ? JSON.stringify(data)
        : undefined,
    }),
}
