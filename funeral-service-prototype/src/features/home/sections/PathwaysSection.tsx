import { Link } from 'react-router-dom'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { anchor } from '@/config/routes'

const pathways = [
  {
    icon: '🕊️',
    title: 'Immediate support',
    description: 'Urgent funeral assistance, transport coordination and compassionate next steps.',
  },
  {
    icon: '📋',
    title: 'Plan a funeral',
    description: 'Compare service packages, request a quotation and outline your wishes.',
  },
  {
    icon: '🪦',
    title: 'Cemetery & plots',
    description: 'Search local burial grounds, compare plot availability and enquire about graves.',
  },
  {
    icon: '💬',
    title: 'Memories & legacy',
    description: 'Create a digital memorial, upload photos and invite family contributions.',
  },
  {
    icon: '🛍️',
    title: 'Marketplace',
    description: 'Browse memorial products, flowers, stationery and funeral service partners.',
  },
  {
    icon: '🤝',
    title: 'Family aftercare',
    description: 'Track tasks, share messages and stay supported after the service has ended.',
  },
]

export function PathwaysSection() {
  return (
    <Section id="needs">
      <SectionHead eyebrow="What do you need help with?" title="Choose the path that matches your moment." />

      <div className="grid grid--3">
        {pathways.map((item) => (
          <Link to={anchor('quote-form')} className="card card--interactive stack pathway-card" key={item.title}>
            <span className="icon-tile icon-tile--lg" aria-hidden="true">
              {item.icon}
            </span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span className="pathway-card__link">Get started →</span>
          </Link>
        ))}
      </div>
    </Section>
  )
}
