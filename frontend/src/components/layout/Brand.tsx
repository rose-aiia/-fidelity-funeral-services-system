import { Link } from 'react-router-dom'
import { site } from '@/config/site'

type BrandProps = {
  to: string
  /** A small tag after the name: "My account", "Administrator". */
  subtitle?: string
  /** `dark` is for dark surfaces (the header, footer and sign-in panel), where the mark and name are white. */
  tone?: 'dark' | 'light'
}

/** The Fidelity Life scales mark with the name set as live text, so it stays sharp at any size. */
export function Brand({ to, subtitle, tone = 'dark' }: BrandProps) {
  return (
    <Link to={to} className={`brand brand--${tone}`} aria-label={`${site.name}${subtitle ? `, ${subtitle}` : ''}`}>
      <img className="brand__mark" src={tone === 'dark' ? site.markLight : site.mark} alt="" width="40" height="32" />
      <span className="brand__text" aria-hidden="true">
        <strong>Fidelity Life</strong>
        <span>Assurance of Zimbabwe</span>
      </span>
      {subtitle && <span className="brand__tag">{subtitle}</span>}
    </Link>
  )
}
