import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { anchor, paths } from '@/config/routes'
import { primaryNav } from '@/config/site'
import { useAuth } from '@/features/auth'
import { CartButton } from '@/features/marketplace'
import { Brand } from './Brand'

export function HomeHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  // Close the drawer when the route changes.
  const routeKey = location.pathname + location.hash
  const [menuRoute, setMenuRoute] = useState(routeKey)
  if (menuRoute !== routeKey) {
    setMenuRoute(routeKey)
    setIsMenuOpen(false)
  }

  // Lock page scroll while the drawer is open, and drop the lock if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!isMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const media = window.matchMedia('(min-width: 961px)')
    const onChange = () => media.matches && setIsMenuOpen(false)
    media.addEventListener('change', onChange)
    return () => {
      document.body.style.overflow = previous
      media.removeEventListener('change', onChange)
    }
  }, [isMenuOpen])

  return (
    <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <Brand to={anchor('top')} />

        <nav id="main-navigation" className={`site-nav${isMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {user ? (
            <Link className="site-nav__account" to={user.role === 'customer' ? paths.account : paths.provider} onClick={closeMenu}>
              <Avatar name={user.name} size="sm" />
              My account
            </Link>
          ) : (
            <Link className="btn btn--outline btn--sm site-nav__signin" to={paths.login} onClick={closeMenu}>
              Sign in
            </Link>
          )}

          <Link className="btn btn--primary btn--sm site-nav__cta" to={anchor('quote-form')} onClick={closeMenu}>
            Request a quote
          </Link>
        </nav>

        <div className="site-header__cart">
          <CartButton />
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          Menu
        </button>
      </div>
    </header>
  )
}
