import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Skeleton } from '@/components/ui/Skeleton'
import { QueryState } from '@/components/ui/QueryState'
import { paths } from '@/config/routes'
import { site } from '@/config/site'
import { ApiError } from '@/lib/api-error'
import { formatDay } from '@/lib/format'
import { ageAtDeath, lifespan, type Memorial } from './data'
import { Gallery } from './Gallery'
import { LifeStory, Timeline } from './LifeStory'
import { OfferingsCard } from './OfferingsCard'
import { Portrait } from './Portrait'
import { usePublicMemorial } from './queries'
import { TributeWall } from './TributeWall'
import './memorial.css'

export default function MemorialPage() {
  const { slug = '' } = useParams()
  const { data: memorial, isPending, error, refetch } = usePublicMemorial(slug)

  useEffect(() => {
    if (memorial) document.title = `${memorial.name} (${lifespan(memorial.born, memorial.died)}) | In memory | ${site.footerName}`
  }, [memorial])

  if (memorial) return <MemorialView memorial={memorial} />

  if (error instanceof ApiError && error.status === 404) {
    return (
      <main className="container status-page" id="main-content">
        <p className="eyebrow">Memorial</p>
        <h1>This memorial isn’t available</h1>
        <p className="muted">
          The address may have been typed incorrectly, or the family may have taken the page down. If you were sent
          this link, please ask them to check it.
        </p>
        <Link className="btn btn--primary" to={paths.home}>
          Back to the website
        </Link>
      </main>
    )
  }

  return (
    <main id="main-content">
      <div className="memorial-hero memorial-hero--loading" aria-hidden="true">
        <Skeleton round width={168} height={168} className="memorial-hero__skeleton" />
        <Skeleton width="min(420px, 70%)" height="2.6rem" className="memorial-hero__skeleton" />
        <Skeleton width="min(260px, 50%)" height="1.1rem" className="memorial-hero__skeleton" />
      </div>
      <div className="container memorial-body">
        <QueryState isPending={isPending} error={error} onRetry={() => void refetch()} noun="this memorial" skeleton />
      </div>
    </main>
  )
}

function MemorialView({ memorial }: { memorial: Memorial }) {
  const age = ageAtDeath(memorial.born, memorial.died)
  const url = `${window.location.origin}/memorials/${memorial.slug}`

  return (
    <main id="main-content" className="memorial">
      {!memorial.published && (
        <div className="memorial-preview" role="status">
          <Callout tone="warning">
            This is a private preview. Only you can see it until you publish it from the editor.
          </Callout>
        </div>
      )}

      <header className="memorial-hero">
        <div className="memorial-hero__inner">
          <Portrait memorial={memorial} size="lg" />
          <p className="memorial-hero__eyebrow">In loving memory</p>
          <h1>{memorial.name}</h1>
          <p className="memorial-hero__dates">
            {formatDay(memorial.born)} <span aria-hidden="true">·</span> {formatDay(memorial.died)}
          </p>
          <p className="memorial-hero__meta">
            {lifespan(memorial.born, memorial.died)}
            {age !== null && <> · Aged {age}</>}
            {memorial.location && <> · {memorial.location}</>}
          </p>
          {memorial.tagline && <p className="memorial-hero__tagline">“{memorial.tagline}”</p>}
        </div>
      </header>

      <div className="container memorial-body">
        <OfferingsCard memorial={memorial} />
        <LifeStory memorial={memorial} url={url} />
        <Timeline entries={memorial.timeline} />
        <Gallery photos={memorial.photos} name={memorial.name} />
        <TributeWall slug={memorial.slug} name={memorial.name} />

        <p className="memorial-report">
          Something not right on this page? <a href="mailto:care@example.invalid?subject=Memorial%20concern">Tell us</a> and we
          will look into it promptly.
        </p>
      </div>
    </main>
  )
}
