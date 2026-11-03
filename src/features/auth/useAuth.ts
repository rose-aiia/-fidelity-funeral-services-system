import { useMe } from './queries'
import type { User } from './types'

type AuthState = {
  /** The signed-in user, or null when signed out (or while the first check is still running). */
  user: User | null
  /** True only until the first answer arrives (live mode; mock mode answers synchronously). */
  isLoading: boolean
}

export function useAuth(): AuthState {
  const { data, isPending } = useMe()
  return { user: data ?? null, isLoading: isPending }
}
