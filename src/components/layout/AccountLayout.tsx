import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { accountNav } from '@/config/site'
import { useAuth, useSignOutAndLeave } from '@/features/auth'
import { CartButton } from '@/features/marketplace'
import { Brand } from './Brand'
import './account-layout.css'

function PageSkeleton() {
  return (
    <div className="account-skeleton" role="status" aria-busy="true">
      <span className="visually-hidden">Loading your account…</span>
      <Skeleton height="11rem" className="account-skeleton__hero" />
      <Skeleton height="14rem" />
      <Skeleton height="9rem" />
    </div>
  )
}

/** Shell for the signed-in customer area: header, sidebar (desktop) or tab bar (mobile), and the page. */
export function AccountLayout() {
  const { user } = useAuth()
  const handleSignOut = useSignOutAndLeave()

  return (
    <div className="site-shell account-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Brand to={paths.account} subtitle="My account" />

          <div className="site-header__actions">
            <CartButton />
            <Link className="btn btn--outline btn--sm account-header__site" to={paths.home}>
              Back to website
            </Link>
            {user && (
              <div className="account-user">
                <Avatar name={user.name} size="sm" />
                <span className="account-user__name">{user.name}</span>
              </div>
            )}
            <button type="button" className="btn btn--outline btn--sm" onClick={handleSignOut}>
              <Icon name="logout" size={16} />
              <span className="account-header__label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container account-frame">
        <aside className="account-side">
          <nav aria-label="Account">
            <ul className="account-nav">
              {accountNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="account-nav__link">
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="account-help">
            <p className="account-help__title">Need to talk to someone?</p>
            <p>An adviser can call you back, on the channel you prefer.</p>
            <Link className="btn btn--primary btn--sm" to={`${paths.accountRequests}?new=general`}>
              Request a call back
            </Link>
          </div>
        </aside>

        <main className="account-main" id="main-content">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="account-tabbar" aria-label="Account">
        {accountNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="account-tabbar__link">
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
