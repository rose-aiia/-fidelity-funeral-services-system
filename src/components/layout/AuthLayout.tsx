import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { paths } from '@/config/routes'
import { Brand } from './Brand'
import './account-layout.css'

const promises: { icon: IconName; title: string; text: string }[] = [
  { icon: 'shield', title: 'Your cover, clearly', text: 'See your policy, premiums and beneficiaries in one calm place.' },
  { icon: 'phone', title: 'Help when it matters', text: 'Ask an adviser to call you back, on the channel you prefer.' },
  { icon: 'heart', title: 'Memories kept safe', text: 'Remembrance pages and tributes are coming to your account.' },
]

/** Split-screen frame for sign-in and sign-up: the form on one side, the brand promise on the other. */
export function AuthLayout() {
  return (
    <div className="auth-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="auth-brand">
        <div className="auth-brand__inner">
          <Brand to={paths.home} />
          <blockquote className="auth-brand__quote">
            <p>Every life is a story worth keeping.</p>
          </blockquote>
          <ul className="auth-brand__promises">
            {promises.map((promise, index) => (
              <li key={promise.title} className="reveal" style={{ '--i': index + 2 } as React.CSSProperties}>
                <span className="auth-brand__icon">
                  <Icon name={promise.icon} size={20} />
                </span>
                <span>
                  <strong>{promise.title}</strong>
                  {promise.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel__top">
          <Link className="auth-back" to={paths.home}>
            <Icon name="arrow-right" size={16} className="auth-back__icon" />
            Back to website
          </Link>
        </div>

        <main className="auth-panel__main" id="main-content">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>

        <p className="auth-panel__note">Demonstration prototype. All names, numbers and policies are fictional.</p>
      </div>
    </div>
  )
}
