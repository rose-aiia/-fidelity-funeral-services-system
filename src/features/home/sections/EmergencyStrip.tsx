import { Link } from 'react-router-dom'
import { anchor } from '@/config/routes'

export function EmergencyStrip() {
  return (
    <section className="emergency-strip" aria-label="Emergency support details">
      <div className="container emergency-strip__inner">
        <div>
          <p className="eyebrow">Immediate assistance</p>
          <h2>Need help today? Speak to a funeral care adviser.</h2>
        </div>
        <div>
          <p>
            For urgent arrangements, repatriation inquiries or cemetery guidance, our support team can help families navigate the next steps with care and clarity.
          </p>
        </div>
        <Link to={anchor('quote-form')} className="btn btn--deep btn--lg">
          Call support line
        </Link>
      </div>
    </section>
  )
}
