import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { accountMemorialPath, paths } from '@/config/routes'
import { lifespan } from './data'
import { Portrait } from './Portrait'
import { useMyMemorials } from './queries'
import './memorial.css'
import './studio.css'

/** The dashboard's window onto memorials: the latest one, or an invitation to create the first. */
export function MemorialsSummaryCard() {
  const { data, isPending } = useMyMemorials()

  if (isPending) return <Skeleton height="8rem" className="skeleton--card" />
  // A failed fetch shouldn't clutter the dashboard; the Memorials page shows the error with a retry.
  if (!data) return null

  const latest = data[0]
  const pendingTotal = data.reduce((sum, memorial) => sum + memorial.pendingTributes, 0)
  const needsReview = data.find((memorial) => memorial.pendingTributes > 0)

  if (!latest) {
    return (
      <Link className="soon__tile" to={paths.accountMemorials}>
        <span className="soon__icon">
          <Icon name="flower" size={22} />
        </span>
        <span>
          <strong>Create a memorial</strong>
          <span>A page for photos, stories, flowers and tributes.</span>
        </span>
        <Icon name="arrow-right" size={18} />
      </Link>
    )
  }

  return (
    <section className="card panel" aria-labelledby="memorials-summary-title">
      <div className="panel__head">
        <h2 id="memorials-summary-title" className="panel__title">
          Memorials
        </h2>
        <Link className="link-arrow" to={paths.accountMemorials}>
          Manage <Icon name="arrow-right" size={16} />
        </Link>
      </div>

      <Link className="summary-memorial" to={accountMemorialPath(latest.id)}>
        <Portrait memorial={latest} size="sm" />
        <span className="summary-memorial__text">
          <strong>{latest.name}</strong>
          <span>
            {lifespan(latest.born, latest.died)} · {latest.flowers.toLocaleString('en-US')} flowers ·{' '}
            {latest.candles.toLocaleString('en-US')} candles
          </span>
        </span>
      </Link>

      {needsReview && (
        <Link className="summary-pending" to={accountMemorialPath(needsReview.id, 'tributes')}>
          <Icon name="heart" size={16} />
          {pendingTotal} {pendingTotal === 1 ? 'tribute' : 'tributes'} waiting for your approval
        </Link>
      )}
    </section>
  )
}
