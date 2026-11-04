import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { anchor, paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { CartButton } from '@/features/marketplace'
import { Brand } from './Brand'

export function HomeHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [tone, setTone] = useState<'dark' | 'light'>('dark')
  const headerRef = useRef<HTMLElement>(null)
  const { user } = useAuth()
  const location = useLocation()
  const closeMenu = () => setIsMenuOpen(false)

  // The header has no colour of its own: it reads the section currently behind it (`data-header-tone`, light by
  // default) and switches its text and logo to suit. Checked on scroll, resize and whenever the page changes.
  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      setIsScrolled(window.scrollY > 24)
      const header = headerRef.current
      if (!header) return
      const box = header.getBoundingClientRect()
      const behind = document
        .elementsFromPoint(window.innerWidth / 2, Math.max(2, box.top + box.height / 2))
        .find((element) => !header.contains(element))
      const next = behind?.closest('[data-header-tone]')?.getAttribute('data-header-tone') === 'dark' ? 'dark' : 'light'
      setTone(next)
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    // Lazily loaded pages appear a moment after the route changes.
    const settle = window.setTimeout(update, 250)
    const settleAgain = window.setTimeout(update, 900)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      window.clearTimeout(settleAgain)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [location.pathname])

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
    // The drawer starts where the header ends, which is lower than the top of the page while the notice strip shows.
    document.documentElement.style.setProperty('--header-bottom', `${headerRef.current?.getBoundingClientRect().bottom ?? 0}px`)
    const media = window.matchMedia('(min-width: 961px)')
    const onChange = () => media.matches && setIsMenuOpen(false)
    media.addEventListener('change', onChange)
    return () => {
      document.body.style.overflow = previous
      document.documentElement.style.removeProperty('--header-bottom')
      media.removeEventListener('change', onChange)
    }
  }, [isMenuOpen])

  return (
    <header
      ref={headerRef}
      className={`site-header site-header--adaptive${isScrolled ? ' is-scrolled' : ''}${isMenuOpen ? ' is-menu-open' : ''}${tone === 'light' && !isMenuOpen ? ' is-light' : ''}`}
    >
      <div className="container site-header__inner">
        <Brand to={anchor('top')} tone="auto" />

        <nav id="main-navigation" className={`site-nav${isMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
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
