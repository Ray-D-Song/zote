import type { FetcherOptions, FetcherResponse } from '@/utils/fetcher'
import { useSignal } from '@preact/signals'
import { useEffect } from 'preact/hooks'
import { fetcher, FetcherError } from '@/utils/fetcher'

export interface UseFetchOptions<T> extends
  FetcherOptions {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: FetcherError) => void
  deps?: any[]
}

export interface UseFetchResult<T> {
  data: T | null
  error: FetcherError | null
  loading: boolean
  execute: () => Promise<void>
  reset: () => void
}

export function useFetch<T = any>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
): UseFetchResult<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    deps = [],
    ...fetcherOptions
  } = options || {}

  const data = useSignal<T | null>(null)
  const error = useSignal<FetcherError
    | null>(null)
  const loading = useSignal(false)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      const resolvedUrl = typeof url
        === 'function'
        ? url()
        : url
      const response: FetcherResponse<T>
        = await fetcher<T>(resolvedUrl, fetcherOptions)

      data.value = response.data
      onSuccess?.(response.data)
    }
    catch (err) {
      const fetchError = err
        instanceof FetcherError
        ? err
        : new FetcherError(err
          instanceof Error
          ? err.message
          : 'Unknown error')

      error.value = fetchError
      onError?.(fetchError)
    }
    finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, deps)

  return {
    data: data.value,
    error: error.value,
    loading: loading.value,
    execute,
    reset,
  }
}
