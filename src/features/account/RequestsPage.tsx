import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { REQUEST_KINDS, type RequestKind } from './data'
import { useRequests } from './queries'
import { RequestCard } from './RequestCard'
import { RequestForm } from './RequestForm'
import './account.css'

const isRequestKind = (value: string | null): value is RequestKind => REQUEST_KINDS.some((kind) => kind.value === value)

export default function RequestsPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('new')
  const [formOpen, setFormOpen] = useState(requested !== null)
  const requestsQuery = useRequests()

  const closeForm = () => {
    setFormOpen(false)
    if (requested !== null) setParams({}, { replace: true })
  }

  return (
    <div className="page-stack">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Requests</p>
          <h1>Help, on your terms.</h1>
        </div>
        {!formOpen && (
          <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
            <Icon name="plus" size={18} />
            New request
          </button>
        )}
      </header>

      {formOpen && <RequestForm initialKind={isRequestKind(requested) ? requested : 'general'} onClose={closeForm} />}

      {requestsQuery.data ? (
        requestsQuery.data.length > 0 ? (
          <div className="request-list">
            {requestsQuery.data.map((request, index) => (
              <div key={request.id} className="reveal" style={{ '--i': index } as React.CSSProperties}>
                <RequestCard request={request} />
              </div>
            ))}
          </div>
        ) : (
          !formOpen && (
            <div className="card empty empty--large">
              <span className="icon-tile icon-tile--lg">
                <Icon name="chat" size={24} />
              </span>
              <p>
                <strong>No requests yet.</strong>
                <span className="muted"> Ask us anything: a claim, a question, or help planning ahead.</span>
              </p>
              <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
                Ask for help
              </button>
            </div>
          )
        )
      ) : requestsQuery.isPending ? (
        <div className="request-list" role="status" aria-busy="true">
          <span className="visually-hidden">Loading your requests…</span>
          <Skeleton height="8rem" className="skeleton--card" />
          <Skeleton height="8rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={requestsQuery.error} onRetry={() => void requestsQuery.refetch()} noun="your requests" />
      )}
    </div>
  )
}
