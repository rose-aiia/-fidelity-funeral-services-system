import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { exhumationCoveragePath, paths } from '@/config/routes'
import { exhumationStatusLabels } from './data'
import { exhumationStore } from './store'
import './exhumation-coverage.css'

export default function ExhumationCoveragePage() {
  const events = exhumationStore.list()
  return (
    <div className="page-stack exh-grid">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Restricted Coverage</p>
          <h1>Exhumation live coverage and recording</h1>
          <p className="muted" style={{ maxWidth: '72ch' }}>This area is separate from ordinary funeral streaming because of the sensitive nature of exhumation. Access is restricted to authorised viewers and all interactions are demonstration-only.</p>
        </div>
        <Link className="btn btn--outline" to={paths.accountFuneralRecords}><Icon name="archive" size={18} /> Funeral records</Link>
      </header>
      <div className="exh-restricted-banner" role="note">
        <Icon name="lock" size={22} />
        <div><strong>Restricted and separate feature.</strong> Exhumation coverage is not publicly accessible. All footage, statuses, permissions and audit entries shown here are simulated for demonstration and must not be treated as real exhumation coverage.</div>
      </div>
      <div className="fs-list">
        {events.map((e) => (
          <article key={e.id} className="card stack exh-panel">
            <div className="page-head--row" style={{ alignItems: 'start' }}>
              <div>
                <p className="eyebrow">{e.reference} · Restricted</p>
                <h2 className="panel__title" style={{ margin: 0 }}>{e.caseName}</h2>
                <p className="muted">{e.location} · {e.scheduledAt}</p>
              </div>
              <StatusChip tone={e.status === 'suspended' || e.approvalStatus === 'suspended' ? 'danger' : e.approvalStatus === 'approved' ? 'success' : 'warning'}>{exhumationStatusLabels[e.status]}</StatusChip>
            </div>
            <p>{e.details}</p>
            <div className="exh-actions">
              <Link className="btn btn--primary btn--sm" to={exhumationCoveragePath(e.id)}><Icon name="lock" size={16} /> Open restricted coverage</Link>
              <span className="badge">Authorisation: {e.approvalStatus}</span>
              <span className="badge">{e.viewers.filter((v) => v.status === 'granted').length} authorised viewers</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
