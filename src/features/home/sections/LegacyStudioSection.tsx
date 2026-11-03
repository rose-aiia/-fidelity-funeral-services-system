import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'

const features = [
  'Photo albums and audio memories',
  'Life-history timeline and biography drafting',
  'Family contributions and permission controls',
]

export function LegacyStudioSection() {
  return (
    <Section id="legacy-studio" soft>
      <SectionHead eyebrow="Life Legacy Studio" title="Preserve memories, family stories and life histories." />

      <div className="grid grid--3">
        {features.map((feature) => (
          <article className="card stack legacy-card" key={feature}>
            <div className="icon-tile" aria-hidden="true">
              ✧
            </div>
            <h3>{feature}</h3>
            <p>
              A respectful archive designed to compile approved memories, voice notes and family details into a meaningful legacy record.
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}
