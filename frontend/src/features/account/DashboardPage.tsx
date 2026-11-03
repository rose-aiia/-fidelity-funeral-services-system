import { Link, useLocation } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { OrdersSummaryCard } from '@/features/marketplace'
import { MemorialsSummaryCard } from '@/features/memorials'
import { greeting, statusDisplay } from './cover'
import { NextActions, NoPolicyCard } from './DashboardPanels'
import { LinkedCelebration } from './LinkedCelebration'
import { PolicyCard } from './PolicyCard'
import { usePolicy, useRequests } from './queries'
import { RequestCard } from './RequestCard'
import { useJustLinked } from './useJustLinked'
import './account.css'

const RECENT_REQUESTS = 3

export default function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()
  const welcome = Boolean((location.state as { welcome?: boolean } | null)?.welcome)

  const policyQuery = usePolicy()
  const requestsQuery = useRequests()
  const policy = policyQuery.data
  const justLinked = useJustLinked(policy)

  const firstName = user?.name.split(' ')[0] ?? ''

  const statusLine = (() => {
    if (policy === undefined) return null
    if (!policy) return 'Let’s get you covered. Link a policy you already have, or get a quote.'
    return `Your ${policy.planName} is ${statusDisplay[policy.status].label.toLowerCase()}. We’re here whenever you need us.`
  })()

  return (
    <div className="dashboard">
      <header className="account-hero reveal">
        <p className="account-hero__eyebrow">{welcome ? 'Welcome to your account' : greeting()}</p>
        <h1>{firstName ? `${firstName}, ` : ''}here’s where things stand.</h1>
        {statusLine ? <p className="account-hero__lead">{statusLine}</p> : <Skeleton width="60%" height="1.2rem" className="account-hero__skeleton" />}
        <div className="account-hero__actions">
          <Link className="btn btn--primary" to={`${paths.accountRequests}?new=general`}>
            <Icon name="phone" size={18} />
            Request assistance
          </Link>
          <Link className="btn btn--outline" to={paths.accountPolicy}>
            {policy ? 'View my policy' : 'Link a policy'}
          </Link>
        </div>
      </header>

      <div className="dashboard__grid">
        <div className="dashboard__main">
          {justLinked && <LinkedCelebration policyNumber={justLinked.number} />}

          <div className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
            {policy ? (
              <PolicyCard policy={policy} />
            ) : policy === null ? (
              <NoPolicyCard />
            ) : policyQuery.isPending ? (
              <Skeleton height="17rem" className="skeleton--card" />
            ) : (
              <QueryState isPending={false} error={policyQuery.error} onRetry={() => void policyQuery.refetch()} noun="your policy" />
            )}
          </div>

          <section className="card panel reveal" style={{ '--i': 2 } as React.CSSProperties} aria-labelledby="recent-title">
            <div className="panel__head">
              <h2 id="recent-title" className="panel__title">
                Recent requests
              </h2>
              <Link className="link-arrow" to={paths.accountRequests}>
                View all <Icon name="arrow-right" size={16} />
              </Link>
            </div>

            {requestsQuery.data ? (
              requestsQuery.data.length > 0 ? (
                <div className="request-list">
                  {requestsQuery.data.slice(0, RECENT_REQUESTS).map((request) => (
                    <RequestCard key={request.id} request={request} compact />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <span className="icon-tile icon-tile--lg">
                    <Icon name="chat" size={24} />
                  </span>
                  <p>
                    <strong>Nothing here yet.</strong>
                    <span className="muted"> When you ask us for help, you can follow it here, step by step.</span>
                  </p>
                  <Link className="btn btn--outline btn--sm" to={`${paths.accountRequests}?new=general`}>
                    Ask for help
                  </Link>
                </div>
              )
            ) : requestsQuery.isPending ? (
              <div className="request-list" role="status" aria-busy="true">
                <span className="visually-hidden">Loading your requests…</span>
                <Skeleton height="4rem" />
                <Skeleton height="4rem" />
              </div>
            ) : (
              <QueryState isPending={false} error={requestsQuery.error} onRetry={() => void requestsQuery.refetch()} noun="your requests" />
            )}
          </section>
        </div>

        <div className="dashboard__side">
          <div className="reveal" style={{ '--i': 3 } as React.CSSProperties}>
            <NextActions hasPolicy={Boolean(policy)} />
          </div>
          <div className="reveal" style={{ '--i': 4 } as React.CSSProperties}>
            <MemorialsSummaryCard />
          </div>
          <div className="reveal" style={{ '--i': 5 } as React.CSSProperties}>
            <OrdersSummaryCard />
          </div>
        </div>
      </div>
    </div>
  )
}
