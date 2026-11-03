import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { orderStatusDisplay } from '@/features/marketplace/status'
import { formatUsd } from '@/lib/format'
import type { AttentionItem, Overview, PortalPage } from './data'
import { usePortalRole } from './portal-ui'
import { useOverview } from './queries'
import './portal.css'

const pagePath: Record<PortalPage, string> = {
  overview: paths.provider,
  requests: paths.portalRequests,
  orders: paths.portalOrders,
  customers: paths.portalCustomers,
  providers: paths.portalProviders,
  activity: paths.portalActivity,
}

const hrefFor = (item: AttentionItem) => `${pagePath[item.target.page]}${item.target.id ? `?focus=${encodeURIComponent(item.target.id)}` : ''}`

export default function OverviewPage() {
  const { user } = useAuth()
  const role = usePortalRole()
  const overview = useOverview()
  const first = user?.name.split(' ')[0] ?? ''

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">{role === 'admin' ? 'Administrator' : 'Provider portal'}</p>
        <h1>{first ? `${first}, here’s what needs you.` : 'Here’s what needs you.'}</h1>
        <p className="muted page-head__lead">
          {role === 'admin'
            ? 'Families first: urgent requests are at the top. Everything you do here is recorded in the activity log.'
            : 'Requests handed to you and orders for your products, with the next step for each.'}
        </p>
      </header>

      {overview.data ? (
        <OverviewBody overview={overview.data} role={role} />
      ) : overview.isPending ? (
        <div className="page-stack" role="status" aria-busy="true">
          <span className="visually-hidden">Loading the overview…</span>
          <Skeleton height="6rem" className="skeleton--card" />
          <Skeleton height="14rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={overview.error} onRetry={() => void overview.refetch()} noun="the overview" />
      )}
    </div>
  )
}

function OverviewBody({ overview, role }: { overview: Overview; role: 'admin' | 'provider' }) {
  const max = Math.max(1, ...overview.ordersByStatus.map((entry) => entry.count))

  return (
    <>
      <ul className="stat-tiles">
        {overview.stats.map((stat, index) => (
          <li
            key={stat.id}
            className={`stat-tile reveal${stat.tone === 'alert' ? ' stat-tile--alert' : stat.tone === 'good' ? ' stat-tile--good' : ''}`}
            style={{ '--i': index } as React.CSSProperties}
          >
            <span className="stat-tile__value">{stat.money ? formatUsd(stat.value) : stat.value}</span>
            <span className="stat-tile__label">{stat.label}</span>
            {stat.hint && <span className="stat-tile__hint">{stat.hint}</span>}
          </li>
        ))}
      </ul>

      <div className="overview-grid">
        <section className="card panel reveal" style={{ '--i': 2 } as React.CSSProperties} aria-labelledby="attention-title">
          <h2 id="attention-title" className="panel__title">
            Needs attention
          </h2>
          {overview.attention.length === 0 ? (
            <div className="empty">
              <span className="icon-tile icon-tile--lg">
                <Icon name="check" size={24} />
              </span>
              <p>
                <strong>All clear.</strong>
                <span className="muted"> Nothing is waiting on you right now.</span>
              </p>
            </div>
          ) : (
            <ul className="attention">
              {overview.attention.map((item) => (
                <li key={item.id}>
                  <Link className={`attention__item attention__item--${item.tone}`} to={hrefFor(item)}>
                    <span className="attention__dot" aria-hidden="true" />
                    <span className="attention__text">
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </span>
                    <Icon name="arrow-right" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel reveal" style={{ '--i': 3 } as React.CSSProperties} aria-labelledby="orders-title">
          <div className="panel__head">
            <h2 id="orders-title" className="panel__title">
              {role === 'admin' ? 'Orders by status' : 'Your orders'}
            </h2>
            <Link className="link-arrow" to={paths.portalOrders}>
              View all <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          {overview.ordersByStatus.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <ul className="bars">
              {overview.ordersByStatus.map((entry) => (
                <li key={entry.status} className="bar">
                  <span>{orderStatusDisplay[entry.status].label}</span>
                  <span className="bar__track" aria-hidden="true">
                    <span className="bar__fill" style={{ width: `${(entry.count / max) * 100}%` }} />
                  </span>
                  <span className="bar__count">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
