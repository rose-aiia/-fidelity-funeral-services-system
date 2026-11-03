import { Link } from 'react-router-dom'
import { anchor } from '@/config/routes'

const helpLinks = [
  { label: 'Funeral plans', to: anchor('plans') },
  { label: 'Digital remembrance', to: anchor('memorials') },
  { label: 'Burial plot guidance', to: anchor('needs') },
  { label: 'Aftercare & support', to: anchor('support') },
]

export function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="badge badge--neutral">Compassionate guidance • Sample prototype</span>
          <h1>Honor every story with dignity, comfort, and care.</h1>
          <p className="hero__lead">
            Integrated funeral support for planning, burial services, remembrance and family aftercare across Zimbabwe.
          </p>
          <div className="hero__actions">
            <Link to={anchor('quote-form')} className="btn btn--primary btn--lg">
              Get funeral assistance
            </Link>
            <Link to={anchor('plans')} className="btn btn--dark btn--lg">
              Explore funeral plans
            </Link>
          </div>
        </div>

        <div className="card hero__panel" aria-label="How we can help overview">
          <p className="eyebrow">How We Can Help</p>
          <h3>Compassionate guidance</h3>
          <ul className="help-links">
            {helpLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
