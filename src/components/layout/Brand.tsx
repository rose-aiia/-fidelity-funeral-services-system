import { Link } from 'react-router-dom'
import { site } from '@/config/site'

type BrandProps = {
  to: string
  subtitle?: string
}

export function Brand({ to, subtitle }: BrandProps) {
  return (
    <Link to={to} className="brand" aria-label="Fidelity Life home">
      <span className="brand__mark" aria-hidden="true">
        <img src={site.logo} alt="Fidelity Life logo" />
      </span>
      <span className="brand__text">
        {site.name}
        {subtitle && <small>{subtitle}</small>}
      </span>
    </Link>
  )
}
