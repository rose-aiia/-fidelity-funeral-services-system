import { useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { onUnauthorized } from '@/lib/http'
import { clearSession } from './queries'

/** Signs the user out everywhere the moment any API call says the session is gone (a 401). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => onUnauthorized(() => clearSession(queryClient)), [queryClient])

  return children
}
