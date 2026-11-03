import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { getErrorMessage } from '@/lib/api-error'
import { formatRelativeDays } from '@/lib/format'
import type { OwnedMemorial, Tribute } from './data'
import { useModerateTribute, useMyTributes } from './queries'

export function TributesTab({ memorial }: { memorial: OwnedMemorial }) {
  const tributes = useMyTributes(memorial.id)
  const moderate = useModerateTribute(memorial.id, memorial.slug)

  if (!tributes.data) {
    return (
      <QueryState
        isPending={tributes.isPending}
        error={tributes.error}
        onRetry={() => void tributes.refetch()}
        noun="tributes"
        skeleton
      />
    )
  }

  const pending = tributes.data.filter((tribute) => tribute.status === 'pending')
  const approved = tributes.data.filter((tribute) => tribute.status === 'approved')
  const act = (tribute: Tribute, status: 'approved' | 'removed') => moderate.mutate({ tributeId: tribute.id, status })

  return (
    <div className="stack">
      {moderate.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(moderate.error)}
        </Callout>
      )}

      <section className="card panel" aria-labelledby="pending-title">
        <div>
          <h2 id="pending-title" className="panel__title">
            Waiting for you {pending.length > 0 && <span className="count-pill">{pending.length}</span>}
          </h2>
          <p className="muted">Visitors’ tributes only appear on the page once you approve them.</p>
        </div>

        {pending.length === 0 ? (
          <p className="muted">Nothing to review right now.</p>
        ) : (
          <ul className="moderation">
            {pending.map((tribute) => (
              <li key={tribute.id} className="moderation__item">
                <TributeBody tribute={tribute} />
                <div className="moderation__actions">
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => act(tribute, 'approved')} disabled={moderate.isPending}>
                    <Icon name="check" size={16} />
                    Approve
                  </button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => act(tribute, 'removed')} disabled={moderate.isPending}>
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card panel" aria-labelledby="approved-title">
        <h2 id="approved-title" className="panel__title">
          On the page
        </h2>
        {approved.length === 0 ? (
          <p className="muted">Approved tributes will be listed here.</p>
        ) : (
          <ul className="moderation">
            {approved.map((tribute) => (
              <li key={tribute.id} className="moderation__item">
                <TributeBody tribute={tribute} />
                <div className="moderation__actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => act(tribute, 'removed')} disabled={moderate.isPending}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function TributeBody({ tribute }: { tribute: Tribute }) {
  return (
    <div className="moderation__body">
      <p>“{tribute.message}”</p>
      <p className="muted">
        <strong>{tribute.authorName}</strong>
        {tribute.relationship && <>, {tribute.relationship}</>} · {formatRelativeDays(tribute.createdAt)}
      </p>
    </div>
  )
}
