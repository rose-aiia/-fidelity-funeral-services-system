import { Link } from 'react-router-dom'
import { footerColumns, site } from '@/config/site'

function FooterBrand() {
  return (
    <div className="brand brand--footer">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="rgba(244,236,219,0.9)" />
          <path
            d="M32 10c-9 0-16 7-16 16 0 9 6 17 14 20v8h4v-8c8-3 14-11 14-20 0-9-7-16-16-16zm0 5c6 0 11 5 11 11 0 5-3 9-8 10.5V39h-6v-2.5C24 35 21 31 21 26c0-6 5-11 11-11zm-5 25h10v4H27v-4z"
            fill="#f5eedd"
          />
        </svg>
      </span>
      <span className="brand__text">
        {site.footerName}
        <small>Funeral services</small>
      </span>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <FooterBrand />
          <p>
            A prototype for compassionate, culturally aware funeral support, remembrance services and family-focused aftercare in Zimbabwe.
          </p>
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
