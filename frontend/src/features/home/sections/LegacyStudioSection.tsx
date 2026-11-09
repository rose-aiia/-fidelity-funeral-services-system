import { Link } from 'react-router-dom'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { paths } from '@/config/routes'

const features = [
  {
    title: 'Family History and Family Tree',
    text: 'Explore multiple generations, family member profiles, relationships, origins and historical events in one respectful place.',
  },
  {
    title: 'Family contributions and approvals',
    text: 'Invite relatives to contribute stories and photographs, with privacy controls and an approval process for shared records.',
  },
  {
    title: 'Connected remembrance records',
    text: 'Link family history to digital memorials and funeral records so memories, documents and tributes stay connected for future generations.',
  },
]

export function LegacyStudioSection() {
  return (
    <Section id="legacy-studio" soft>
      <SectionHead eyebrow="Family History & Family Tree" title="Preserve memories, family stories and life histories." />

      <div className="grid grid--3">
        {features.map((feature) => (
          <article className="card stack legacy-card" key={feature.title}>
            <div className="icon-tile" aria-hidden="true">
              ✧
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
      <div style={{ marginTop: 'var(--space-5)', display: 'flex', justifyContent: 'center' }}>
        <Link className="btn btn--primary" to={paths.accountFamilyHistory}>Open Family History and Family Tree</Link>
      </div>
    </Section>
  )
}
