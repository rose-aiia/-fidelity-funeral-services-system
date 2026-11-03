import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/config/routes'
import { isIntentionalSignOut } from './signout-intent'
import type { Role } from './types'
import { useAuth } from './useAuth'

type RequireAuthProps = {
  /** When set, only these roles get in; anyone else sees a polite "no access" page. */
  roles?: Role[]
}

/** Layout route that gates its children behind a signed-in user, remembering where they were headed. */
export function RequireAuth({ roles }: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <p className="visually-hidden" role="status">
        Checking your session…
      </p>
    )
  }

  if (!user) {
    if (isIntentionalSignOut()) return <Navigate to={paths.home} replace />
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${paths.login}?next=${next}`} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="container status-page" id="main-content">
        <h1>This area is for provider staff</h1>
        <p className="muted">You’re signed in as {user.name}, which doesn’t have access to this page.</p>
        <Link className="btn btn--primary" to={paths.account}>
          Go to my account
        </Link>
      </main>
    )
  }

  return <Outlet />
}
