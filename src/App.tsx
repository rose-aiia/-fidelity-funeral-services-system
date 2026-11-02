import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Plan = {
  name: string
  price: number
  description: string
  features: string[]
  popular?: boolean
}

type FaqItem = {
  question: string
  answer: string
}

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

const plans: Plan[] = [
  {
    name: 'Essential',
    price: 4200,
    description: 'Simple, respectful coverage for a dignified family farewell.',
    features: ['Ceremony coordination', 'Transport and care', 'Memorial booklet', 'Family support checklist'],
  },
  {
    name: 'Comfort',
    price: 7800,
    description: 'Balanced package with broader service support and remembrance options.',
    features: ['Everything in Essential', 'Enhanced venue support', 'Digital memorial page', 'Grave enquiry support'],
    popular: true,
  },
  {
    name: 'Legacy',
    price: 12600,
    description: 'Premium plan with remembrance, family collaboration and additional care features.',
    features: ['Everything in Comfort', 'Cemetery plot guidance', 'Life Legacy Studio access', 'Priority aftercare coordination'],
  },
]

const marketplaceCategories = ['All', 'Memorial', 'Flowers', 'Services', 'Venue', 'Media']

const marketplaceItems = [
  {
    category: 'Memorial',
    title: 'Granite remembrance plaque',
    description: 'Hand-finished headstone options with personalised engraving and family wording.',
    price: 'US$420',
    accent: '✦',
  },
  {
    category: 'Flowers',
    title: 'Wreath & sympathy package',
    description: 'Fresh floral arrangements for church services, graveside ceremonies and family spaces.',
    price: 'US$180',
    accent: '❀',
  },
  {
    category: 'Services',
    title: 'Repatriation coordination',
    description: 'Trusted transport and document guidance for families arranging funerals across borders.',
    price: 'US$1,200',
    accent: '✈',
  },
  {
    category: 'Venue',
    title: 'Marquee & seating hire',
    description: 'Chairs, canopies and guest comfort packages for gatherings and memorial venues.',
    price: 'US$680',
    accent: '▣',
  },
  {
    category: 'Media',
    title: 'Memorial video tribute',
    description: 'A professionally composed tribute video built from family photos, voice notes and stories.',
    price: 'US$340',
    accent: '◉',
  },
  {
    category: 'Services',
    title: 'Programme & stationery pack',
    description: 'Printed funeral programmes, keepsakes and order-of-service stationery for the ceremony.',
    price: 'US$260',
    accent: '✎',
  },
]

