import { Link } from 'react-router-dom'
import { paths } from '@/config/routes'

export function NotFoundPage() {
  return (
    <div className="status-page container">
      <p className="eyebrow">Page not found</p>
      <h1>We couldn’t find that page.</h1>
      <p className="muted">The link may be out of date. You can head back to the home page and start again.</p>
      <Link to={paths.home} className="btn btn--primary">
        Back to home
      </Link>
    </div>
  )
}
