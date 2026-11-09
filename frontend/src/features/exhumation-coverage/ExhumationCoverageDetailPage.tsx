import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { exhumationStatusLabels, type ExhumationAccess, type ExhumationStatus } from './data'
import { exhumationAuthStore, exhumationStore } from './store'
import './exhumation-coverage.css'

export default function ExhumationCoverageDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const actor = user?.name ?? 'Authorised user'
  const canManage = user?.role === 'admin' || user?.role === 'staff'
  const [event, setEvent] = useState(() => exhumationStore.get(id))
  const [msg, setMsg] = useState('')
  const [localAuth, setLocalAuth] = useState(() => exhumationAuthStore.hasLocalAuthorization(id, user?.id ?? 'guest'))
  const authorized = canManage || localAuth || event?.viewers.some((v) => v.status === 'granted' && (v.name === user?.name || v.role === 'Family'))

  if (!event) return <div className="page-stack"><div className="card empty empty--large"><h1 className="panel__title">Restricted case not found</h1><Link className="btn btn--primary" to={paths.accountExhumationCoverage}>Back</Link></div></div>

  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(''), 2500) }
  const verify = () => { exhumationAuthStore.grantLocalAuthorization(event.id, user?.id ?? 'guest'); setLocalAuth(true); flash('Sample authorisation verified for this browser session/prototype state.') }
  const setStatus = (status: ExhumationStatus) => { const n = exhumationStore.setStatus(event.id, status, actor); if (n) setEvent(n); flash(`Coverage status updated to ${exhumationStatusLabels[status]}.`) }
  const setViewer = (viewerId: string, status: ExhumationAccess) => { const n = exhumationStore.setViewer(event.id, viewerId, status, actor); if (n) setEvent(n); flash(`Viewer access ${status}.`) }
  const suspendAll = () => { const n = exhumationStore.suspendAll(event.id, actor); if (n) setEvent(n); flash('All access suspended and coverage marked as suspended (prototype).') }

  return (
    <div className="page-stack exh-grid">
      <header className="page-head reveal">
        <p className="eyebrow">{event.reference} · RESTRICTED</p>
        <h1>{event.caseName}</h1>
        <p className="muted">{event.location} · {event.scheduledAt}</p>
        <div className="exh-actions"><Link className="btn btn--outline btn--sm" to={paths.accountExhumationCoverage}>All restricted cases</Link><StatusChip tone={event.status === 'suspended' ? 'danger' : 'success'}>Approval: {event.approvalStatus}</StatusChip></div>
      </header>
      {msg && <Callout tone="success">{msg}</Callout>}
      <div className="exh-restricted-banner" role="alert">
        <Icon name="lock" size={22} />
        <div><strong>Authorised access only.</strong> This exhumation coverage interface is separate from ordinary funeral streaming and is not publicly accessible. All footage and controls are simulated demonstrations.</div>
      </div>

      {!authorized ? (
        <section className="card exh-panel exh-gate">
          <h2 className="panel__title">Authorisation required</h2>
          <p className="muted">Your account is not currently authorised to view this restricted case. In a live system, access would be granted only after appropriate approvals and identity checks.</p>
          <div className="exh-kv" style={{ width: '100%', maxWidth: 520 }}>
            <div><span>Case</span><strong>{event.reference}</strong></div>
            <div><span>Approval status</span><strong>{event.approvalStatus}</strong></div>
            <div><span>Authorising body</span><strong>{event.authorisingBody}</strong></div>
          </div>
          <div className="exh-actions">
            <button type="button" className="btn btn--primary" onClick={verify}>Verify sample authorisation (prototype)</button>
            <Link className="btn btn--outline" to={paths.accountFuneralRecords}>Return to records</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="exh-player" aria-label="Simulated restricted exhumation coverage">
            <div className="exh-sim">RESTRICTED · SIMULATED DEMONSTRATION</div>
            <div className="exh-player__inner">
              <Icon name={event.status === 'live' ? 'video' : event.status === 'suspended' ? 'lock' : 'file'} size={42} />
              <h2 style={{ margin: 0 }}>{event.status === 'live' ? 'Simulated restricted live coverage' : event.status === 'suspended' ? 'Coverage suspended' : event.recordingAvailable ? 'Simulated recorded footage interface' : 'Restricted coverage interface'}</h2>
              <p>{event.status === 'suspended' ? 'Access has been suspended. Authorised administrators can review and restore access according to policy.' : 'No real exhumation footage is displayed. This interface demonstrates restricted viewing, approval status, access management and audit history only.'}</p>
              <div className="exh-actions" style={{ justifyContent: 'center' }}>
                {event.status !== 'suspended' && event.recordingAvailable && <button type="button" className="btn btn--primary">Play sample recording (simulated)</button>}
                {event.status === 'live' && <button type="button" className="btn btn--outline">Pause sample (simulated)</button>}
              </div>
            </div>
          </section>

          <div className="exh-two">
            <section className="card stack exh-panel">
              <p className="eyebrow">Event details & authorisation</p>
              <h2 className="panel__title">Restricted case information</h2>
              <div className="exh-kv">
                <div><span>Reference</span><strong>{event.reference}</strong></div>
                <div><span>Scheduled</span><strong>{event.scheduledAt}</strong></div>
                <div><span>Location</span><strong>{event.location}</strong></div>
                <div><span>Approval status</span><strong>{event.approvalStatus}</strong></div>
                <div><span>Authorising body</span><strong>{event.authorisingBody}</strong></div>
                <div><span>Coverage status</span><strong>{exhumationStatusLabels[event.status]}</strong></div>
              </div>
              <p>{event.details}</p>
              <div className="exh-actions">
                <span className="exh-note">Prototype status controls:</span>
                {(['authorised', 'scheduled', 'live', 'ended', 'suspended'] as const).map((s) => <button key={s} type="button" className={`btn btn--sm ${event.status === s ? 'btn--dark' : 'btn--outline'}`} onClick={() => setStatus(s)}>{exhumationStatusLabels[s]}</button>)}
              </div>
            </section>

            <aside className="card stack exh-panel">
              <p className="eyebrow">Access control</p>
              <h2 className="panel__title">Suspend or revoke access</h2>
              <p className="muted">Administrators can suspend active access or revoke individual viewers. This is a demonstration of restricted access management.</p>
              <button type="button" className="btn btn--primary" onClick={suspendAll}>Suspend all access</button>
              <p className="exh-note">Suspending access updates viewer states and records an audit entry.</p>
            </aside>
          </div>

          <section className="card stack exh-panel">
            <p className="eyebrow">Restricted viewer access</p>
            <h2 className="panel__title">Permission management</h2>
            <div className="exh-viewers">
              {event.viewers.map((v) => (
                <article key={v.id} className="exh-row">
                  <div><strong>{v.name}</strong><div className="exh-note">{v.role} · Updated {new Date(v.updatedAt).toLocaleString('en-GB')} by {v.updatedBy}</div></div>
                  <div className="exh-actions">
                    <StatusChip tone={v.status === 'granted' ? 'success' : v.status === 'pending' ? 'warning' : 'danger'}>{v.status}</StatusChip>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setViewer(v.id, 'granted')}>Grant</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setViewer(v.id, 'suspended')}>Suspend</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setViewer(v.id, 'revoked')}>Revoke</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card stack exh-panel">
            <p className="eyebrow">Audit history</p>
            <h2 className="panel__title">Sample access and case activity</h2>
            <div className="exh-audit">
              {event.audit.map((a) => (
                <article key={a.id} className="exh-row">
                  <div><strong>{a.action}</strong><div className="exh-note">{a.details}</div></div>
                  <div className="exh-note" style={{ textAlign: 'right' }}>{a.by}<br />{new Date(a.at).toLocaleString('en-GB')}</div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
