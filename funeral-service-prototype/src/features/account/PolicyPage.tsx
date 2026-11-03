import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toast } from '@/components/ui/Toast'
import { formatDate, formatUsd, ordinal } from '@/lib/format'
import { NoPolicyCard } from './DashboardPanels'
import { LinkedCelebration } from './LinkedCelebration'
import { PolicyCard } from './PolicyCard'
import { usePolicy } from './queries'
import type { Policy } from './data'
import { useJustLinked } from './useJustLinked'
import './account.css'

const TOAST_DURATION_MS = 3500

export default function PolicyPage() {
  const policyQuery = usePolicy()
  const policy = policyQuery.data
  const justLinked = useJustLinked(policy)
  const location = useLocation()
  const policyNotMatched = Boolean((location.state as { policyNotMatched?: boolean } | null)?.policyNotMatched)

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">My policy</p>
        <h1>Your cover, at a glance.</h1>
      </header>

      {policyNotMatched && !policy && (
        <Callout tone="warning" role="alert">
          Your account is ready, but we couldn’t match that policy. Check the policy number and ID number below and try again.
        </Callout>
      )}

      {justLinked && <LinkedCelebration policyNumber={justLinked.number} />}

      {policy ? (
        <PolicyDetails policy={policy} />
      ) : policy === null ? (
        <NoPolicyCard />
      ) : policyQuery.isPending ? (
        <div className="page-stack" role="status" aria-busy="true">
          <span className="visually-hidden">Loading your policy…</span>
          <Skeleton height="16rem" className="skeleton--card" />
          <Skeleton height="12rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={policyQuery.error} onRetry={() => void policyQuery.refetch()} noun="your policy" />
      )}
    </div>
  )
}

function PolicyDetails({ policy }: { policy: Policy }) {
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(false), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  const details: [string, string][] = [
    ['Policy number', policy.number],
    ['Plan', policy.planName],
    ['Policy holder', policy.holderName],
    ['Started', formatDate(policy.startDate)],
    ['Cover amount', formatUsd(policy.coverAmount)],
    ['Monthly premium', `${formatUsd(policy.monthlyPremium)}, due on the ${ordinal(policy.paymentDay)}`],
    ['Waiting period', `${policy.waitingPeriodMonths} months`],
  ]

  return (
    <>
      <div className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
        <PolicyCard policy={policy} showLink={false} />
      </div>

      <section className="card panel reveal" style={{ '--i': 2 } as React.CSSProperties} aria-labelledby="details-title">
        <h2 id="details-title" className="panel__title">
          Policy details
        </h2>
        <dl className="details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        className="card panel reveal"
        style={{ '--i': 3 } as React.CSSProperties}
        id="beneficiaries"
        aria-labelledby="beneficiaries-title"
      >
        <h2 id="beneficiaries-title" className="panel__title">
          Beneficiaries
        </h2>
        <ul className="beneficiaries">
          {policy.beneficiaries.map((person) => (
            <li key={person.name}>
              <span className="beneficiaries__name">
                <strong>{person.name}</strong>
                <span className="muted">{person.relationship}</span>
              </span>
              <span className="beneficiaries__share">{person.share}%</span>
              <span className="beneficiaries__bar" aria-hidden="true">
                <span style={{ width: `${person.share}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="muted panel__foot">To change who is named, ask an adviser and they’ll take you through it.</p>
      </section>

      <section
        className="card panel reveal"
        style={{ '--i': 4 } as React.CSSProperties}
        id="documents"
        aria-labelledby="documents-title"
      >
        <h2 id="documents-title" className="panel__title">
          Documents
        </h2>
        <ul className="documents">
          {policy.documents.map((document) => (
            <li key={document.id}>
              <span className="icon-tile">
                <Icon name="file" size={20} />
              </span>
              <span className="documents__name">
                <strong>{document.name}</strong>
                <span className="muted">PDF · {document.sizeKb} KB</span>
              </span>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setToast(true)}>
                <Icon name="download" size={16} />
                Download
              </button>
            </li>
          ))}
        </ul>
      </section>

      {toast && <Toast>These are sample documents. Real downloads arrive with the live system.</Toast>}
    </>
  )
}
