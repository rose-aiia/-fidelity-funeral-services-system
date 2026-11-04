import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { anchor, paths } from '@/config/routes'

type Pathway = { icon: IconName; title: string; description: string; to: string; cta: string }

const featured: Pathway = {
  icon: 'phone',
  title: 'Someone has passed away',
  description: 'Tell us where you are and what you need. An adviser calls you back, and we take the first steps with you.',
  to: anchor('quote-form'),
  cta: 'Get help now',
}

const pathways: Pathway[] = [
  { icon: 'file', title: 'Plan ahead', description: 'Compare plans and get a quote for your family.', to: anchor('plans'), cta: 'See plans' },
  { icon: 'flower', title: 'Remember them', description: 'A memorial page, and help finding a cemetery or plot.', to: anchor('memorials'), cta: 'Start a memorial' },
  { icon: 'bag', title: 'Flowers and more', description: 'Wreaths, plaques, stationery and hire, delivered.', to: paths.marketplace, cta: 'Browse' },
  { icon: 'heart', title: 'After the service', description: 'Checklists and support for the weeks that follow.', to: anchor('support'), cta: 'Get support' },
]

export function PathwaysSection() {
  return (
    <Section id="needs">
      <Reveal>
        <SectionHead eyebrow="Where would you like to start?" title="Start wherever you are." />
      </Reveal>

      <div className="pathways">
        <Reveal className="pathways__featured-wrap">
          <Link to={featured.to} className="pathway pathway--featured">
            <span className="pathway__icon">
              <Icon name={featured.icon} size={28} />
            </span>
            <h3>{featured.title}</h3>
            <p>{featured.description}</p>
            <span className="pathway__cta">
              {featured.cta} <Icon name="arrow-right" size={18} />
            </span>
          </Link>
        </Reveal>

        {pathways.map((item, index) => (
          <Reveal key={item.title} index={index + 1}>
            <Link to={item.to} className="pathway">
              <span className="pathway__icon">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="pathway__cta">
                {item.cta} <Icon name="arrow-right" size={16} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
