import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { anchor } from '@/config/routes'

const services = [
  { title: 'Traditional funerals', detail: 'Wakes, church services and burial, coordinated from the first call to the last hymn.' },
  { title: 'Cremation and memorial services', detail: 'Flexible options, with guided remembrance and keepsakes for the family.' },
  { title: 'Repatriation', detail: 'Paperwork, transport and clear guidance for families abroad.' },
  { title: 'Cemetery guidance', detail: 'Help finding a plot, locating a grave and working with the cemetery.' },
  { title: 'Digital memorials', detail: 'A life story, photographs and tributes that relatives can visit from anywhere.' },
  { title: 'Aftercare and estate help', detail: 'Practical checklists and check-ins once the service is over.' },
]

export function ServicesSection() {
  return (
    <Section id="services" soft containerClassName="services">
      <Reveal className="services__intro">
        <p className="eyebrow">What we arrange</p>
        <h2>Everything a funeral asks of a family, handled with you.</h2>
        <p className="muted">
          You decide what matters. We take care of the calls, the paperwork and the logistics around it.
        </p>
        <Link to={anchor('plans')} className="link-arrow">
          See how plans work <Icon name="arrow-right" size={16} />
        </Link>
      </Reveal>

      <ol className="services__list">
        {services.map((item, index) => (
          <Reveal as="li" key={item.title} index={index} className="services__item">
            <span className="services__num" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
