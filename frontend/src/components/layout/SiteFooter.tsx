import { Link } from 'react-router-dom'
import { paths } from '@/config/routes'
import { contact, footerColumns, site } from '@/config/site'
import { Brand } from './Brand'

export function SiteFooter() {
  return (
    <footer className="site-footer" data-header-tone="dark">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand to={paths.home} />
          <p className="footer-tagline">Protecting what matters most.</p>
          <address className="footer-contact">
            <span>{contact.address.join(', ')}</span>
            <a href={contact.phoneHref}>{contact.phone}</a>
            <a href={contact.tollFreeHref}>Toll free {contact.tollFree}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </address>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2>{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container footer-bottom">
        <span>© 2026 {site.footerName} — Demonstration prototype</span>
        <span>Privacy-conscious, compassionate and clearly labelled sample content</span>
      </div>
    </footer>
  )
}
