import { useSignOut } from './queries'
import { markIntentionalSignOut } from './signout-intent'

/**
 * Returns a handler for a "Sign out" button. It ends the session and flags it as deliberate, so the route
 * guard sends the person to the home page instead of the sign-in page it uses for expired sessions.
 */
export function useSignOutAndLeave() {
  const signOut = useSignOut()

  return () => {
    markIntentionalSignOut()
    signOut.mutate()
  }
}
