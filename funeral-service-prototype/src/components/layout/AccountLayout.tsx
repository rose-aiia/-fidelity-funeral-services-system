import { Link } from 'react-router-dom'
import { paths } from '@/config/routes'
import { accountNav } from '@/config/site'
import { AppShell } from './AppShell'

function HelpCard() {
  return (
    <div className="account-help">
      <p className="account-help__title">Need to talk to someone?</p>
      <p>An adviser can call you back, on the channel you prefer.</p>
      <Link className="btn btn--primary btn--sm" to={`${paths.accountRequests}?new=general`}>
        Request a call back
      </Link>
    </div>
  )
}

/** Shell for the signed-in customer area. */
export function AccountLayout() {
  return (
    <AppShell
      brandTo={paths.account}
      subtitle="My account"
      navLabel="Account"
      nav={accountNav}
      aside={<HelpCard />}
      showCart
      loadingLabel="Loading your account…"
    />
  )
}
