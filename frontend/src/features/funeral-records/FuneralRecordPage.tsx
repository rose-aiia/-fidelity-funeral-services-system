import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { funeralStreamingPath, paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { stageLabels, stageOrder, type AccessStatus, type RecordMedia, type RecordStageId } from './data'
import { funeralRecordsStore } from './store'
import { ChemaCasePanel } from '@/features/chema-wallet/ChemaCasePanel'
import './funeral-records.css'

export default function FuneralRecordPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const actor = user?.name ?? 'Authorised family member'
  const [archive, setArchive] = useState(() => funeralRecordsStore.get(id))
  const [selected, setSelected] = useState<RecordMedia | null>(null)
  const [msg, setMsg] = useState('')
  const [upload, setUpload] = useState({ kind: 'photo' as RecordMedia['kind'], title: '', stage: 'service' as RecordStageId, note: '' })
  const [invite, setInvite] = useState({ name: '', relationship: '', channel: '', level: 'invited' as const })
  const dialogRef = useRef<HTMLDialogElement>(null)

  const byStage = useMemo(() => {
    if (!archive) return []
    return stageOrder.map((s) => ({ stage: s, label: stageLabels[s], items: archive.media.filter((m) => m.stage === s) }))
  }, [archive])

  if (!archive) return <div className="page-stack"><div className="card empty empty--large"><h1 className="panel__title">Record not found</h1><Link className="btn btn--primary" to={paths.accountFuneralRecords}>Back to funeral records</Link></div></div>

  function flash(text: string) { setMsg(text); window.setTimeout(() => setMsg(''), 2500) }
  function open(item: RecordMedia) { setSelected(item); window.setTimeout(() => dialogRef.current?.showModal(), 0) }
  async function onUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!upload.title.trim() || !archive) return
    const file = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null)?.files?.[0]
    let url: string | undefined
    if (file && file.type.startsWith('image/') && file.size < 900_000) {
      url = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.readAsDataURL(file) })
    }
    const next = funeralRecordsStore.addMedia(archive.id, { ...upload, title: upload.title.trim(), note: upload.note.trim() || (file ? `Sample upload: ${file.name}` : 'Sample metadata record'), url, mime: file?.type, addedBy: actor })
    if (next) setArchive(next)
    setUpload({ kind: 'photo', title: '', stage: 'service', note: '' })
    if (e.currentTarget instanceof HTMLFormElement) e.currentTarget.reset()
    flash('Sample record added to the archive (local prototype).')
  }
  function setAccess(accessId: string, status: AccessStatus) { const next = funeralRecordsStore.setAccess(archive!.id, accessId, status, actor); if (next) setArchive(next); flash(`Access ${status}.`) }
  function addInvite(e: React.FormEvent) {
    e.preventDefault(); if (!invite.name.trim() || !invite.channel.trim()) return
    const next = funeralRecordsStore.addAccess(archive!.id, { ...invite, name: invite.name.trim(), relationship: invite.relationship.trim() || 'Family contact', channel: invite.channel.trim() }, actor)
    if (next) setArchive(next); setInvite({ name: '', relationship: '', channel: '', level: 'invited' }); flash('Viewer invitation created (prototype).')
  }

  return (
    <div className="page-stack fr-grid">
      <header className="page-head reveal">
        <p className="eyebrow">{archive.reference}</p>
        <h1>{archive.personName}</h1>
        <p className="muted">{archive.summary}</p>
        <div className="fr-actions">
          <Link className="btn btn--outline btn--sm" to={paths.accountFuneralRecords}>All records</Link>
          {archive.linkedCoverageId && <Link className="btn btn--outline btn--sm" to={funeralStreamingPath(archive.linkedCoverageId)}><Icon name="video" size={16} /> Linked coverage recording</Link>}
        </div>
      </header>
      {msg && <Callout tone="success">{msg}</Callout>}
      <div className="fr-note"><strong>Authorised access demonstration:</strong> this archive shows sample access permissions and sharing controls. In production this would require secure identity, consent and storage controls.</div>

      <ChemaCasePanel funeralRecordId={archive.id} caseRef={archive.reference} personName={archive.personName} summary={archive.summary} />

      <div className="fr-two">
        <section className="card stack" aria-labelledby="fr-timeline">
          <p className="eyebrow">Funeral event timeline</p>
          <h2 id="fr-timeline" className="panel__title">From parlour arrangements to burial</h2>
          <ol className="fr-timeline">
            {archive.stages.map((s) => (
              <li key={s.id} className={`fr-step ${s.completed ? 'is-done' : ''}`}>
                <span className="fr-step__dot" aria-hidden="true">{s.completed ? <Icon name="check" size={14} /> : '•'}</span>
                <div>
                  <h3>{stageLabels[s.id]}</h3>
                  <p><strong>{s.date}{s.location ? ` · ${s.location}` : ''}</strong></p>
                  <p>{s.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="card stack">
          <p className="eyebrow">Sample upload / viewing</p>
          <h2 className="panel__title">Add record metadata</h2>
          <form className="fr-form" onSubmit={onUpload}>
            <label className="field"><span className="field__label">Type</span><select className="select" value={upload.kind} onChange={(e) => setUpload({ ...upload, kind: e.target.value as RecordMedia['kind'] })}><option value="photo">Photograph</option><option value="video">Video record</option><option value="document">Document</option></select></label>
            <label className="field"><span className="field__label">Title</span><input className="input" value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} required /></label>
            <label className="field"><span className="field__label">Timeline stage</span><select className="select" value={upload.stage} onChange={(e) => setUpload({ ...upload, stage: e.target.value as RecordStageId })}>{stageOrder.map((s) => <option key={s} value={s}>{stageLabels[s]}</option>)}</select></label>
            <label className="field"><span className="field__label">Optional sample file (image preview)</span><input className="input" type="file" accept="image/*,video/*,.pdf" /></label>
            <label className="field"><span className="field__label">Note</span><textarea className="textarea" rows={2} value={upload.note} onChange={(e) => setUpload({ ...upload, note: e.target.value })} /></label>
            <button type="submit" className="btn btn--primary btn--sm">Add sample record</button>
          </form>
        </aside>
      </div>

      <section className="card stack">
        <p className="eyebrow">Media gallery</p>
        <h2 className="panel__title">Photographs, videos and funeral records</h2>
        {byStage.map((group) => group.items.length ? (
          <div key={group.stage} className="stack" style={{ gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{group.label}</h3>
            <div className="fr-media">
              {group.items.map((item) => (
                <figure key={item.id} className="fr-media__item">
                  <button type="button" onClick={() => open(item)} aria-label={`View ${item.title}`}>
                    <div className="fr-media__thumb">
                      {item.kind === 'photo' && item.url ? <img src={item.url} alt="" /> : <Icon name={item.kind === 'video' ? 'video' : item.kind === 'document' ? 'file' : 'flower'} size={34} />}
                      <span className="fr-media__kind">{item.kind}</span>
                    </div>
                    <div className="fr-media__body"><strong>{item.title}</strong><span>Added by {item.addedBy} · {new Date(item.addedAt).toLocaleDateString('en-GB')}</span></div>
                  </button>
                </figure>
              ))}
            </div>
          </div>
        ) : null)}
      </section>

      <section className="card stack">
        <p className="eyebrow">Documents</p>
        <h2 className="panel__title">Sample funeral documents</h2>
        <div className="fr-docs">
          {archive.documents.map((d) => (
            <article key={d.id} className="fr-doc">
              <div className="fr-doc__main"><Icon name="file" size={20} /><div><strong>{d.title}</strong><div className="fr-note">{stageLabels[d.stage]} · {d.mime ?? 'Document'} · Added by {d.addedBy}</div></div></div>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => open(d)}><Icon name="download" size={16} /> View sample</button>
            </article>
          ))}
        </div>
      </section>

      <div className="fr-two">
        <section className="card stack">
          <p className="eyebrow">Access permissions & sharing</p>
          <h2 className="panel__title">Authorised family access</h2>
          <form className="fr-form" onSubmit={addInvite}>
            <div className="fr-form-grid">
              <label className="field"><span className="field__label">Name</span><input className="input" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} required /></label>
              <label className="field"><span className="field__label">Relationship</span><input className="input" value={invite.relationship} onChange={(e) => setInvite({ ...invite, relationship: e.target.value })} /></label>
              <label className="field"><span className="field__label">Email / phone (sample)</span><input className="input" value={invite.channel} onChange={(e) => setInvite({ ...invite, channel: e.target.value })} required /></label>
              <label className="field"><span className="field__label">Access level</span><select className="select" value={invite.level} onChange={(e) => setInvite({ ...invite, level: e.target.value as 'invited' })}><option value="invited">Invited viewer</option><option value="family">Family access</option></select></label>
            </div>
            <button type="submit" className="btn btn--primary btn--sm">Create invitation</button>
          </form>
          <div className="fr-access">
            {archive.access.map((a) => (
              <article key={a.id} className="fr-access__row">
                <div><strong>{a.name}</strong><div className="fr-note">{a.relationship} · {a.channel} · {a.level}</div></div>
                <div className="fr-actions">
                  <StatusChip tone={a.status === 'granted' ? 'success' : a.status === 'pending' ? 'warning' : 'danger'}>{a.status}</StatusChip>
                  {a.status !== 'granted' && <button type="button" className="btn btn--outline btn--sm" onClick={() => setAccess(a.id, 'granted')}>Grant</button>}
                  {a.status !== 'revoked' && <button type="button" className="btn btn--outline btn--sm" onClick={() => setAccess(a.id, 'revoked')}>Revoke</button>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card stack">
          <p className="eyebrow">Audit history</p>
          <h2 className="panel__title">When content was added and by whom</h2>
          <div className="fr-audit">
            {archive.audit.map((e) => (
              <article key={e.id} className="fr-audit__row">
                <div><strong>{e.action}</strong><div className="fr-note">{e.details}</div></div>
                <div className="fr-note" style={{ textAlign: 'right' }}>{e.by}<br />{new Date(e.at).toLocaleString('en-GB')}</div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <dialog ref={dialogRef} className="fr-dialog" onClose={() => setSelected(null)} onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}>
        {selected && (
          <div className="fr-dialog__inner">
            <div className="fr-dialog__media">
              {selected.kind === 'photo' && selected.url ? <img src={selected.url} alt={selected.title} /> : selected.kind === 'video' ? (
                <div className="fr-dialog__player"><Icon name="video" size={42} /><h3 style={{ margin: 0 }}>{selected.title}</h3><p>Simulated video player. This prototype does not store or stream real funeral footage.</p><button type="button" className="btn btn--primary">Play sample (simulated)</button></div>
              ) : (
                <div className="fr-dialog__player"><Icon name="file" size={42} /><h3 style={{ margin: 0 }}>{selected.title}</h3><p>{selected.mime ?? 'Document'} preview is simulated for demonstration. No real cloud document is downloaded.</p><button type="button" className="btn btn--primary">Open sample (simulated)</button></div>
              )}
            </div>
            <div>
              <p className="eyebrow">{selected.kind} · {stageLabels[selected.stage]}</p>
              <h2 className="panel__title" style={{ marginBottom: 4 }}>{selected.title}</h2>
              <p className="muted">{selected.note}</p>
              <p className="fr-note">Added {new Date(selected.addedAt).toLocaleString('en-GB')} by {selected.addedBy}.{selected.simulated ? ' Simulated demonstration content.' : ''}</p>
            </div>
            <div className="fr-actions"><button type="button" className="btn btn--outline" onClick={() => dialogRef.current?.close()}>Close</button></div>
          </div>
        )}
      </dialog>
    </div>
  )
}
