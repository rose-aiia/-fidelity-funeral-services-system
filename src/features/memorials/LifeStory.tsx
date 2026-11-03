import { Icon } from '@/components/ui/Icon'
import { formatServiceTime } from '@/lib/format'
import { biographyParagraphs, type Memorial, type TimelineEntry } from './data'
import { ShareActions } from './ShareActions'

export function LifeStory({ memorial, url }: { memorial: Memorial; url: string }) {
  const paragraphs = biographyParagraphs(memorial.biography)
  const { service } = memorial

  return (
    <section className="memorial-section" aria-labelledby="story-title">
      <p className="eyebrow">Their story</p>
      <h2 id="story-title" className="memorial-section__title">
        A life remembered
      </h2>

      <div className="story">
        <div className="story__text">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className="muted">The family hasn’t shared {memorial.name.split(' ')[0]}’s story yet.</p>
          )}
        </div>

        <aside className="story__aside">
          {service && (
            <div className="card service">
              <p className="eyebrow">Service details</p>
              <ul className="service__list">
                <li>
                  <Icon name="calendar" size={18} />
                  <span>{formatServiceTime(service.date)}</span>
                </li>
                <li>
                  <Icon name="home" size={18} />
                  <span>
                    <strong>{service.venue}</strong>
                    {service.address && <span className="muted">{service.address}</span>}
                  </span>
                </li>
              </ul>
              {service.note && <p className="service__note">{service.note}</p>}
            </div>
          )}

          <div className="card service">
            <p className="eyebrow">Share this memorial</p>
            <p className="muted">Let friends and family know where they can remember {memorial.name.split(' ')[0]}.</p>
            <ShareActions name={memorial.name} url={url} />
          </div>
        </aside>
      </div>
    </section>
  )
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null

  return (
    <section className="memorial-section" aria-labelledby="timeline-title">
      <p className="eyebrow">Timeline</p>
      <h2 id="timeline-title" className="memorial-section__title">
        Moments along the way
      </h2>

      <ol className="timeline">
        {entries.map((entry, index) => (
          <li key={entry.id} className="timeline__entry reveal" style={{ '--i': Math.min(index, 6) } as React.CSSProperties}>
            <span className="timeline__year">{entry.year}</span>
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__body">
              <h3>{entry.title}</h3>
              {entry.text && <p>{entry.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
