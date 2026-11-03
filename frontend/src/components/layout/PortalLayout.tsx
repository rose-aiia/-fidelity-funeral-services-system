import { paths } from '@/config/routes'
import { portalNav } from '@/config/site'
import { useAuth } from '@/features/auth'
import { AppShell } from './AppShell'

const roleCopy = {
  admin: { subtitle: 'Administrator', hint: 'You can see every family, request, order and provider. Every change you make is logged.' },
  provider: { subtitle: 'Provider portal', hint: 'You see only the requests and orders that involve your business.' },
} as const

/** Shell for the staff portal: the navigation depends on whether the person is an administrator or a provider. */
export function PortalLayout() {
  const { user } = useAuth()
  const role = user?.role === 'provider' ? 'provider' : 'admin'
  const copy = roleCopy[role]

  return (
    <AppShell
      brandTo={paths.provider}
      subtitle={copy.subtitle}
      navLabel="Staff portal"
      nav={portalNav(role)}
      aside={
        <div className="account-help">
          <p className="account-help__title">{copy.subtitle}</p>
          <p>{copy.hint}</p>
        </div>
      }
      loadingLabel="Loading the portal…"
    />
  )
}
