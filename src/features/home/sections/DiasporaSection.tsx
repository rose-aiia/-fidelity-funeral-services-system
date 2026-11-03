import { CheckList } from '@/components/ui/CheckList'
import { Section } from '@/components/ui/Section'

const steps = ['Document check', 'Transport planning', 'Family updates']

export function DiasporaSection() {
  return (
    <Section id="diaspora" soft containerClassName="split">
      <div className="diaspora-copy stack">
        <p className="eyebrow">Repatriation & diaspora</p>
        <h2>Support that travels with families.</h2>
        <p>
          Whether a family is coordinating a funeral across Zimbabwe or with loved ones abroad, the prototype demonstrates sensitive guidance for documentation, transport planning and family communication.
        </p>
        <CheckList
          items={[
            'Arrangement support for local and international families',
            'Digital document tracking and coordination reminders',
            'Airport and transport handover timelines',
          ]}
        />
      </div>

      <div className="card stack spotlight-card">
        <div className="spotlight-card__header">
          <span className="badge badge--neutral">Repatriation support</span>
          <h3>Journey planning overview</h3>
        </div>
        <div className="mini-steps">
          {steps.map((step, index) => (
            <div key={step}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
