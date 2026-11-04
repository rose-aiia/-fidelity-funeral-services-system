import { Link } from 'react-router-dom'
import { footerColumns, site } from '@/config/site'

function FooterBrand() {
  return (
    <div className="brand brand--footer">
      <span className="brand__mark" aria-hidden="true">
        <img src={site.logo} alt="" />
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
