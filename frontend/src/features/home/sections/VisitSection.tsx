import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { contact } from '@/config/site'

/** Where the company is, with its head office: a real place makes the rest of the page easier to trust. */
export function VisitSection() {
  return (
    <Section id="visit" soft containerClassName="visit">
      <Reveal className="visit__photo">
        <img
          src="/brand/head-office.jpg"
          alt="Fidelity House, the Fidelity Life head office on Julius Nyerere Way in Harare"
          width={1024}
          height={903}
          loading="lazy"
          decoding="async"
        />
      </Reveal>

      <Reveal className="visit__body" index={1}>
        <p className="eyebrow">Visit or call us</p>
        <h2>Prefer to talk to someone in person?</h2>
        <p className="muted">
          Our head office, Fidelity House, is in the centre of Harare. Call any time, or write to us and a person will reply.
        </p>

        <ul className="visit__list">
          <li>
            <Icon name="map" size={20} />
            <span>{contact.address.join(', ')}</span>
          </li>
          <li>
            <Icon name="phone" size={20} />
            <span>
              <a href={contact.phoneHref}>{contact.phone}</a>
              <small>Toll free: <a href={contact.tollFreeHref}>{contact.tollFree}</a></small>
            </span>
          </li>
          <li>
            <Icon name="chat" size={20} />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </li>
        </ul>

        <div className="visit__actions">
          <a className="btn btn--primary" href={contact.tollFreeHref}>
            <Icon name="phone" size={18} />
            Call toll free
          </a>
          <a className="btn btn--outline" href={`mailto:${contact.email}`}>
            Email us
          </a>
        </div>
      </Reveal>
    </Section>
  )
}
