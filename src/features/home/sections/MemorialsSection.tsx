import { Icon } from '@/components/ui/Icon'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'

export function MemorialsSection() {
  return (
    <Section id="memorials">
      <SectionHead eyebrow="Smart cemetery & remembrance" title="Find burial context, honour memories and keep stories alive." />

      <div className="grid grid--2 memorial-grid">
        <article className="card stack memorial-card memorial-card--feature">
          <p className="tiny-label">Cemetery search</p>
          <h3>Locate nearby burial grounds and compare available plot guidance.</h3>
          <div className="search-box">
            <span>Search by town or area</span>
            <strong>Harare East</strong>
          </div>
          <ul>
            <li>4 cemetery matches</li>
            <li>2 plot enquiry requests</li>
            <li>Verified records by authorised operators</li>
          </ul>
        </article>

        <article className="card stack memorial-card">
          <p className="tiny-label">Virtual remembrance</p>
          <h3>Leave flowers, light a candle and share a personal tribute.</h3>
          <div className="tribute-row">
            <span>
              <Icon name="flower" size={16} /> 132 flowers
            </span>
            <span>
              <Icon name="candle" size={16} /> 48 candles
            </span>
            <span>
              <Icon name="chat" size={16} /> 21 messages
            </span>
          </div>
          <p className="muted">
            Sample memorial content is clearly labelled as a demonstration of a digital remembrance experience.
          </p>
        </article>
      </div>
    </Section>
  )
}
