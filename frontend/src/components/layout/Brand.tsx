import { Link } from 'react-router-dom'
import { site } from '@/config/site'

type BrandProps = {
  to: string
  /** A small tag after the name: "My account", "Administrator". */
  subtitle?: string
  /** `dark` is for dark surfaces, where the mark and name are white. `auto` follows the header it sits in. */
  tone?: 'dark' | 'light' | 'auto'
}

/** The Fidelity Life scales mark with the name set as live text, so it stays sharp at any size. */
export function Brand({ to, subtitle, tone = 'dark' }: BrandProps) {
  return (
    <Link to={to} className={`brand brand--${tone === 'light' ? 'light' : 'dark'}${tone === 'auto' ? ' brand--auto' : ''}`} aria-label={`${site.name}${subtitle ? `, ${subtitle}` : ''}`}>
      {tone === 'auto' ? (
        <>
          <img className="brand__mark brand__mark--on-dark" src={site.markLight} alt="" width="46" height="34" />
          <img className="brand__mark brand__mark--on-light" src={site.mark} alt="" width="46" height="34" />
        </>
      ) : (
        <img className="brand__mark" src={tone === 'dark' ? site.markLight : site.mark} alt="" width="46" height="34" />
      )}
      <span className="brand__text" aria-hidden="true">
        <strong>Fidelity Life</strong>
        <span>Assurance of Zimbabwe</span>
      </span>
      {subtitle && <span className="brand__tag">{subtitle}</span>}
    </Link>
  )
}
