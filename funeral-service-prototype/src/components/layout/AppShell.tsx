import { Suspense, type CSSProperties, type ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import type { AccountNavItem } from '@/config/site'
import { useAuth, useSignOutAndLeave } from '@/features/auth'
import { CartButton } from '@/features/marketplace'
import { Brand } from './Brand'
import './account-layout.css'

function PageSkeleton({ label }: { label: string }) {
  return (
    <div className="account-skeleton" role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      <Skeleton height="11rem" className="account-skeleton__hero" />
      <Skeleton height="14rem" />
      <Skeleton height="9rem" />
    </div>
  )
}

type AppShellProps = {
  brandTo: string
  /** Under the logo: "My account", "Administrator"... */
  subtitle: string
  navLabel: string
  nav: AccountNavItem[]
  /** Shown under the navigation on desktop. */
  aside?: ReactNode
  /** Customers get a basket button; staff don't. */
  showCart?: boolean
  /** Said to screen readers while a page loads. */
  loadingLabel: string
}

/** Header, sidebar (desktop) or tab bar (mobile), and the page: the frame for every signed-in area. */
export function AppShell({ brandTo, subtitle, navLabel, nav, aside, showCart = false, loadingLabel }: AppShellProps) {
  const { user } = useAuth()
  const handleSignOut = useSignOutAndLeave()

  return (
    <div className="site-shell account-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Brand to={brandTo} subtitle={subtitle} />

          <div className="site-header__actions">
            {showCart && <CartButton />}
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
          <nav aria-label={navLabel}>
            <ul className="account-nav">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="account-nav__link">
                    <Icon name={item.icon} size={20} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {aside}
        </aside>

        <main className="account-main" id="main-content">
          <Suspense fallback={<PageSkeleton label={loadingLabel} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <nav className="account-tabbar" aria-label={navLabel} style={{ '--tabs': nav.length } as CSSProperties}>
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="account-tabbar__link">
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
