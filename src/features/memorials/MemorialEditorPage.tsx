import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusChip } from '@/components/ui/StatusChip'
import { accountMemorialPath, memorialPath, paths } from '@/config/routes'
import { ApiError } from '@/lib/api-error'
import { completeness, lifespan, type OwnedMemorial } from './data'
import { DetailsTab } from './DetailsTab'
import { NewMemorialForm } from './NewMemorialForm'
import { PhotosTab } from './PhotosTab'
import { Portrait } from './Portrait'
import { useMyMemorial } from './queries'
import { ShareTab } from './ShareTab'
import { StoryTab } from './StoryTab'
import { TributesTab } from './TributesTab'
import './memorial.css'
import './studio.css'

type TabId = 'details' | 'story' | 'photos' | 'tributes' | 'share'

const tabs: { id: TabId; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'story', label: 'Story' },
  { id: 'photos', label: 'Photos' },
  { id: 'tributes', label: 'Tributes' },
  { id: 'share', label: 'Share' },
]

/** Where each unfinished step is completed. */
const stepTab: Record<string, TabId> = {
  portrait: 'photos',
  tagline: 'details',
  story: 'story',
  timeline: 'story',
  photos: 'photos',
  service: 'details',
}

const isTab = (value: string | null): value is TabId => tabs.some((tab) => tab.id === value)

export default function MemorialEditorPage() {
  const { id } = useParams()
  if (!id || id === 'new') return <NewMemorialForm />
  return <Editor id={id} />
}

function Editor({ id }: { id: string }) {
  const memorial = useMyMemorial(id)

  if (memorial.data) return <EditorView key={memorial.data.id} memorial={memorial.data} />

  if (memorial.error instanceof ApiError && memorial.error.status === 404) {
    return (
      <div className="page-stack">
        <div className="card empty empty--large">
          <h1 className="panel__title">We couldn’t find that memorial</h1>
          <p className="muted">It may have been removed, or it belongs to a different account.</p>
          <Link className="btn btn--primary" to={paths.accountMemorials}>
            Back to my memorials
          </Link>
        </div>
      </div>
    )
  }

  return memorial.isPending ? (
    <div className="page-stack" role="status" aria-busy="true">
      <span className="visually-hidden">Loading the memorial…</span>
      <Skeleton height="8rem" className="skeleton--card" />
      <Skeleton height="20rem" className="skeleton--card" />
    </div>
  ) : (
    <QueryState isPending={false} error={memorial.error} onRetry={() => void memorial.refetch()} noun="the memorial" />
  )
}

function EditorView({ memorial }: { memorial: OwnedMemorial }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const created = Boolean((location.state as { created?: boolean } | null)?.created)
  const requested = params.get('tab')
  const active: TabId = isTab(requested) ? requested : 'details'
  const { percent, steps } = completeness(memorial)
  const remaining = steps.filter((step) => !step.done)

  return (
    <div className="page-stack">
      <header className="card editor-head reveal">
        <Portrait memorial={memorial} size="md" />
        <div className="editor-head__main">
          <p className="eyebrow">Memorial</p>
          <h1>{memorial.name}</h1>
          <p className="muted">
            {lifespan(memorial.born, memorial.died)}
            {memorial.location && <> · {memorial.location}</>}
          </p>
        </div>
        <div className="editor-head__actions">
          <StatusChip tone={memorial.published ? 'success' : 'neutral'}>
            {memorial.published ? 'Published' : 'Private draft'}
          </StatusChip>
          <Link className="btn btn--outline btn--sm" to={memorialPath(memorial.slug)}>
            {memorial.published ? 'View page' : 'Preview'}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </header>

      {created && (
        <div className="celebrate" role="status">
          <span className="celebrate__mark" aria-hidden="true">
            <Icon name="heart" size={26} />
          </span>
          <div>
            <p className="celebrate__title">Memorial created</p>
            <p>It’s private for now. Add their story and photographs, then publish when you’re ready.</p>
          </div>
        </div>
      )}

      <section className="card editor-progress reveal" style={{ '--i': 1 } as React.CSSProperties} aria-label="Memorial progress">
        <ProgressRing progress={percent / 100} label={`${percent}% complete`} size={88}>
          <strong>{percent}%</strong>
        </ProgressRing>
        <div>
          <h2 className="panel__title">{remaining.length === 0 ? 'Beautifully complete' : 'Make it complete'}</h2>
          {remaining.length === 0 ? (
            <p className="muted">Everything is in place. Publish it when you’re ready to share.</p>
          ) : (
            <ul className="editor-progress__steps">
              {remaining.map((step) => (
                <li key={step.id}>
                  <Link to={accountMemorialPath(memorial.id, stepTab[step.id])}>{step.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <nav className="editor-tabs" aria-label="Memorial sections">
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link
                to={accountMemorialPath(memorial.id, tab.id)}
                replace
                className="editor-tabs__link"
                aria-current={tab.id === active ? 'page' : undefined}
              >
                {tab.label}
                {tab.id === 'tributes' && memorial.pendingTributes > 0 && (
                  <span className="count-pill" aria-label={`${memorial.pendingTributes} waiting`}>
                    {memorial.pendingTributes}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="editor-panel" key={active}>
        {active === 'details' && <DetailsTab memorial={memorial} />}
        {active === 'story' && <StoryTab memorial={memorial} />}
        {active === 'photos' && <PhotosTab memorial={memorial} />}
        {active === 'tributes' && <TributesTab memorial={memorial} />}
        {active === 'share' && <ShareTab memorial={memorial} />}
      </div>
    </div>
  )
}
