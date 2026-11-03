import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'

const services = [
  {
    title: 'Traditional funerals',
    detail: 'Full service coordination for wakes, church services, burial ceremonies and family support.',
  },
  {
    title: 'Cremation & memorial services',
    detail: 'Flexible memorial options with guided remembrance, keepsakes and family tribute spaces.',
  },
  {
    title: 'Repatriation support',
    detail: 'Documentation, transport coordination and diaspora guidance for families abroad.',
  },
  {
    title: 'Cemetery guidance',
    detail: 'Plot search assistance, grave location support and local cemetery coordination.',
  },
  {
    title: 'Digital memorials',
    detail: 'Life stories, photo galleries and virtual tributes to honour loved ones online.',
  },
  {
    title: 'Aftercare & estate help',
    detail: 'Task checklists, communication tools and post-funeral check-ins for relatives.',
  },
]

export function ServicesSection() {
  return (
    <Section id="services" soft>
      <SectionHead eyebrow="Funeral services" title="Personalised support for every stage of the journey." />

      <div className="grid grid--3">
        {services.map((item) => (
          <article className="card stack service-card" key={item.title}>
            <div className="icon-tile" aria-hidden="true">
              ✦
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
