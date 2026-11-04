import { Link } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { anchor } from '@/config/routes'
import './about.css'

// The wording on this page is Fidelity Life Assurance of Zimbabwe's own, from fidelitylife.co.zw/vision-mission-values.

const mission = ['Responsive financial solutions.', 'Superior customer experience.', 'Consistent and superior stakeholder returns.']

const values: { title: string; line: string; icon: IconName }[] = [
  { title: 'Teamwork', line: 'We win together.', icon: 'users' },
  { title: 'Integrity', line: 'Right things all the time.', icon: 'shield' },
  { title: 'Commitment', line: 'Exceeding expectations.', icon: 'check' },
  { title: 'Empathy', line: 'Understanding and fulfilling needs.', icon: 'heart' },
  { title: 'Recognition', line: 'Rewarding excellence.', icon: 'sparkle' },
]

export default function AboutPage() {
  return (
    <main id="main-content" className="about">
      <header className="about-hero" data-header-tone="dark" data-header-overlay>
        <div className="container about-hero__inner">
          <p className="eyebrow">Fidelity Life Assurance of Zimbabwe</p>
          <h1>Vision, mission and values</h1>
          <p className="about-hero__lead">
            Our vision, mission and values guide how we protect families, create lasting value, and support customers
            through every stage of life.
          </p>
        </div>
      </header>

      <div className="container about-body">
        <Reveal as="section" className="about-vision" aria-labelledby="vision-title">
          <p className="eyebrow" id="vision-title">
            Our vision
          </p>
          <blockquote>A life partner to a great financial legacy.</blockquote>
        </Reveal>

        <Reveal as="section" className="about-mission" aria-labelledby="mission-title">
          <div>
            <p className="eyebrow" id="mission-title">
              Our mission
            </p>
            <h2>We deliver value to our stakeholders through:</h2>
          </div>
          <ol>
            {mission.map((item, index) => (
              <li key={item}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                {item}
              </li>
            ))}
          </ol>
        </Reveal>

        <section className="about-values" aria-labelledby="values-title">
          <Reveal>
            <p className="eyebrow">What guides us</p>
            <h2 id="values-title">Our core values</h2>
            <p className="muted">The standards by which we serve, lead and grow.</p>
          </Reveal>
          <ul>
            {values.map((value, index) => (
              <Reveal as="li" key={value.title} index={index} className="about-value">
                <span className="about-value__icon">
                  <Icon name={value.icon} size={24} />
                </span>
                <h3>{value.title}</h3>
                <p>{value.line}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <Reveal className="about-cta">
          <h2>Protecting what matters most.</h2>
          <p>Reliable cover, flexible payment options and dedicated support to help you secure your future with confidence.</p>
          <Link to={anchor('quote-form')} className="btn btn--primary btn--lg">
            Get a funeral quote
          </Link>
        </Reveal>
      </div>
    </main>
  )
}
