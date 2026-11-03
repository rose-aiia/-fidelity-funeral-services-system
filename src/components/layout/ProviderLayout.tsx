import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { paths } from '@/config/routes'
import { useAuth, useSignOutAndLeave } from '@/features/auth'
import { Brand } from './Brand'

export function ProviderLayout() {
  const { user } = useAuth()
  const handleSignOut = useSignOutAndLeave()

  return (
    <div className="site-shell provider-page">
      <header className="site-header">
        <div className="container site-header__inner">
          <Brand to={paths.home} subtitle="Provider portal" />

          <div className="site-header__actions">
            {user && <span className="site-header__user">{user.name}</span>}
            <Link className="btn btn--outline btn--sm" to={paths.home}>
              Back to home
            </Link>
            <button type="button" className="btn btn--outline btn--sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  )
}
