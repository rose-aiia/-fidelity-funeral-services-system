import { Icon, type IconName } from '@/components/ui/Icon'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'

const services: { title: string; detail: string; icon: IconName }[] = [
  {
    title: 'Traditional funerals',
    detail: 'Full service coordination for wakes, church services, burial ceremonies and family support.',
    icon: 'shield',
  },
  {
    title: 'Cremation & memorial services',
    detail: 'Flexible memorial options with guided remembrance, keepsakes and family tribute spaces.',
    icon: 'candle',
  },
  {
    title: 'Repatriation support',
    detail: 'Documentation, transport coordination and diaspora guidance for families abroad.',
    icon: 'file',
  },
  {
    title: 'Cemetery guidance',
    detail: 'Plot search assistance, grave location support and local cemetery coordination.',
    icon: 'map',
  },
  {
    title: 'Digital memorials',
    detail: 'Life stories, photo galleries and virtual tributes to honour loved ones online.',
    icon: 'flower',
  },
  {
    title: 'Aftercare & estate help',
    detail: 'Task checklists, communication tools and post-funeral check-ins for relatives.',
    icon: 'heart',
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
              <Icon name={item.icon} size={22} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
