import { Icon, type IconName } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatAge, formatServiceTime } from '@/lib/format'
import type { AuditEntry } from './data'
import { useActivity } from './queries'
import './portal.css'

const icons: Record<AuditEntry['action'], IconName> = { create: 'plus', update: 'check', assign: 'users' }

export default function ActivityPage() {
  const activity = useActivity()

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">Activity</p>
        <h1>Who did what, and when.</h1>
        <p className="muted page-head__lead">Every assignment, status change and provider update is recorded here and can’t be edited.</p>
      </header>

      {activity.data ? (
        <section className="card panel reveal" style={{ '--i': 1 } as React.CSSProperties} aria-label="Activity log">
          {activity.data.length === 0 ? (
            <p className="muted">Nothing has happened yet.</p>
          ) : (
            <ul className="activity">
              {activity.data.map((entry) => (
                <li key={entry.id}>
                  <span className="activity__icon">
                    <Icon name={icons[entry.action]} size={18} />
                  </span>
                  <span className="activity__body">
                    <strong>{entry.summary}</strong>
                    <span>
                      {entry.actorName} · {entry.actorRole}
                    </span>
                  </span>
                  <time dateTime={entry.at} title={formatServiceTime(entry.at)}>
                    {formatAge(entry.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : activity.isPending ? (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">Loading activity…</span>
          <Skeleton height="16rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={activity.error} onRetry={() => void activity.refetch()} noun="the activity log" />
      )}
    </div>
  )
}
