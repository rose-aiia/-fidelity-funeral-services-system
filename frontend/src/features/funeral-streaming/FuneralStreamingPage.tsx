import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { funeralRecordPath, funeralStreamingPath, paths } from '@/config/routes'
import { statusLabels, statusTone } from './data'
import { funeralStreamingStore } from './store'
import './funeral-streaming.css'

export default function FuneralStreamingPage() {
  const streams = funeralStreamingStore.list()
  return (
    <div className="page-stack fs-grid">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Live Funeral Coverage</p>
          <h1>Scheduled and simulated funeral streaming</h1>
          <p className="muted" style={{ maxWidth: '72ch' }}>Manage invited access to scheduled funeral coverage, view simulated live or recorded playback, and connect completed recordings to the Digital Funeral Records archive.</p>
        </div>
        <Link className="btn btn--outline" to={paths.accountFuneralRecords}><Icon name="archive" size={18} /> Funeral records</Link>
      </header>
      <div className="callout callout--warning"><Icon name="alert" size={20} /><div><strong>Demonstration only.</strong> This prototype uses simulated video and placeholder footage. It does not integrate with real live streaming services and must not be presented as an actual funeral broadcast.</div></div>
      <div className="fs-list">
        {streams.map((s) => (
          <article key={s.id} className="card stack">
            <div className="fs-card__top">
              <div>
                <p className="eyebrow">{s.date} · {s.time}</p>
                <h2 className="panel__title" style={{ margin: 0 }}>{s.personName}</h2>
                <p className="muted">{s.serviceTitle} · {s.venue}</p>
              </div>
              <StatusChip tone={statusTone[s.status]}>{statusLabels[s.status]}</StatusChip>
            </div>
            <p>{s.details}</p>
            <div className="fs-actions">
              <Link className="btn btn--primary btn--sm" to={funeralStreamingPath(s.id)}>Open coverage</Link>
              <span className="badge">{s.viewers.length} viewer records</span>
              {s.recordingAvailable && <span className="badge">Recording available</span>}
              {s.savedToArchiveId && <Link className="btn btn--outline btn--sm" to={funeralRecordPath(s.savedToArchiveId)}>Saved to archive</Link>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
