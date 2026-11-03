import { QueryClient } from '@tanstack/react-query'
import { isRetryable } from './api-error'
import { env } from './env'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mock data never changes, so never refetch it; live data is cached for a minute.
      staleTime: env.useMock ? Infinity : 60_000,
      retry: (failureCount, error) => isRetryable(error) && failureCount < MAX_RETRIES,
      refetchOnWindowFocus: false,
    },
  },
})
