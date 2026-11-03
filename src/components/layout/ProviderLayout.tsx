import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { paths } from '@/config/routes'
import { Brand } from './Brand'

export function ProviderLayout() {
  return (
    <div className="site-shell provider-page">
      <header className="site-header">
        <div className="container site-header__inner">
          <Brand to={paths.home} subtitle="Provider portal" />

          <div className="site-header__actions">
            <Link className="btn btn--outline btn--sm" to={paths.home}>
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  )
}
