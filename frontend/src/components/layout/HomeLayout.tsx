import { Outlet } from 'react-router-dom'
import { HomeHeader } from './HomeHeader'
import { SampleNotice } from './SampleNotice'
import { SiteFooter } from './SiteFooter'

export function HomeLayout() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SampleNotice />
      <HomeHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
