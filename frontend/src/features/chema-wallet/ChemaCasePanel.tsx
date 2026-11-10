import { useMemo, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/features/auth'
import { chemaStore } from './store'
import { contributionTotals, contributionsForCase, type ChemaCase } from './data'
import './chema-wallet.css'

function money(n: number) { return `USD ${n.toFixed(2)}` }

function contributionUrl(token: string) {
  return `${window.location.origin}/contribute/${token}`
}

export function ChemaCasePanel({ funeralRecordId, caseRef, personName, summary }: { funeralRecordId: string; caseRef: string; personName: string; summary: string }) {
  const { user } = useAuth()
  const actor = user?.name ?? 'Authorised user'
  const isAdmin = user?.role === 'admin'
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')
  const [cash, setCash] = useState({ amount: '', contributorName: '', note: '' })
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [coord, setCoord] = useState({ userId: '', name: '', phone: '' })

  const item: ChemaCase = useMemo(() => {
    void tick
    return chemaStore.getCaseByRecord(funeralRecordId) ?? chemaStore.ensureCaseForRecord({ id: funeralRecordId, reference: caseRef, personName, summary }, actor)
  }, [funeralRecordId, caseRef, personName, summary, actor, tick])

  const state = chemaStore.getState()
  const contributions = contributionsForCase(state, item.id)
  const totals = contributionTotals(contributions)
  const url = contributionUrl(item.contributionToken)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`
  const waText = encodeURIComponent(`You can support the family of ${item.deceasedName} through the Chema Wallet contribution page (demo): ${url}`)
  const isCoordinator = user && item.coordinator?.userId === user.id
  const canManage = isAdmin || !!isCoordinator

  function refresh(text?: string) { setTick((t) => t + 1); if (text) { setMsg(text); window.setTimeout(() => setMsg(''), 3000) } }
  async function copyLink() { try { await navigator.clipboard.writeText(url); refresh('Contribution link copied.') } catch { refresh('Copy not available in this browser; select the link manually.') } }

  function onActivate() { if (!item.verified) chemaStore.verifyCase(item.id, actor); chemaStore.activateCase(item.id, actor); refresh('Funeral case verified (demo) and Chema Wallet activated.') }
  function onVerify() { chemaStore.verifyCase(item.id, actor); refresh('Funeral case marked as verified for Chema Wallet (demo).') }

  function submitCash(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(cash.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    chemaStore.addCashContribution(item.id, { amount, contributorName: cash.contributorName, note: cash.note, recordedBy: actor })
    setCash({ amount: '', contributorName: '', note: '' })
    refresh('Physical cash contribution recorded separately (demo).')
  }

  function submitPayout(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(payoutAmount)
    if (!isAdmin || !Number.isFinite(amount) || amount <= 0) return
    chemaStore.requestPayout(item.id, amount, actor, payoutNote || undefined)
    setPayoutAmount(''); setPayoutNote('')
    refresh('Payout request submitted for review (mock workflow, no real settlement).')
  }

  function review(payoutId: string, status: 'approved' | 'rejected') {
    chemaStore.reviewPayout(item.id, payoutId, status, actor)
    refresh(`Payout request ${status} (mock workflow).`)
  }

  function assignCoordinator(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin || !coord.userId.trim() || !coord.name.trim()) return
    chemaStore.assignCoordinator(item.id, { userId: coord.userId.trim(), name: coord.name.trim(), phone: coord.phone.trim() || undefined }, actor)
    setCoord({ userId: '', name: '', phone: '' })
    refresh('Chema Coordinator assigned (no withdrawal/payout permissions granted).')
  }

  return (
    <section className="card stack" aria-labelledby="chema-title">
      <p className="eyebrow">Chema Wallet</p>
      <h2 id="chema-title" className="panel__title">Chema Contributions</h2>
      <p className="muted">Community support contributions for this funeral case. Digital payments are simulated; physical cash is recorded separately. Contributions are not Fidelity policy benefits or claims.</p>
      <Callout tone="warning"><strong>Demonstration prototype:</strong> no real EcoCash/OneMoney/card processing, no real money transfer, no withdrawals or settlements, and no card/PIN/OTP data stored.</Callout>
      {msg && <Callout tone="success">{msg}</Callout>}

      <div className="chema-stats">
        <div className="chema-stat"><p className="chema-stat__label">Wallet status</p><p className="chema-stat__value" style={{ fontSize: '1.1rem' }}>{item.activated ? 'Activated' : 'Not activated'}</p><p className="chema-stat__hint">Verified: {item.verified ? 'Yes' : 'No'} · Case: {item.caseRef}</p></div>
        <div className="chema-stat"><p className="chema-stat__label">Digital contributions</p><p className="chema-stat__value">{money(totals.digitalTotal)}</p><p className="chema-stat__hint">Successful simulated payments</p></div>
        <div className="chema-stat"><p className="chema-stat__label">Physical cash recorded</p><p className="chema-stat__value">{money(totals.cashTotal)}</p><p className="chema-stat__hint">Recorded separately</p></div>
        <div className="chema-stat"><p className="chema-stat__label">Contributors</p><p className="chema-stat__value">{totals.contributorCount}</p><p className="chema-stat__hint">{totals.pendingCount} pending · {totals.successfulCount} successful</p></div>
      </div>

      {isAdmin && (
        <div className="chema-actions">
          {!item.verified && <button type="button" className="btn btn--outline btn--sm" onClick={onVerify}><Icon name="shield" size={16} /> Verify funeral case</button>}
          <button type="button" className="btn btn--primary btn--sm" onClick={onActivate} disabled={item.activated || (!item.verified && !isAdmin)}>
            <Icon name="check" size={16} /> {item.activated ? 'Chema Wallet activated' : 'Verify & activate Chema Wallet'}
          </button>
        </div>
      )}

      {item.activated ? (
        <div className="chema-two">
          <div className="stack">
            <h3 style={{ margin: 0 }}>QR code and contribution link</h3>
            <div className="chema-qr">
              <img src={qrSrc} alt={`QR code for ${item.deceasedName} Chema contribution page`} />
              <div className="chema-linkbox" style={{ width: '100%' }}>
                <input className="input" readOnly value={url} aria-label="Contribution link" onFocus={(e) => e.currentTarget.select()} />
                <button type="button" className="btn btn--outline btn--sm" onClick={copyLink}>Copy link</button>
                <a className="btn btn--primary btn--sm" href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
              </div>
              <p className="chema-meta">This link identifies funeral case <strong>{item.caseRef}</strong> ({item.deceasedName}).</p>
            </div>
          </div>
          <div className="stack">
            <h3 style={{ margin: 0 }}>Coordinator & controls</h3>
            <p className="chema-meta"><strong>Coordinator:</strong> {item.coordinator ? `${item.coordinator.name} (${item.coordinator.userId}${item.coordinator.phone ? `, ${item.coordinator.phone}` : ''})` : 'Not assigned (demo)'}. Coordinators can view/share and record physical cash, but do not receive withdrawal or payout permissions automatically.</p>
            {isAdmin && (
              <form className="chema-form" onSubmit={assignCoordinator}>
                <h4 style={{ margin: '.25rem 0 0' }}>Assign Chema Coordinator</h4>
                <div className="chema-form-grid">
                  <label className="field"><span className="field__label">User ID</span><input className="input" value={coord.userId} onChange={(e) => setCoord({ ...coord, userId: e.target.value })} placeholder="e.g. u-sibanda" /></label>
                  <label className="field"><span className="field__label">Name</span><input className="input" value={coord.name} onChange={(e) => setCoord({ ...coord, name: e.target.value })} placeholder="Coordinator name" /></label>
                  <label className="field"><span className="field__label">Phone (optional)</span><input className="input" value={coord.phone} onChange={(e) => setCoord({ ...coord, phone: e.target.value })} /></label>
                </div>
                <button type="submit" className="btn btn--outline btn--sm">Assign coordinator</button>
              </form>
            )}
            {canManage && (
              <form className="chema-form" onSubmit={submitCash}>
                <h4 style={{ margin: '.25rem 0 0' }}>Record physical cash contribution separately</h4>
                <div className="chema-form-grid">
                  <label className="field"><span className="field__label">Amount (USD)</span><input className="input" type="number" min="0.01" step="0.01" required value={cash.amount} onChange={(e) => setCash({ ...cash, amount: e.target.value })} /></label>
                  <label className="field"><span className="field__label">Contributor name (if available)</span><input className="input" value={cash.contributorName} onChange={(e) => setCash({ ...cash, contributorName: e.target.value })} placeholder="Optional" /></label>
                </div>
                <label className="field"><span className="field__label">Note</span><input className="input" value={cash.note} onChange={(e) => setCash({ ...cash, note: e.target.value })} placeholder="e.g. collected at homestead" /></label>
                <button type="submit" className="btn btn--outline btn--sm">Record cash contribution</button>
              </form>
            )}
            {isAdmin && (
              <form className="chema-form" onSubmit={submitPayout} style={{ marginTop: '.5rem' }}>
                <h4 style={{ margin: '.25rem 0 0' }}>Payout request review (mock)</h4>
                <div className="chema-form-grid">
                  <label className="field"><span className="field__label">Amount (USD)</span><input className="input" type="number" min="0.01" step="0.01" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} /></label>
                  <label className="field"><span className="field__label">Note</span><input className="input" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} /></label>
                </div>
                <button type="submit" className="btn btn--outline btn--sm">Submit payout request</button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <p className="chema-meta">Activate Chema Wallet for this verified funeral case to generate a contribution link, QR code and sharing options.</p>
      )}

      <div className="stack">
        <h3 style={{ margin: 0 }}>Contribution history</h3>
        <div className="chema-table-wrap">
          <table className="chema-table">
            <thead><tr><th>Date</th><th>Contributor</th><th>Type</th><th>Method</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>
              {contributions.length ? contributions.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.createdAt).toLocaleString('en-GB')}</td>
                  <td>{c.anonymous ? 'Anonymous' : c.contributorName}{c.recordedBy ? <div className="chema-meta">Recorded by {c.recordedBy}</div> : null}</td>
                  <td>{c.kind === 'cash' ? 'Physical cash (recorded)' : 'Digital (simulated)'}</td>
                  <td>{c.kind === 'cash' ? '—' : c.method}</td>
                  <td>{money(c.amount)}</td>
                  <td><span className={`chema-badge ${c.status === 'successful' ? 'chema-badge--success' : c.status === 'pending' ? 'chema-badge--warn' : 'chema-badge--muted'}`}>{c.status}</span></td>
                  <td className="chema-meta">{c.receiptRef}{c.simulated ? ' · Demo receipt' : ''}</td>
                </tr>
              )) : <tr><td colSpan={7} className="chema-meta">No contributions recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chema-two">
        <div className="stack">
          <h3 style={{ margin: 0 }}>Payout request review and approval (mock)</h3>
          {item.payoutRequests.length ? item.payoutRequests.map((p) => (
            <div key={p.id} className="chema-row">
              <div><strong>{money(p.amount)}</strong><div className="chema-meta">Requested by {p.requestedBy} · {new Date(p.requestedAt).toLocaleString('en-GB')}</div><div className="chema-meta">{p.note}</div></div>
              <div className="chema-actions">
                <span className={`chema-badge ${p.status === 'approved' ? 'chema-badge--success' : p.status === 'requested' ? 'chema-badge--warn' : 'chema-badge--muted'}`}>{p.status}</span>
                {isAdmin && p.status === 'requested' && <>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => review(p.id, 'approved')}>Approve</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => review(p.id, 'rejected')}>Reject</button>
                </>}
              </div>
            </div>
          )) : <p className="chema-meta">No payout requests yet. Payouts are mock workflows only; no real settlements occur.</p>}
        </div>
        <div className="stack">
          <h3 style={{ margin: 0 }}>Audit history</h3>
          <div className="chema-audit">
            {item.audit.map((a) => (
              <article key={a.id} className="chema-audit__item">
                <div><strong>{a.action}</strong><div className="chema-meta">{a.details}</div></div>
                <div className="chema-meta" style={{ textAlign: 'right' }}>{a.by}<br />{new Date(a.at).toLocaleString('en-GB')}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
