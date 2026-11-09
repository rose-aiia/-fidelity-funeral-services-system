import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { memorialPath, paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import {
  buildGenerations,
  contributionLabels,
  memberLinks,
  relationLabel,
  visibilityLabels,
  type FamilyHistoryArchive,
  type FamilyMember,
  type FamilyVisibility,
} from './data'
import { familyHistoryStore } from './store'
import './family-history.css'

export default function FamilyHistoryPage() {
  const { user } = useAuth()
  const [archive, setArchive] = useState<FamilyHistoryArchive>(() => familyHistoryStore.get())
  const [selectedId, setSelectedId] = useState<string>(archive.members[0]?.id ?? '')
  const [showAdd, setShowAdd] = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ name: '', relationship: '', birthDate: '', deathDate: '', location: '', bio: '', memorialSlug: '' })
  const [contrib, setContrib] = useState({ invitedName: '', invitedEmail: '', summary: '', details: '' })
  const generations = useMemo(() => buildGenerations(archive), [archive])
  const selected = archive.members.find((m) => m.id === selectedId) ?? archive.members[0]
  const rels = selected ? memberLinks(archive, selected.id) : []

  function flash(text: string) { setMsg(text); window.setTimeout(() => setMsg(''), 2500) }
  function onVisibility(v: FamilyVisibility) { setArchive(familyHistoryStore.setVisibility(v)); flash('Privacy and visibility updated (prototype).') }
  function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.relationship.trim()) return
    const next = familyHistoryStore.addMember({
      name: form.name.trim(), relationship: form.relationship.trim(), birthDate: form.birthDate || undefined,
      deathDate: form.deathDate || undefined, location: form.location.trim() || undefined, bio: form.bio.trim(), memorialSlug: form.memorialSlug.trim() || undefined,
    })
    setArchive(next); setSelectedId(next.members[next.members.length - 1]?.id ?? selectedId); setForm({ name: '', relationship: '', birthDate: '', deathDate: '', location: '', bio: '', memorialSlug: '' }); setShowAdd(false); flash('Family member added to the sample tree.')
  }
  function onContribute(e: React.FormEvent) {
    e.preventDefault()
    if (!contrib.invitedName.trim() || !contrib.summary.trim() || !contrib.details.trim()) return
    setArchive(familyHistoryStore.addContribution({ invitedName: contrib.invitedName.trim(), invitedEmail: contrib.invitedEmail.trim() || undefined, submittedBy: user?.name ?? 'Invited relative', summary: contrib.summary.trim(), details: contrib.details.trim() }))
    setContrib({ invitedName: '', invitedEmail: '', summary: '', details: '' }); setShowContrib(false); flash('Contribution submitted for approval (prototype).')
  }
  function review(id: string, status: 'approved' | 'declined') {
    setArchive(familyHistoryStore.reviewContribution(id, status, user?.name ?? 'Family administrator'))
    flash(status === 'approved' ? 'Contribution approved and added to family records.' : 'Contribution declined.')
  }

  return (
    <div className="page-stack fh-grid">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Family History & Family Tree</p>
          <h1>{archive.familyName}</h1>
          <p className="muted" style={{ maxWidth: '70ch' }}>{archive.summary}</p>
        </div>
        <div className="fh-actions">
          <Link className="btn btn--outline" to={paths.accountMemorials}><Icon name="flower" size={18} /> Digital memorials</Link>
          <button type="button" className="btn btn--primary" onClick={() => setShowAdd((v) => !v)}><Icon name="plus" size={18} /> Add family member</button>
        </div>
      </header>

      {msg && <Callout tone="success">{msg}</Callout>}
      <div className="fh-demo-note" role="note"><strong>Prototype notice:</strong> Family data, contributions and access controls are sample interactions stored locally for demonstration. No real family records are published.</div>

      <section className="card stack" aria-labelledby="fh-privacy">
        <div className="split" style={{ alignItems: 'end' }}>
          <div>
            <p className="eyebrow">Privacy & visibility</p>
            <h2 id="fh-privacy" className="panel__title">Control who can view and contribute</h2>
            <p className="muted">Current visibility: <strong>{visibilityLabels[archive.visibility]}</strong>. Invited relatives can contribute memories, but approved family administrators review changes before they appear in shared records.</p>
          </div>
          <div className="fh-actions">
            {(['private', 'invited', 'family'] as const).map((v) => (
              <button key={v} type="button" className={`btn btn--sm ${archive.visibility === v ? 'btn--dark' : 'btn--outline'}`} onClick={() => onVisibility(v)} aria-pressed={archive.visibility === v}>{visibilityLabels[v]}</button>
            ))}
          </div>
        </div>
      </section>

      {showAdd && (
        <form className="card fh-inline-form" onSubmit={onAdd}>
          <h2 className="panel__title">Add a sample family member</h2>
          <div className="fh-form-grid">
            <label className="field"><span className="field__label">Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field"><span className="field__label">Relationship</span><input className="input" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="e.g. Cousin" required /></label>
            <label className="field"><span className="field__label">Birth date</span><input className="input" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
            <label className="field"><span className="field__label">Death date</span><input className="input" type="date" value={form.deathDate} onChange={(e) => setForm({ ...form, deathDate: e.target.value })} /></label>
            <label className="field"><span className="field__label">Location</span><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label className="field"><span className="field__label">Connected memorial slug (optional)</span><input className="input" value={form.memorialSlug} onChange={(e) => setForm({ ...form, memorialSlug: e.target.value })} placeholder="grace-nyathi" /></label>
          </div>
          <label className="field"><span className="field__label">Biography / note</span><textarea className="textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          <div className="fh-actions"><button type="submit" className="btn btn--primary btn--sm">Add member</button><button type="button" className="btn btn--outline btn--sm" onClick={() => setShowAdd(false)}>Cancel</button></div>
        </form>
      )}

      <div className="fh-two">
        <section className="card stack" aria-labelledby="fh-tree">
          <div>
            <p className="eyebrow">Visual family tree</p>
            <h2 id="fh-tree" className="panel__title">Multiple generations and relationships</h2>
            <p className="muted">Select a family member to view their profile, important dates, relationships and connected memorial page.</p>
          </div>
          <div className="fh-tree" role="list" aria-label="Family tree generations">
            {generations.map((group) => (
              <div key={group.generation} className="fh-gen" role="listitem">
                <div className="fh-gen__label">Generation {group.generation + 1}</div>
                <div className="fh-gen__row">
                  {group.members.map((m) => (
                    <button key={m.id} type="button" className="fh-node" aria-current={m.id === selected?.id} onClick={() => setSelectedId(m.id)}>
                      <div className="fh-node__name">{m.name}</div>
                      <div className="fh-node__meta">{[m.birthDate?.slice(0, 4), m.deathDate?.slice(0, 4)].filter(Boolean).join(' – ') || 'Dates not recorded'}</div>
                      <span className="fh-node__rel">{m.relationship}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card stack fh-profile" aria-live="polite">
          <p className="eyebrow">Family member profile</p>
          {selected ? <MemberProfile member={selected} rels={rels} /> : <p className="muted">Select a family member.</p>}
        </aside>
      </div>

      <section className="card stack" aria-labelledby="fh-records">
        <div>
          <p className="eyebrow">Biographies, origins, stories & events</p>
          <h2 id="fh-records" className="panel__title">Family history records</h2>
        </div>
        <div className="fh-records">
          {archive.records.map((r) => (
            <article key={r.id} className="fh-record">
              <div className="fh-record__top">
                <h3>{r.title}{r.date ? <span className="muted"> · {r.date}</span> : null}</h3>
                <div className="fh-badges">
                  <span className="fh-badge fh-badge--kind">{r.kind}</span>
                  <span className={`fh-badge fh-badge--${r.status}`}>{contributionLabels[r.status]}</span>
                  <span className="fh-badge">{visibilityLabels[r.visibility]}</span>
                </div>
              </div>
              <p>{r.content}</p>
              <p className="fh-audit">Added {new Date(r.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} by {r.contributedBy}.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="fh-photos">
        <p className="eyebrow">Sample photographs & records</p>
        <h2 id="fh-photos" className="panel__title">Family photographs</h2>
        <div className="fh-photos">
          {archive.photos.map((p) => (
            <figure key={p.id} className="fh-photo">
              <img src={p.url} alt={p.caption ?? 'Family photograph'} loading="lazy" />
              <figcaption>{p.caption}{p.year ? ` (${p.year})` : ''}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="card stack" aria-labelledby="fh-contrib">
        <div className="page-head--row" style={{ alignItems: 'end' }}>
          <div>
            <p className="eyebrow">Invited relatives</p>
            <h2 id="fh-contrib" className="panel__title">Contribution and approval interface</h2>
            <p className="muted">Invited relatives can submit stories or records. A family administrator reviews and approves contributions before they appear in shared history.</p>
          </div>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => setShowContrib((v) => !v)}><Icon name="plus" size={16} /> Submit contribution</button>
        </div>
        {showContrib && (
          <form className="fh-inline-form" onSubmit={onContribute}>
            <div className="fh-form-grid">
              <label className="field"><span className="field__label">Invited relative name</span><input className="input" value={contrib.invitedName} onChange={(e) => setContrib({ ...contrib, invitedName: e.target.value })} required /></label>
              <label className="field"><span className="field__label">Email (sample)</span><input className="input" type="email" value={contrib.invitedEmail} onChange={(e) => setContrib({ ...contrib, invitedEmail: e.target.value })} /></label>
            </div>
            <label className="field"><span className="field__label">Contribution summary</span><input className="input" value={contrib.summary} onChange={(e) => setContrib({ ...contrib, summary: e.target.value })} required /></label>
            <label className="field"><span className="field__label">Details</span><textarea className="textarea" rows={3} value={contrib.details} onChange={(e) => setContrib({ ...contrib, details: e.target.value })} required /></label>
            <div className="fh-actions"><button type="submit" className="btn btn--primary btn--sm">Submit for approval</button><button type="button" className="btn btn--outline btn--sm" onClick={() => setShowContrib(false)}>Cancel</button></div>
          </form>
        )}
        <div className="fh-records">
          {archive.contributions.map((c) => (
            <article key={c.id} className="fh-record">
              <div className="fh-record__top">
                <h3>{c.summary}</h3>
                <StatusChip tone={c.status === 'approved' ? 'success' : c.status === 'pending' ? 'warning' : c.status === 'declined' ? 'danger' : 'neutral'}>{contributionLabels[c.status]}</StatusChip>
              </div>
              <p>{c.details}</p>
              <p className="fh-audit">Submitted by {c.submittedBy} ({c.invitedName}{c.invitedEmail ? `, ${c.invitedEmail}` : ''}) on {new Date(c.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{c.reviewer ? ` · Reviewed by ${c.reviewer}` : ''}.</p>
              {c.status === 'pending' && (
                <div className="fh-actions" style={{ marginTop: 'var(--space-3)' }}>
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => review(c.id, 'approved')}>Approve</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => review(c.id, 'declined')}>Decline</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {archive.connectedMemorialSlugs.length > 0 && (
        <section className="card stack">
          <p className="eyebrow">Connected digital memorials</p>
          <h2 className="panel__title">Memorial pages linked to this family history</h2>
          <div className="fh-actions">
            {archive.connectedMemorialSlugs.map((slug) => (
              <Link key={slug} className="btn btn--outline" to={memorialPath(slug)}><Icon name="flower" size={18} /> View memorial: {slug}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MemberProfile({ member, rels }: { member: FamilyMember; rels: ReturnType<typeof memberLinks> }) {
  return (
    <>
      <div className="fh-profile__head">
        {member.photoUrl ? <img className="fh-profile__photo" src={member.photoUrl} alt="" /> : <span className="avatar avatar--lg"><Icon name="user" size={24} /></span>}
        <div>
          <h3 className="fh-profile__name">{member.name}</h3>
          <p className="muted">{member.relationship}{member.location ? ` · ${member.location}` : ''}</p>
        </div>
      </div>
      <div className="fh-kv">
        <div><span>Birth</span><strong>{member.birthDate || 'Not recorded'}</strong></div>
        <div><span>Death</span><strong>{member.deathDate || '—'}</strong></div>
        <div><span>Important dates</span><strong>{[member.birthDate, member.deathDate].filter(Boolean).join(' to ') || 'Add dates'}</strong></div>
      </div>
      {member.bio && <p>{member.bio}</p>}
      <div>
        <h4 className="panel__title" style={{ fontSize: '1rem', marginBottom: 'var(--space-2)' }}>Family relationships</h4>
        {rels.length ? (
          <ul className="fh-rel-list">
            {rels.map((r) => (
              <li key={r.id}><strong>{relationLabel(r, member.id)}</strong><span>{r.other.name}{r.note ? ` (${r.note})` : ''}</span></li>
            ))}
          </ul>
        ) : <p className="muted">No relationships recorded yet.</p>}
      </div>
      {member.memorialSlug ? <Link className="btn btn--outline btn--sm" to={memorialPath(member.memorialSlug)}><Icon name="flower" size={16} /> Open connected memorial</Link> : <p className="fh-audit">No digital memorial page connected yet.</p>}
    </>
  )
}
