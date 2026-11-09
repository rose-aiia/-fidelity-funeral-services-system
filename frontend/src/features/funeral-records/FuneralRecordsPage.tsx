import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { exhumationCoveragePath, funeralRecordPath, funeralStreamingPath, paths } from '@/config/routes'
import { stageLabels } from './data'
import { funeralRecordsStore } from './store'
import './funeral-records.css'

export default function FuneralRecordsPage() {
  const records = funeralRecordsStore.list()
  return (
    <div className="page-stack fr-grid">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Digital Funeral Records</p>
          <h1>Secure family archive</h1>
          <p className="muted" style={{ maxWidth: '72ch' }}>Organise funeral-related records from parlour arrangements through to burial. Authorised family members can view timelines, sample media, documents, access permissions and audit history in this prototype.</p>
        </div>
        <div className="fr-actions">
          <Link className="btn btn--outline" to={paths.accountFuneralStreaming}><Icon name="video" size={18} /> Live funeral coverage</Link>
          <Link className="btn btn--outline" to={exhumationCoveragePath('exh-sample')}><Icon name="lock" size={18} /> Restricted exhumation coverage</Link>
        </div>
      </header>
      <div className="fr-note" role="note"><strong>Prototype notice:</strong> Records, uploads, permissions and audit entries are sample interactions stored locally. No real cloud storage is used.</div>
      <div className="fr-list">
        {records.map((r) => (
          <article key={r.id} className="card fr-card">
            <div className="fr-card__top">
              <div>
                <p className="eyebrow">{r.reference}</p>
                <h2 className="panel__title" style={{ margin: 0 }}>{r.personName}</h2>
                <p className="muted">{r.summary}</p>
              </div>
              <Link className="btn btn--primary btn--sm" to={funeralRecordPath(r.id)}>Open archive</Link>
            </div>
            <ul className="check-list">
              {r.stages.map((s) => <li key={s.id}><strong>{stageLabels[s.id]}:</strong> {s.summary}</li>)}
            </ul>
            <div className="fr-actions">
              <span className="badge">{r.media.length} media items</span>
              <span className="badge">{r.documents.length} documents</span>
              <span className="badge">{r.access.filter((a) => a.status === 'granted').length} authorised viewers</span>
              {r.linkedCoverageId && <Link className="btn btn--outline btn--sm" to={funeralStreamingPath(r.linkedCoverageId)}>View linked coverage recording</Link>}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
