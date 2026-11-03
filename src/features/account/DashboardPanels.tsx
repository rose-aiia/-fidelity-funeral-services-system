import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { accountComingSoon } from '@/config/site'
import { anchor, paths } from '@/config/routes'
import { LinkPolicyForm } from './LinkPolicyForm'

type Action = { icon: IconName; title: string; text: string; to: string }

function actionsFor(hasPolicy: boolean): Action[] {
  if (!hasPolicy) {
    return [
      { icon: 'shield', title: 'Link your policy', text: 'Already insured with us? Add it in under a minute.', to: paths.accountPolicy },
      { icon: 'file', title: 'Get a quote', text: 'See what a funeral plan would cost for your family.', to: anchor('quote-form') },
      { icon: 'phone', title: 'Talk to an adviser', text: 'We’ll call you back, on the channel you prefer.', to: `${paths.accountRequests}?new=general` },
    ]
  }
  return [
    { icon: 'users', title: 'Review your beneficiaries', text: 'Make sure the right people are named.', to: `${paths.accountPolicy}#beneficiaries` },
    { icon: 'calendar', title: 'Book a consultation', text: 'Plan ahead with an adviser, at your pace.', to: `${paths.accountRequests}?new=general` },
    { icon: 'file', title: 'Download your policy schedule', text: 'Keep a copy where your family can find it.', to: `${paths.accountPolicy}#documents` },
  ]
}

export function NextActions({ hasPolicy }: { hasPolicy: boolean }) {
  return (
    <section className="card panel" aria-labelledby="next-actions-title">
      <h2 id="next-actions-title" className="panel__title">
        Next best steps
      </h2>
      <ul className="actions">
        {actionsFor(hasPolicy).map((action) => (
          <li key={action.title}>
            <Link className="action" to={action.to}>
              <span className="icon-tile">
                <Icon name={action.icon} size={20} />
              </span>
              <span className="action__text">
                <strong>{action.title}</strong>
                <span>{action.text}</span>
              </span>
              <Icon name="arrow-right" size={18} className="action__arrow" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Visible-but-not-built areas, so the direction of the product is clear from the dashboard. */
export function ComingSoon() {
  return (
    <section className="soon" aria-label="Coming soon">
      {accountComingSoon.map((item) => (
        <Link key={item.label} className="soon__tile" to={item.preview}>
          <span className="soon__icon">
            <Icon name={item.icon} size={22} />
          </span>
          <span>
            <strong>{item.label}</strong>
            <span>Flowers, plaques and services.</span>
          </span>
          <span className="soon__tag">
            <Icon name="lock" size={12} /> Soon
          </span>
        </Link>
      ))}
    </section>
  )
}

/** Card shown in place of the policy when none is linked yet. */
export function NoPolicyCard() {
  return (
    <article className="card no-policy" aria-labelledby="no-policy-title">
      <span className="icon-tile icon-tile--lg">
        <Icon name="shield" size={26} />
      </span>
      <h2 id="no-policy-title" className="panel__title">
        Link a policy you already have
      </h2>
      <p className="muted">
        Add your policy number and ID and we’ll show your cover, premiums and beneficiaries here. No policy yet? You can
        <Link to={anchor('quote-form')}> get a quote</Link> at any time.
      </p>
      <LinkPolicyForm />
    </article>
  )
}
