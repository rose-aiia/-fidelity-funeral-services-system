import { useState } from 'react'
import { Link } from 'react-router-dom'
import { anchor } from '@/config/routes'
import { HeroArt } from './HeroArt'

export function HeroSection() {
  // The family photograph is a framed figure beside the headline; if it fails to load the hero is just the headline.
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <section className="hero" id="top" data-header-tone="dark" data-header-overlay>
      <div className="hero__media" aria-hidden="true">
        <HeroArt />
        <div className="hero__scrim" />
      </div>

      {!photoFailed && (
        <figure className="hero__figure">
          <img
            src="/hero/family.jpg"
            alt="A family looking out together as the sun sets"
            width={750}
            height={376}
            fetchPriority="high"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        </figure>
      )}

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
    </section>
  )
}