const faqs: FaqItem[] = [
  {
    question: 'Are these sample quotes and prices live?',
    answer:
      'No. All figures are demonstration values for the prototype. Final pricing, cemetery availability and service terms must be confirmed by licensed providers and authorised cemetery operators.',
  },
  {
    question: 'Can families create a digital memorial?',
    answer:
      'Yes. The prototype shows how families could upload photographs, memories and tribute messages, then invite selected relatives to contribute to a shared memorial album.',
  },
  {
    question: 'Does the AI support tool replace therapy?',
    answer:
      'No. The concept is presented as a supportive resource for reflection and information, with clear direction to professional counselling and human support when needed.',
  },
  {
    question: 'What is included in the provider dashboard?',
    answer:
      'The dashboard demonstrates service administration, customer enquiries, funeral schedule tracking and listing management for approved provider staff only.',
  },
]

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('Comfort')
  const [serviceType, setServiceType] = useState('Traditional burial')
  const [location, setLocation] = useState('Harare')
  const [marketplaceFilter, setMarketplaceFilter] = useState('All')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [submitted, setSubmitted] = useState(false)
  const [currentView, setCurrentView] = useState<'home' | 'provider'>(() => (
    typeof window !== 'undefined' && window.location.hash === '#/provider-portal' ? 'provider' : 'home'
  ))

  useEffect(() => {
    const syncView = () => {
      const nextView = window.location.hash === '#/provider-portal' ? 'provider' : 'home'
      setCurrentView(nextView)
    }

    syncView()
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])

  const activePlan = useMemo(
    () => plans.find((plan) => plan.name === selectedPlan) ?? plans[0],
    [selectedPlan],
  )

  const filteredMarketplace = useMemo(
    () =>
      marketplaceFilter === 'All'
        ? marketplaceItems
        : marketplaceItems.filter((item) => item.category === marketplaceFilter),
    [marketplaceFilter],
  )

  const estimate = useMemo(() => {
    const destinationAdjustment =
      location === 'Harare' ? 1200 : location === 'Bulawayo' ? 1500 : location === 'Mutare' ? 1400 : location === 'Gweru' ? 1300 : 1700
    const serviceAdjustment =
      serviceType === 'Repatriation support' ? 2600 : serviceType === 'Cemetery planning' ? 1900 : 0

    return activePlan.price + destinationAdjustment + serviceAdjustment
  }, [activePlan, location, serviceType])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    window.setTimeout(() => setSubmitted(false), 3000)
  }

  if (currentView === 'provider') {
    return (
      <div className="site-shell provider-page">
        <header className="site-header">
          <div className="container site-header__inner">
            <a href="#/" className="brand" aria-label="Fidelity Life home">
              <span className="brand__mark" aria-hidden="true">
                <img src="/fidelity-life-logo.svg" alt="Fidelity Life logo" />
              </span>
              <span className="brand__text">
                Fidelity Life Assurance of Zimbabwe
                <small>Provider portal</small>
              </span>
            </a>

            <div className="site-header__actions">
              <a className="btn btn--outline btn--sm" href="#/">
                Back to home
              </a>
            </div>
          </div>
        </header>

        <main className="container section provider-page__content" id="main-content">
          <div className="section-head section-head--left">
            <p className="eyebrow">Provider portal</p>
            <h2>Operational support for funeral professionals.</h2>
          </div>

          <div className="provider-layout provider-layout--page">
            <div className="provider-copy">
              <p>
                Review service requests, coordinate arrangements, track urgent follow-ups and keep family communication organised in one place.
              </p>
              <ul className="check-list">
                <li>Service request queue and arrangement tracking</li>
                <li>Approved staff access and role-specific updates</li>
                <li>Family memorial milestones and callback reminders</li>
              </ul>
            </div>

            <div className="card dashboard-card">
              <div className="dashboard-card__row">
                <span>New enquiries</span>
                <strong>26</strong>
              </div>
              <div className="dashboard-card__row">
                <span>Pending follow-ups</span>
                <strong>11</strong>
              </div>
              <div className="dashboard-card__row">
                <span>Family memorials</span>
                <strong>14</strong>
              </div>
              <div className="dashboard-card__row dashboard-card__row--alert">
                <span>Urgent support requests</span>
                <strong>3</strong>
              </div>
            </div>
          </div>

          <section className="provider-panel panel-grid">
            <div className="card provider-panel">
              <div className="provider-panel__row">
                <span>This week</span>
                <strong>18 funerals</strong>
              </div>
              <div className="provider-panel__row">
                <span>Completed services</span>
                <strong>92%</strong>
              </div>
              <div className="provider-panel__row">
                <span>Response time</span>
                <strong>4.2 hrs</strong>
              </div>
            </div>

            <div className="card provider-panel">
              <div className="provider-panel__row provider-panel__row--alert">
                <span>Need attention</span>
                <strong>3 cases</strong>
              </div>
              <div className="provider-panel__row">
                <span>Family check-ins</span>
                <strong>14 sent</strong>
              </div>
              <div className="provider-panel__row">
                <span>Payments due</span>
                <strong>US$6,200</strong>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header" style={{ background: '#1A1A1A', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div className="container site-header__inner" style={{ height: '5rem', alignItems: 'center', gap: '2rem', paddingLeft: 0, paddingRight: 0 }}>
          <a href="#top" className="brand" aria-label="Fidelity Life home" style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="brand__mark" aria-hidden="true" style={{ width: '8rem', height: '2.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden' }}>
              <img src="/fidelity-life-logo.svg" alt="Fidelity Life logo" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
            </span>
            <span className="brand__text" style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '0.01em', color: '#FFFFFF' }}>
              Fidelity Life Assurance of Zimbabwe
            </span>
          </a>

          <nav className={`site-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Main navigation" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ul style={{ display: 'flex', alignItems: 'center', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><a href="#services" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500, fontSize: '0.96rem' }}>Services</a></li>
              <li><a href="#plans" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500, fontSize: '0.96rem' }}>Plans</a></li>
              <li><a href="#memorials" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500, fontSize: '0.96rem' }}>Memorials</a></li>
              <li><a href="#support" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500, fontSize: '0.96rem' }}>Support</a></li>
            </ul>
            <a
              className="btn btn--light btn--sm"
              href="#quote-form"
              style={{
                background: '#C1272D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 700,
                padding: '0.625rem 1.5rem',
                minHeight: '2.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Request a quote
            </a>
          </nav>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{ display: 'none' }}
          >
            Menu
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="container hero__inner hero__inner--split">
            <div className="hero__content hero__content--left">
              <span className="badge badge--navy">Compassionate guidance • Sample prototype</span>
              <h1>Honor every story with dignity, comfort, and care.</h1>
              <p className="hero__lead">
                Integrated funeral support for planning, burial services, remembrance and family aftercare across Zimbabwe.
              </p>
              <div className="hero__actions">
                <a href="#quote-form" className="btn btn--primary btn--lg">
                  Get funeral assistance
                </a>
                <a href="#plans" className="btn btn--navy btn--lg">
                  Explore funeral plans
                </a>
              </div>
            </div>

            <div className="hero__panel hero__panel--shifted card" aria-label="How we can help overview">
              <div className="hero-panel__top">
                <div>
                  <p className="eyebrow eyebrow--dark">How We Can Help</p>
                  <h3>Compassionate guidance</h3>
                </div>
              </div>
              <ul className="help-links">
                <li><a href="#plans">Funeral plans</a></li>
                <li><a href="#memorials">Digital remembrance</a></li>
                <li><a href="#needs">Burial plot guidance</a></li>
                <li><a href="#support">Aftercare & support</a></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="emergency-strip" aria-label="Emergency support details">
          <div className="container emergency-strip__inner">
            <div>
              <p className="emergency-strip__eyebrow">Immediate assistance</p>
              <h2>Need help today? Speak to a funeral care adviser.</h2>
            </div>
            <div>
              <p>
                For urgent arrangements, repatriation inquiries or cemetery guidance, our support team can help families navigate the next steps with care and clarity.
              </p>
            </div>
            <a href="#quote-form" className="btn btn--brick btn--lg">
              Call support line
            </a>
          </div>
        </section>

        <section className="section" id="needs">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">What do you need help with?</p>
              <h2>Choose the path that matches your moment.</h2>
            </div>

            <div className="grid grid--3">
              {pathways.map((item) => (
                <a href="#quote-form" className="card pathway-card" key={item.title}>
                  <span className="pathway-card__icon" aria-hidden="true">{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="pathway-card__link">Get started →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft" id="services">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Funeral services</p>
              <h2>Personalised support for every stage of the journey.</h2>
            </div>

            <div className="grid grid--3">
              {services.map((item) => (
                <article className="card service-card" key={item.title}>
                  <div className="service-card__icon" aria-hidden="true">✦</div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="plans">
          <div className="container plan-layout">
            <div className="plan-layout__content">
              <div className="section-head section-head--left">
                <p className="eyebrow">Funeral plans</p>
                <h2>Sample plans and quotation guidance.</h2>
              </div>

              <div className="grid grid--3 plan-grid">
                {plans.map((plan) => (
                  <button
                    type="button"
                    key={plan.name}
                    className={`card plan-card ${selectedPlan === plan.name ? 'plan-card--selected' : ''} ${plan.popular ? 'plan-card--popular' : ''}`}
                    onClick={() => setSelectedPlan(plan.name)}
                    aria-pressed={selectedPlan === plan.name}
                  >
                    {plan.popular && <span className="badge badge--gold">Most chosen</span>}
                    <div className="plan-card__header">
                      <h3>{plan.name}</h3>
                      <div className="plan-card__price">
                        US${plan.price.toLocaleString()}
                        <small>starting estimate</small>
                      </div>
                    </div>
                    <p>{plan.description}</p>
                    <ul>
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            <aside className="card quote-card" id="quote-form">
              <div className="quote-card__header">
                <p className="eyebrow">Quick quotation</p>
                <h3>Request a sample arrangement estimate</h3>
              </div>

              <form onSubmit={handleSubmit} className="quote-form">
                <label className="field">
                  <span>Service type</span>
                  <select
                    className="select"
                    value={serviceType}
                    onChange={(event) => setServiceType(event.target.value)}
                  >
                    <option>Traditional burial</option>
                    <option>Repatriation support</option>
                    <option>Cemetery planning</option>
                    <option>Memorial only</option>
                  </select>
                </label>

                <label className="field">
                  <span>Location</span>
                  <select
                    className="select"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  >
                    <option>Harare</option>
                    <option>Bulawayo</option>
                    <option>Mutare</option>
                    <option>Gweru</option>
                    <option>Chitungwiza</option>
                  </select>
                </label>

                <label className="field">
                  <span>Plan selected</span>
                  <input className="input" value={activePlan.name} readOnly aria-readonly="true" />
                </label>

                <div className="quote-summary">
                  <span>Estimated total</span>
                  <strong>US${estimate.toLocaleString()}</strong>
                </div>

                <button type="submit" className="btn btn--primary btn--lg w-100">
                  Submit sample enquiry
                </button>
              </form>
            </aside>
          </div>
        </section>

        <section className="section section--soft" id="diaspora">
          <div className="container diaspora-layout">
            <div className="diaspora-copy">
              <p className="eyebrow">Repatriation & diaspora</p>
              <h2>Support that travels with families.</h2>
              <p>
                Whether a family is coordinating a funeral across Zimbabwe or with loved ones abroad, the prototype demonstrates sensitive guidance for documentation, transport planning and family communication.
              </p>
              <ul className="check-list">
                <li>Arrangement support for local and international families</li>
                <li>Digital document tracking and coordination reminders</li>
                <li>Airport and transport handover timelines</li>
              </ul>
            </div>

            <div className="card spotlight-card">
              <div className="spotlight-card__header">
                <span className="badge badge--navy">Repatriation support</span>
                <h3>Journey planning overview</h3>
              </div>
              <div className="mini-steps">
                <div>
                  <strong>01</strong>
                  <span>Document check</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Transport planning</span>
                </div>
                <div>
                  <strong>03</strong>
                  <span>Family updates</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="memorials">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Smart cemetery & remembrance</p>
              <h2>Find burial context, honour memories and keep stories alive.</h2>
            </div>

            <div className="grid grid--2 memorial-grid">
              <article className="card memorial-card memorial-card--feature">
                <p className="tiny-label">Cemetery search</p>
                <h3>Locate nearby burial grounds and compare available plot guidance.</h3>
                <div className="search-box">
                  <span>Search by town or area</span>
                  <strong>Harare East</strong>
                </div>
                <ul>
                  <li>4 cemetery matches</li>
                  <li>2 plot enquiry requests</li>
                  <li>Verified records by authorised operators</li>
                </ul>
              </article>

              <article className="card memorial-card">
                <p className="tiny-label">Virtual remembrance</p>
                <h3>Leave flowers, light a candle and share a personal tribute.</h3>
                <div className="tribute-row">
                  <span>💐 132 flowers</span>
                  <span>🕯️ 48 candles</span>
                  <span>💬 21 messages</span>
                </div>
                <p className="muted">
                  Sample memorial content is clearly labelled as a demonstration of a digital remembrance experience.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--soft" id="legacy-studio">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Life Legacy Studio</p>
              <h2>Preserve memories, family stories and life histories.</h2>
            </div>

            <div className="grid grid--3">
              {[
                'Photo albums and audio memories',
                'Life-history timeline and biography drafting',
                'Family contributions and permission controls',
              ].map((item) => (
                <article className="card legacy-card" key={item}>
                  <div className="legacy-card__icon" aria-hidden="true">✧</div>
                  <h3>{item}</h3>
                  <p>
                    A respectful archive designed to compile approved memories, voice notes and family details into a meaningful legacy record.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="marketplace">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Marketplace</p>
              <h2>Browse funeral-related products and provider services.</h2>
            </div>

            <div className="marketplace-filters" aria-label="Marketplace category filters">
              {marketplaceCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`chip ${marketplaceFilter === category ? 'chip--active' : ''}`}
                  onClick={() => setMarketplaceFilter(category)}
                  aria-pressed={marketplaceFilter === category}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="marketplace-grid">
              {filteredMarketplace.map((item) => (
                <article key={item.title} className="card marketplace-card">
                  <div className="marketplace-card__top">
                    <span className="marketplace-card__badge">{item.category}</span>
                    <span className="marketplace-card__price">{item.price}</span>
                  </div>
                  <div className="marketplace-card__icon" aria-hidden="true">{item.accent}</div>
                  <div className="marketplace-card__body">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="marketplace-card__footer">
                    <span>Request quote</span>
                    <button type="button" className="btn btn--outline btn--sm">Enquire</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft" id="provider-portal">
          <div className="container provider-layout">
            <div className="provider-copy">
              <p className="eyebrow">Provider portal</p>
              <h2>Operational support for funeral professionals.</h2>
              <p>
                This concept demonstrates how authorised providers can review quotations, manage service requests, update family communications and maintain listing information.
              </p>
              <ul className="check-list">
                <li>Service request queue and arrangement tracking</li>
                <li>Family enquiry follow-up tools</li>
                <li>Approved staff access with defined visibility controls</li>
              </ul>
            </div>

            <div className="card dashboard-card">
              <div className="dashboard-card__row">
                <span>New enquiries</span>
                <strong>26</strong>
              </div>
              <div className="dashboard-card__row">
                <span>Pending follow-ups</span>
                <strong>11</strong>
              </div>
              <div className="dashboard-card__row">
                <span>Family memorials</span>
                <strong>14</strong>
              </div>
              <div className="dashboard-card__row dashboard-card__row--alert">
                <span>Urgent support requests</span>
                <strong>3</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="support">
          <div className="container support-layout">
            <div className="support-copy">
              <p className="eyebrow">AI assistance & aftercare</p>
              <h2>Responsible digital support for families and communities.</h2>
              <p>
                The optional AI assistant offers guidance on grief resources, journaling prompts and remembrance exercises while clearly identifying AI-generated content and pointing users to professional help when needed.
              </p>
            </div>

            <div className="card ai-card" aria-label="Sample AI grief support assistant">
              <div className="ai-bubble ai-bubble--assistant">
                I’m here to help with practical support, remembrance ideas and grief resources. Would you like a checklist for the next 48 hours?
              </div>
              <div className="ai-bubble ai-bubble--user">
                Please suggest simple steps for my family and remembrance ideas.
              </div>
            </div>
          </div>
        </section>

        <section className="section section--soft" id="faq">
          <div className="container faq-layout">
            <div className="section-head section-head--left">
              <p className="eyebrow">FAQs</p>
              <h2>Helpful clarity for families and providers.</h2>
            </div>

            <div className="faq-list" aria-label="Frequently asked questions">
              {faqs.map((faq, index) => (
                <div className="accordion-item" key={faq.question}>
                  <button
                    type="button"
                    className="accordion-trigger"
                    onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                    aria-expanded={openFaq === index}
                  >
                    <span>{faq.question}</span>
                    <span aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
                  </button>
                  {openFaq === index && <div className="accordion-panel">{faq.answer}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="brand brand--footer">
              <span className="brand__mark" aria-hidden="true">
                <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                  <circle cx="32" cy="32" r="30" fill="rgba(244,236,219,0.9)" />
                  <path d="M32 10c-9 0-16 7-16 16 0 9 6 17 14 20v8h4v-8c8-3 14-11 14-20 0-9-7-16-16-16zm0 5c6 0 11 5 11 11 0 5-3 9-8 10.5V39h-6v-2.5C24 35 21 31 21 26c0-6 5-11 11-11zm-5 25h10v4H27v-4z" fill="#f5eedd" />
                </svg>
              </span>
              <span className="brand__text">
                Zimbabwe Funeral Service
                <small>Funeral services</small>
              </span>
            </div>
            <p>
              A prototype for compassionate, culturally aware funeral support, remembrance services and family-focused aftercare in Zimbabwe.
            </p>
          </div>

          <div>
            <h3>Explore</h3>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#plans">Plans</a></li>
              <li><a href="#memorials">Remembrance</a></li>
            </ul>
          </div>

          <div>
            <h3>Support</h3>
            <ul>
              <li><a href="#diaspora">Repatriation</a></li>
              <li><a href="#support">AI support</a></li>
              <li><a href="#faq">FAQs</a></li>
            </ul>
          </div>

          <div>
            <h3>Sample notice</h3>
            <ul>
              <li><a href="#quote-form">Request a sample quote</a></li>
              <li><a href="#/provider-portal">Provider concept</a></li>
              <li><a href="#top">Demo prototype</a></li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 Zimbabwe Funeral Service — Demonstration prototype</span>
          <span>Privacy-conscious, compassionate and clearly labelled sample content</span>
        </div>
      </footer>

      {submitted && (
        <div className="toast" role="status" aria-live="polite">
          Sample enquiry submitted. A provider adviser would follow up with a formal quotation.
        </div>
      )}
    </div>
  )
}

export default App
