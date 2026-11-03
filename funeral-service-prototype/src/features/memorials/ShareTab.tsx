import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { memorialPath, paths } from '@/config/routes'
import { getErrorMessage } from '@/lib/api-error'
import { completeness, type OwnedMemorial } from './data'
import { useDeleteMemorial, useUpdateMemorial } from './queries'
import { ShareActions } from './ShareActions'

const SUGGEST_BELOW_PERCENT = 50

export function ShareTab({ memorial }: { memorial: OwnedMemorial }) {
  const navigate = useNavigate()
  const update = useUpdateMemorial(memorial.id)
  const remove = useDeleteMemorial()
  const [confirming, setConfirming] = useState(false)
  const url = `${window.location.origin}${memorialPath(memorial.slug)}`
  const { percent } = completeness(memorial)

  return (
    <div className="stack">
      <section className="card panel" aria-labelledby="publish-title">
        <div className="panel__head">
          <h2 id="publish-title" className="panel__title">
            Visibility
          </h2>
          <StatusChip tone={memorial.published ? 'success' : 'neutral'}>
            {memorial.published ? 'Published' : 'Private draft'}
          </StatusChip>
        </div>

        <p className="muted">
          {memorial.published
            ? 'Anyone with the link can visit this memorial, leave flowers and candles, and send tributes for you to approve. It isn’t listed anywhere, so only people you share the link with will find it.'
            : 'Only you can see this memorial right now. Preview it, and publish when you’re ready for others to visit.'}
        </p>

        {!memorial.published && percent < SUGGEST_BELOW_PERCENT && (
          <Callout tone="info">
            It’s {percent}% complete. A portrait and a few words go a long way before you share it.
          </Callout>
        )}

        {update.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(update.error)}
          </Callout>
        )}

        <div className="studio-form__actions">
          <button
            type="button"
            className={`btn ${memorial.published ? 'btn--outline' : 'btn--primary'}`}
            onClick={() => update.mutate({ published: !memorial.published })}
            disabled={update.isPending}
          >
            {update.isPending ? 'Saving…' : memorial.published ? 'Unpublish' : 'Publish memorial'}
          </button>
          <Link className="btn btn--outline" to={memorialPath(memorial.slug)}>
            {memorial.published ? 'View page' : 'Preview'}
          </Link>
        </div>
      </section>

      {memorial.published && (
        <section className="card panel" aria-labelledby="share-title">
          <h2 id="share-title" className="panel__title">
            Share the link
          </h2>
          <p className="share-url">{url}</p>
          <ShareActions name={memorial.name} url={url} />
        </section>
      )}

      <section className="card panel danger-zone" aria-labelledby="delete-title">
        <h2 id="delete-title" className="panel__title">
          Remove this memorial
        </h2>
        <p className="muted">
          This permanently removes the page, its photographs and every tribute. If you only want it hidden for now,
          unpublish it instead.
        </p>
        {remove.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(remove.error)}
          </Callout>
        )}
        {confirming ? (
          <div className="studio-form__actions">
            <button
              type="button"
              className="btn btn--deep"
              disabled={remove.isPending}
              onClick={() => remove.mutate(memorial.id, { onSuccess: () => navigate(paths.accountMemorials, { replace: true }) })}
            >
              <Icon name="alert" size={16} />
              {remove.isPending ? 'Removing…' : `Yes, remove ${memorial.name.split(' ')[0]}’s memorial`}
            </button>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(false)} disabled={remove.isPending}>
              Keep it
            </button>
          </div>
        ) : (
          <div>
            <button type="button" className="btn btn--outline" onClick={() => setConfirming(true)}>
              Remove memorial
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
