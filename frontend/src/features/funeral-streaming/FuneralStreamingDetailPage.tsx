import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { funeralRecordPath, paths } from '@/config/routes'
import { statusLabels, statusTone, type StreamStatus } from './data'
import { funeralStreamingStore } from './store'
import './funeral-streaming.css'

export default function FuneralStreamingDetailPage() {
  const { id = '' } = useParams()
  const [stream, setStream] = useState(() => funeralStreamingStore.get(id))
  const [msg, setMsg] = useState('')
  const [invite, setInvite] = useState({ name: '', contact: '' })
  if (!stream) return <div className="page-stack"><div className="card empty empty--large"><h1 className="panel__title">Coverage not found</h1><Link className="btn btn--primary" to={paths.accountFuneralStreaming}>Back</Link></div></div>
  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(''), 2500) }
  const setStatus = (status: StreamStatus) => { const n = funeralStreamingStore.setStatus(stream.id, status); if (n) setStream(n); flash(`Status changed to ${statusLabels[status]} (simulation).`) }
  const addViewer = (e: React.FormEvent) => { e.preventDefault(); if (!invite.name.trim() || !invite.contact.trim()) return; const n = funeralStreamingStore.addViewer(stream.id, invite.name.trim(), invite.contact.trim()); if (n) setStream(n); setInvite({ name: '', contact: '' }); flash('Viewer invitation created (prototype).') }
  const saveRecording = () => { const n = funeralStreamingStore.saveRecording(stream.id, stream.savedToArchiveId ?? 'fr-nyathi'); if (n) setStream(n); flash('Recording linked to Digital Funeral Records archive (prototype).') }

  return (
    <div className="page-stack fs-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Live funeral coverage</p>
        <h1>{stream.personName}</h1>
        <p className="muted">{stream.serviceTitle}</p>
        <div className="fs-actions"><Link className="btn btn--outline btn--sm" to={paths.accountFuneralStreaming}>All coverage</Link><StatusChip tone={statusTone[stream.status]}>{statusLabels[stream.status]}</StatusChip></div>
      </header>
      {msg && <Callout tone="success">{msg}</Callout>}
      <div className="callout callout--warning"><Icon name="alert" size={20} /><div><strong>Simulated content.</strong> The player below uses placeholder demonstration footage/controls. No real funeral is being streamed.</div></div>

      <section className="fs-player" aria-label="Simulated funeral coverage player">
        <div className="fs-player__badge"><span className="fs-sim">SIMULATED · DEMONSTRATION ONLY</span></div>
        <div className="fs-player__inner">
          <Icon name={stream.status === 'live' ? 'video' : stream.status === 'scheduled' ? 'calendar' : stream.status === 'ended' ? 'check' : 'alert'} size={42} />
          <h2 style={{ margin: 0, fontSize: 'var(--text-display-sm)' }}>
            {stream.status === 'scheduled' && 'Coverage is scheduled'}
            {stream.status === 'live' && 'Simulated live coverage in progress'}
            {stream.status === 'ended' && 'Coverage has ended'}
            {stream.status === 'unavailable' && 'Coverage unavailable'}
          </h2>
          <p>{stream.status === 'live' ? 'Placeholder footage would appear here in a real implementation. This prototype demonstrates layout, access controls and status handling only.' : stream.status === 'scheduled' ? `Invited viewers will be able to access this page at ${stream.date} ${stream.time}.` : stream.status === 'ended' ? 'A recorded version can be reviewed by authorised viewers and saved to the funeral records archive.' : 'This event cannot be viewed right now. Please contact the family administrator or funeral coordinator.'}</p>
          <div className="fs-actions" style={{ justifyContent: 'center' }}>
            {stream.status === 'live' && <button type="button" className="btn btn--primary">Pause sample (simulated)</button>}
            {stream.status === 'ended' && stream.recordingAvailable && <button type="button" className="btn btn--primary">Play recording (simulated)</button>}
            {stream.status === 'scheduled' && <button type="button" className="btn btn--outline">Set reminder (sample)</button>}
          </div>
        </div>
      </section>

      <div className="fs-two">
        <section className="card stack">
          <p className="eyebrow">Funeral event details</p>
          <h2 className="panel__title">Coverage information</h2>
          <div className="fs-kv">
            <div><span>Date</span><strong>{stream.date}</strong></div>
            <div><span>Time</span><strong>{stream.time}</strong></div>
            <div><span>Venue</span><strong>{stream.venue}</strong></div>
            <div><span>Status</span><strong>{statusLabels[stream.status]}</strong></div>
            <div><span>Access</span><strong>Invited viewers only (demonstration)</strong></div>
          </div>
          <p>{stream.details}</p>
          <div className="fs-actions">
            <span className="fs-note">Prototype status controls:</span>
            {(['scheduled', 'live', 'ended', 'unavailable'] as const).map((s) => <button key={s} type="button" className={`btn btn--sm ${stream.status === s ? 'btn--dark' : 'btn--outline'}`} onClick={() => setStatus(s)}>{statusLabels[s]}</button>)}
          </div>
        </section>

        <aside className="card stack">
          <p className="eyebrow">Recording to archive</p>
          <h2 className="panel__title">Completed stream record</h2>
          {stream.recordingAvailable ? (
            <>
              <p>A recording is available for authorised family review. In production, storage and retention would follow consent and security controls.</p>
              {stream.savedToArchiveId ? <Link className="btn btn--primary" to={funeralRecordPath(stream.savedToArchiveId)}>Open in Digital Funeral Records</Link> : <button type="button" className="btn btn--primary" onClick={saveRecording}>Save to Digital Funeral Records</button>}
            </>
          ) : <p className="muted">A recording section will appear when coverage ends and a recording is available.</p>}
        </aside>
      </div>

      <section className="card stack">
        <p className="eyebrow">Invited-viewer access</p>
        <h2 className="panel__title">Viewer invitation and access management</h2>
        <form className="fs-form" onSubmit={addViewer}>
          <div className="split" style={{ gap: 'var(--space-3)' }}>
            <label className="field"><span className="field__label">Viewer name</span><input className="input" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} required /></label>
            <label className="field"><span className="field__label">Email / phone (sample)</span><input className="input" value={invite.contact} onChange={(e) => setInvite({ ...invite, contact: e.target.value })} required /></label>
          </div>
          <div className="fs-actions"><button type="submit" className="btn btn--primary btn--sm">Send sample invitation</button></div>
        </form>
        <div className="fs-viewers">
          {stream.viewers.map((v) => (
            <article key={v.id} className="fs-viewer">
              <div><strong>{v.name}</strong><div className="fs-note">{v.contact} · Invited {new Date(v.invitedAt).toLocaleDateString('en-GB')}{v.accessedAt ? ` · Accessed ${new Date(v.accessedAt).toLocaleDateString('en-GB')}` : ''}</div></div>
              <div className="fs-actions">
                <StatusChip tone={v.status === 'accessed' ? 'success' : v.status === 'invited' ? 'info' : 'danger'}>{v.status}</StatusChip>
                {v.status !== 'accessed' && <button type="button" className="btn btn--outline btn--sm" onClick={() => { const n = funeralStreamingStore.setViewer(stream.id, v.id, 'accessed'); if (n) setStream(n); }}>Mark accessed</button>}
                {v.status !== 'revoked' && <button type="button" className="btn btn--outline btn--sm" onClick={() => { const n = funeralStreamingStore.setViewer(stream.id, v.id, 'revoked'); if (n) setStream(n); }}>Revoke</button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
