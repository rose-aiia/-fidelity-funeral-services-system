import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { titleFor } from '@/config/routes'

/**
 * Router side effects:
 * - old hash URLs (`/#/provider-portal`) are redirected to real paths
 * - navigation scrolls to the `#section` target, or back to the top of the page
 * - the document title follows the route
 */
export function RouteEffects() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.hash.startsWith('#/')) {
      navigate(location.hash.slice(1), { replace: true })
    }
  }, [location.hash, navigate])

  useEffect(() => {
    document.title = titleFor(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    if (location.hash.startsWith('#/')) return

    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null
    if (target) {
      target.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [location.key, location.hash])

  return null
}
