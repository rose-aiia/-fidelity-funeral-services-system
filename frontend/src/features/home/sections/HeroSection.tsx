import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { anchor, paths } from '@/config/routes'
import { HeroArt } from './HeroArt'

const quickPaths: { icon: IconName; title: string; text: string; to: string }[] = [
  { icon: 'phone', title: 'Help right now', text: 'Speak to an adviser', to: anchor('quote-form') },
  { icon: 'shield', title: 'Funeral plans', text: 'Compare and get a quote', to: anchor('plans') },
  { icon: 'flower', title: 'Remembrance', text: 'A page for their story', to: anchor('memorials') },
  { icon: 'bag', title: 'Marketplace', text: 'Flowers, plaques, hire', to: paths.marketplace },
]

export function HeroSection() {
  // The photograph sits over the illustration; if it is missing or fails to load, the illustration shows.
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <section className="hero" id="top">
      <div className="hero__media" aria-hidden="true">
        <HeroArt />
        {!photoFailed && (
          <img
            className="hero__photo"
            src="/hero/hero.jpg"
            alt=""
            width={2400}
            height={1350}
            fetchPriority="high"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        )}
        <div className="hero__scrim" />
      </div>

      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">Funeral care across Zimbabwe</p>
          <h1>
            Honour every <em>story</em> with dignity, comfort and care.
          </h1>
          <p className="hero__lead">
            Cover, planning, burial, remembrance and aftercare in one place, for families at home and abroad.
          </p>
          <div className="hero__actions">
            <Link to={anchor('quote-form')} className="btn btn--primary btn--lg">
              Get funeral assistance
            </Link>
            <Link to={anchor('plans')} className="btn btn--outline btn--lg hero__ghost">
              Explore funeral plans
            </Link>
          </div>
        </div>
      </div>

      <nav className="hero__paths" aria-label="Quick links">
        <ul className="container hero__paths-list">
          {quickPaths.map((item) => (
            <li key={item.title}>
              <Link to={item.to} className="hero__path">
                <span className="hero__path-icon">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="hero__path-text">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
                <Icon name="arrow-right" size={16} className="hero__path-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
