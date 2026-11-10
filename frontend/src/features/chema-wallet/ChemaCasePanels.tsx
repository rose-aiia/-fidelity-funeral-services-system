import { useState, type FormEvent } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import {
  activeHoldsForCase,
  auditForCase,
  availableCommunityBalance,
  committedPayoutTotal,
  contributionTotals,
  contributionsForCase,
  disputeStatusLabels,
  evidenceLabels,
  heldTotal,
  ledgerForCase,
  ledgerSourceLabels,
  money,
  pendingTributes,
  reasonCodes,
  requiredEvidence,
  type ChemaActor,
  type ChemaCase,
  type ChemaCommandResult,
  type ChemaState,
  type LedgerEntry,
} from './data'
import { chemaStore } from './store'
import { CaseStatusChip, DisputeStatusChip, EmptyState, PayoutStatusChip, QrCode, ShareLinkBox } from './ChemaUI'

export type Commit = (result: ChemaCommandResult<unknown>, success: string) => void

export type PanelProps = {
  item: ChemaCase
  state: ChemaState
  actor: ChemaActor
  isAdmin: boolean
  canManage: boolean
  canApprove: boolean
  commit: Commit
}

function csvCell(value: string | number | undefined) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(name: string, rows: Array<Array<string | number | undefined>>) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function VerificationPanel({ item, actor, isAdmin, canManage, commit }: PanelProps) {
  const [reasonCode, setReasonCode] = useState(item.verification.reasonCode ?? 'VER-OK')
  const [note, setNote] = useState('')
  const present = new Set(item.verification.evidence.map((evidence) => evidence.type))
  const missing = requiredEvidence.filter((type) => !present.has(type))
  const maySubmit = ['draft', 'returned', 'rejected'].includes(item.status)
  const awaitingDecision = ['submitted', 'under_review'].includes(item.status)

  function attach() {
    commit(chemaStore.attachSampleEvidence(item.id, actor), 'Sample evidence attached. Review it, then submit the case.')
  }

  function submitForReview() {
    commit(chemaStore.submitForVerification(item.id, actor), 'Case submitted for community verification. Public sharing remains disabled.')
  }

  function decide(decision: 'approved' | 'returned' | 'rejected') {
    commit(
      chemaStore.decideVerification(item.id, decision, actor, reasonCode, note.trim() || undefined),
      decision === 'approved' ? 'Community verification approved. Activate the public page when ready.' : decision === 'returned' ? 'Case returned for correction. The family can resubmit.' : 'Community verification rejected.',
    )
    setNote('')
  }

  return (
    <div className="cw-tab-grid">
      <section className="cw-panel" aria-labelledby="cw-evidence-title">
        <div className="cw-panel__head">
          <div>
            <p className="cw-eyebrow">Community verification</p>
            <h2 id="cw-evidence-title" className="cw-panel__title">Evidence checklist</h2>
          </div>
          <StatusChip tone={item.verification.status === 'approved' ? 'success' : item.verification.status === 'rejected' ? 'danger' : 'warning'}>
            {item.verification.status.replace(/_/g, ' ')}
          </StatusChip>
        </div>
        <p className="cw-panel__lead">This workflow confirms the funeral case and the wallet administrator&rsquo;s authority. It is deliberately separate from Fidelity policy and claim adjudication.</p>

        <ul className="cw-checklist">
          {requiredEvidence.map((type) => {
            const attached = present.has(type)
            return (
              <li key={type} className={attached ? 'is-complete' : ''}>
                <span className="cw-checklist__mark"><Icon name={attached ? 'check' : 'file'} size={16} /></span>
                <span><strong>{evidenceLabels[type]}</strong><small>{attached ? 'Attached and available to the reviewer' : 'Required before the case can be submitted'}</small></span>
              </li>
            )
          })}
        </ul>

        {item.verification.evidence.length > 0 && (
          <div className="cw-evidence-list">
            {item.verification.evidence.map((evidence) => (
              <article key={evidence.id} className="cw-evidence">
                <span className="cw-evidence__icon"><Icon name="file" size={17} /></span>
                <div>
                  <strong>{evidence.label}</strong>
                  <p>{evidence.fileName}</p>
                  <div className="cw-inline-meta">
                    <span>Uploaded by {evidence.uploadedBy}</span>
                    <span><StatusChip tone={evidence.scan === 'clean' ? 'success' : 'warning'}>{evidence.scan === 'clean' ? 'Scan clean' : 'Scan pending'}</StatusChip></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {(canManage || isAdmin) && maySubmit && (
          <div className="cw-action-row">
            {missing.length > 0 && <button type="button" className="btn btn--outline btn--sm" onClick={attach}><Icon name="plus" size={16} /> Attach sample evidence</button>}
            <button type="button" className="btn btn--primary btn--sm" onClick={submitForReview} disabled={missing.length > 0}>
              <Icon name="shield" size={16} /> Submit for verification
            </button>
          </div>
        )}
        {missing.length > 0 && maySubmit && <p className="cw-inline-note">Add the {missing.length} missing evidence item{missing.length === 1 ? '' : 's'} to continue. In production, uploads would use an approved secure channel with malware scanning.</p>}
      </section>

      <section className="cw-panel" aria-labelledby="cw-decision-title">
        <div className="cw-panel__head">
          <div>
            <p className="cw-eyebrow">Reviewer decision</p>
            <h2 id="cw-decision-title" className="cw-panel__title">Verification record</h2>
          </div>
        </div>

        {item.verification.decisions.length > 0 ? (
          <div className="cw-decision-list">
            {item.verification.decisions.map((decision) => (
              <article key={`${decision.at}-${decision.reasonCode}`} className="cw-decision">
                <div className="cw-decision__top">
                  <StatusChip tone={decision.decision === 'approved' ? 'success' : decision.decision === 'returned' ? 'warning' : 'danger'}>{decision.decision}</StatusChip>
                  <span className="cw-inline-note">{new Date(decision.at).toLocaleString('en-GB')}</span>
                </div>
                <p><strong>{decision.reasonCode}</strong> · {reasonCodes[decision.reasonCode] ?? 'Reviewer reason code'}</p>
                {decision.note && <p>{decision.note}</p>}
                <p className="cw-inline-note">Recorded by {decision.by}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="cw-empty-inline"><Icon name="clock" size={18} /><p>No reviewer decision has been recorded yet.</p></div>
        )}

        {awaitingDecision && isAdmin && (
          <form className="cw-form cw-form--boxed" onSubmit={(event: FormEvent) => { event.preventDefault(); decide('approved') }}>
            <div className="cw-panel__head" style={{ marginBottom: 0 }}>
              <h3 style={{ margin: 0 }}>Record a decision</h3>
              <span className="cw-inline-note">Reviewer: {actor.name}</span>
            </div>
            <label className="field">
              <span className="field__label">Reason code</span>
              <select className="select" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
                {(item.status === 'under_review' && missing.length > 0 ? ['VER-EVIDENCE', 'VER-IDENTITY', 'VER-DUPLICATE', 'VER-OTHER'] : Object.keys(reasonCodes)).map((code) => (
                  <option key={code} value={code}>{code} · {reasonCodes[code]}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Reviewer note <span className="field__tag">Optional for approval</span></span>
              <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What evidence was examined? What must the family correct?" />
            </label>
            <div className="cw-action-row">
              <button type="submit" className="btn btn--primary btn--sm"><Icon name="check" size={16} /> Approve community verification</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => decide('returned')}>Return for correction</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => decide('rejected')}>Reject</button>
            </div>
          </form>
        )}

        {awaitingDecision && !isAdmin && (
          <Callout tone="info">The case is in the verification queue. In this demo, sign in as the administrator persona to record the reviewer decision.</Callout>
        )}

        {item.status === 'verified' && (
          <Callout tone="success">Community verification approved. This confirms the funeral case and wallet authority only — it is not proof of Fidelity cover or claim approval.</Callout>
        )}
      </section>
    </div>
  )
}

function PayoutApprovalCard({ payout, actor, canApprove, commit }: { payout: ChemaState['payouts'][number]; actor: ChemaActor; canApprove: boolean; commit: Commit }) {
  const [note, setNote] = useState('')
  const [showTools, setShowTools] = useState(false)
  const approved = payout.approvals.filter((approval) => approval.decision === 'approved').length
  const alreadyDecided = payout.approvals.some((approval) => approval.byUserId === actor.id)
  const canSelfApprove = canApprove && payout.requestedByUserId !== actor.id && !alreadyDecided
  const demoApprovers = [
    { id: 'u-ndlovu', name: 'Thabo Ndlovu', label: 'Family approver' },
    { id: 'u-finance-ops', name: 'Finance operations', label: 'Finance reviewer' },
  ].filter((person) => person.id !== payout.requestedByUserId && !payout.approvals.some((approval) => approval.byUserId === person.id))

  function review(decision: 'approved' | 'rejected', approver: ChemaActor) {
    commit(chemaStore.reviewPayout(payout.id, decision, approver, note.trim() || undefined), decision === 'approved' ? `Approval recorded by ${approver.name}.` : `Payout rejected by ${approver.name}. The commitment is released.`)
    setNote('')
  }

  return (
    <article className="cw-payout">
      <div className="cw-payout__top">
        <div>
          <div className="cw-payout__amount-row"><strong>{money(payout.amount)}</strong><PayoutStatusChip status={payout.status} /></div>
          <p className="cw-payout__purpose">{payout.purpose}</p>
          <p className="cw-inline-note">Requested by {payout.requestedBy} · {new Date(payout.requestedAt).toLocaleString('en-GB')} · {payout.destinationMasked}</p>
        </div>
        <div className="cw-approval-count"><span>{approved}/{payout.requiredApprovals}</span><small>approvals</small></div>
      </div>

      <div className="cw-approval-track" aria-label={`${approved} of ${payout.requiredApprovals} approvals recorded`}>
        {Array.from({ length: payout.requiredApprovals }).map((_, index) => (
          <span key={index} className={index < approved ? 'is-on' : ''} />
        ))}
      </div>

      {payout.approvals.length > 0 && (
        <ul className="cw-approval-list">
          {payout.approvals.map((approval) => (
            <li key={`${approval.byUserId}-${approval.at}`}>
              <span><Icon name={approval.decision === 'approved' ? 'check' : 'alert'} size={14} /> {approval.by}</span>
              <span>{approval.decision === 'approved' ? 'Approved' : 'Rejected'} · {new Date(approval.at).toLocaleDateString('en-GB')}</span>
            </li>
          ))}
        </ul>
      )}

      {payout.status === 'awaiting_approval' && (
        <div className="cw-payout__actions">
          <label className="field cw-field--tight"><span className="field__label">Approval note <span className="field__tag">optional</span></span><input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Evidence reviewed or reason for rejection" /></label>
          <div className="cw-action-row">
            {canSelfApprove ? (
              <>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => review('approved', actor)}>Approve as {actor.name}</button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => review('rejected', actor)}>Reject</button>
              </>
            ) : (
              <p className="cw-inline-note">
                {payout.requestedByUserId === actor.id
                  ? 'Maker-checker: you requested this payout, so you cannot approve it. A different approver is required.'
                  : 'This payout needs an independent approver. Sign in as an administrator or family approver to act.'}
              </p>
            )}
            {canApprove && demoApprovers.length > 0 && (
              <button type="button" className="link-button" onClick={() => setShowTools((value) => !value)}>
                {showTools ? 'Hide demo approvers' : 'Simulate another approver (demo)'}
              </button>
            )}
          </div>
          {showTools && canApprove && (
            <div className="cw-demo-approvers">
              <p className="cw-inline-note">Demonstration only: these buttons record another person&rsquo;s decision so the maker-checker journey can be completed without extra sign-ins.</p>
              {demoApprovers.map((person) => (
                <div key={person.id} className="cw-demo-approvers__row">
                  <span><strong>{person.name}</strong><small>{person.label}</small></span>
                  <div className="cw-action-row">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => review('approved', { id: person.id, name: person.name })}>Approve as {person.name}</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => review('rejected', { id: person.id, name: person.name })}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {payout.status === 'initiated' && (
        <div className="cw-payout__actions">
          <Callout tone="info">Approvals complete. The instruction is with the provider (simulated). No payout is marked complete until settlement is confirmed.</Callout>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => commit(chemaStore.settlePayout(payout.id, actor), 'Provider settlement confirmed (simulated). The ledger now records the payout.')}>
            <Icon name="check" size={16} /> Settle payout (demo)
          </button>
        </div>
      )}

      {payout.status === 'paid' && (
        <p className="cw-inline-note"><Icon name="check" size={14} /> Settled {payout.paidAt ? new Date(payout.paidAt).toLocaleString('en-GB') : ''} · provider reference {payout.providerRef ?? 'demo'}</p>
      )}
      {payout.note && <p className="cw-inline-note">Request note: {payout.note}</p>}
    </article>
  )
}

export function PayoutsPanel({ item, state, actor, canManage, canApprove, commit }: PanelProps) {
  const payouts = state.payouts.filter((payout) => payout.caseId === item.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  const available = availableCommunityBalance(state, item.id)
  const committed = committedPayoutTotal(state, item.id)
  const held = heldTotal(state, item.id)
  const [form, setForm] = useState({ amount: '', purpose: '', destination: '', note: '' })

  function submit(event: FormEvent) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    const result = chemaStore.requestPayout(item.id, { amount, purpose: form.purpose, destination: form.destination, note: form.note }, actor)
    commit(result, 'Payout request submitted. It now needs independent approval before anything is sent to a provider.')
    if (result.ok) setForm({ amount: '', purpose: '', destination: '', note: '' })
  }

  return (
    <div className="cw-tab-grid">
      <section className="cw-panel" aria-labelledby="cw-payout-request-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Controlled payout</p><h2 id="cw-payout-request-title" className="cw-panel__title">Request a payout</h2></div>
          <StatusChip tone={available > 0 ? 'info' : 'neutral'}>{money(available)} available</StatusChip>
        </div>
        <p className="cw-panel__lead">Only settled community money can be requested. High-value requests need two independent approvals and the requester can never approve their own instruction.</p>

        <div className="cw-balance-breakdown">
          <div><span>Confirmed community credits</span><strong>{money(contributionTotals(contributionsForCase(state, item.id)).digitalTotal)}</strong></div>
          <div><span>Payout commitments</span><strong>− {money(committed)}</strong></div>
          <div><span>Source-specific holds</span><strong>− {money(held)}</strong></div>
          <div className="is-total"><span>Available to request</span><strong>{money(available)}</strong></div>
        </div>

        {canManage && item.status === 'verified' ? (
          <form className="cw-form cw-form--boxed" onSubmit={submit}>
            <div className="cw-form-grid">
              <label className="field"><span className="field__label">Amount (USD)</span><input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="e.g. 120.00" required /></label>
              <label className="field"><span className="field__label">Approved destination</span><input className="input" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="e.g. EcoCash ···· 0241" required /></label>
            </div>
            <label className="field"><span className="field__label">Purpose</span><input className="input" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="What will this payout pay for?" required /></label>
            <label className="field"><span className="field__label">Note <span className="field__tag">optional</span></span><input className="input" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Supporting evidence or family instruction" /></label>
            <p className="cw-inline-note">Requests of {money(item.approvalThreshold)} or more need two approvals. This demonstration does not contact a payment provider.</p>
            <button type="submit" className="btn btn--primary btn--sm" disabled={available <= 0}>Submit payout request</button>
          </form>
        ) : (
          <Callout tone={item.status === 'verified' ? 'info' : 'warning'}>
            {item.status !== 'verified' ? 'The case must be verified before a payout can be requested.' : 'You are viewing this case without wallet administrator authority. Sign in as the administrator persona to request a payout in the demo.'}
          </Callout>
        )}
      </section>

      <section className="cw-panel" aria-labelledby="cw-payout-history-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Maker-checker</p><h2 id="cw-payout-history-title" className="cw-panel__title">Payout requests</h2></div>
          <span className="cw-panel__hint">{payouts.length} request{payouts.length === 1 ? '' : 's'}</span>
        </div>
        {payouts.length === 0 ? (
          <EmptyState icon="wallet" title="No payouts requested">Payout requests and their approvals will appear here.</EmptyState>
        ) : (
          <div className="cw-payout-list">
            {payouts.map((payout) => (
              <PayoutApprovalCard key={payout.id} payout={payout} actor={actor} canApprove={canApprove} commit={commit} />
            ))}
          </div>
        )}
        <div className="cw-control-note">
          <Icon name="lock" size={16} />
          <p><strong>Source-aware control:</strong> a hold on a disputed community payment does not freeze an unrelated Fidelity benefit. Fidelity benefit payouts also require the legally approved recipient; this demo never credits or routes a claim.</p>
        </div>
      </section>
    </div>
  )
}

export function LedgerPanel({ item, state }: PanelProps) {
  const entries = ledgerForCase(state, item.id)
  const totals = contributionTotals(contributionsForCase(state, item.id))
  const committed = committedPayoutTotal(state, item.id)
  const held = heldTotal(state, item.id)
  const available = availableCommunityBalance(state, item.id)

  function exportLedger() {
    downloadCsv(`chema-ledger-${item.caseRef}.csv`, [
      ['Date', 'Source', 'Account', 'Direction', 'Amount', 'Currency', 'Posting reference', 'Description', 'Memo'],
      ...entries.map((entry: LedgerEntry) => [entry.at, ledgerSourceLabels[entry.source], entry.account, entry.direction, entry.amount.toFixed(2), entry.currency, entry.postingRef, entry.description, entry.memo ? 'yes' : 'no']),
    ])
  }

  return (
    <div className="cw-tab-grid">
      <section className="cw-panel" aria-labelledby="cw-ledger-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Source-separated records</p><h2 id="cw-ledger-title" className="cw-panel__title">Community ledger</h2></div>
          <button type="button" className="btn btn--outline btn--sm" onClick={exportLedger}><Icon name="download" size={16} /> Export CSV</button>
        </div>
        <p className="cw-panel__lead">Every financial event posts a balanced pair. Entries are append-only: corrections create linked reversals rather than editing history.</p>

        <div className="cw-balance-breakdown cw-balance-breakdown--compact">
          <div><span>Confirmed community credits</span><strong>{money(totals.digitalTotal)}</strong></div>
          <div><span>Committed to payouts</span><strong>− {money(committed)}</strong></div>
          <div><span>Active source holds</span><strong>− {money(held)}</strong></div>
          <div className="is-total"><span>Community available</span><strong>{money(available)}</strong></div>
          <div><span>Cash recorded (memo only)</span><strong>{money(totals.cashTotal)}</strong></div>
        </div>

        <div className="cw-table-wrap">
          <table className="cw-table cw-table--ledger">
            <thead><tr><th scope="col">Date</th><th scope="col">Source</th><th scope="col">Account</th><th scope="col">Debit</th><th scope="col">Credit</th><th scope="col">Reference</th><th scope="col">Description</th></tr></thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.at).toLocaleDateString('en-GB')}</td>
                  <td><span className={`cw-source-tag cw-source-tag--${entry.source === 'cash' ? 'cash' : entry.source === 'payout' ? 'payout' : 'community'}`}>{ledgerSourceLabels[entry.source]}</span></td>
                  <td className="cw-table__mono">{entry.account}</td>
                  <td className="cw-table__amount">{entry.direction === 'debit' ? money(entry.amount) : '—'}</td>
                  <td className="cw-table__amount">{entry.direction === 'credit' ? money(entry.amount) : '—'}</td>
                  <td className="cw-table__ref">{entry.postingRef}{entry.memo ? ' · memo' : ''}</td>
                  <td>{entry.description}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={7} className="cw-table__empty">No ledger entries yet. A contribution posts only after provider confirmation.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export function PrivacyPanel({ item, state, actor, isAdmin, commit }: PanelProps) {
  const [reason, setReason] = useState('')
  const publicUrl = `${window.location.origin}/contribute/${item.contributionToken}`
  const publishedTributes = pendingTributes(state, item.id)
  const disputes = state.disputes.filter((dispute) => dispute.caseId === item.id)
  const holds = activeHoldsForCase(state, item.id)

  const toggles: Array<{ key: keyof typeof item.privacy; label: string; hint: string }> = [
    { key: 'showDeceasedName', label: 'Show the deceased’s name', hint: 'The public page always reveals the case reference; the name can be hidden.' },
    { key: 'showAmounts', label: 'Show contribution amounts', hint: 'Hide individual/raised amounts while keeping receipts private to contributors.' },
    { key: 'showProgress', label: 'Show progress towards the target', hint: 'The progress bar can be hidden even if amounts are visible.' },
    { key: 'showTributes', label: 'Publish approved tributes', hint: 'Only messages explicitly approved by a moderator appear publicly.' },
    { key: 'showContributors', label: 'Show contributor display names', hint: 'Anonymous contributions never expose an identity, even when display names are on.' },
  ]

  function toggle(key: keyof typeof item.privacy, value: boolean) {
    commit(chemaStore.updatePrivacy(item.id, { [key]: value }, actor), 'Public privacy settings updated. The change applies to the public page immediately.')
  }

  function suspend(event: FormEvent) {
    event.preventDefault()
    const result = chemaStore.suspendCase(item.id, actor, reason)
    commit(result, 'Case suspended. The public contribution page is no longer available.')
    if (result.ok) setReason('')
  }

  return (
    <div className="cw-tab-grid">
      <section className="cw-panel" aria-labelledby="cw-privacy-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Consent and visibility</p><h2 id="cw-privacy-title" className="cw-panel__title">Public page privacy</h2></div>
          {item.activated ? <StatusChip tone="success">Public page live</StatusChip> : <StatusChip tone="neutral">Public page inactive</StatusChip>}
        </div>
        <p className="cw-panel__lead">Only family-approved fields are published. Identity documents, contact details, receipts and claim data are never shown on the public page.</p>

        <div className="cw-toggle-list">
          {toggles.map((toggleItem) => (
            <label key={toggleItem.key} className="cw-toggle-row">
              <span><strong>{toggleItem.label}</strong><small>{toggleItem.hint}</small></span>
              <input type="checkbox" checked={item.privacy[toggleItem.key]} onChange={(event) => toggle(toggleItem.key, event.target.checked)} />
            </label>
          ))}
        </div>

        {item.activated ? (
          <div className="cw-public-preview">
            <p className="cw-eyebrow">Public preview</p>
            <h3>{item.privacy.showDeceasedName ? `Support the family of ${item.deceasedName}` : 'Support a verified funeral case'}</h3>
            <p>{item.funeralInfo}</p>
            <div className="cw-public-preview__row">
              <span>Case {item.caseRef}</span>
              <StatusChip tone="success">Community verified</StatusChip>
              <span>{item.privacy.showTributes ? `${publishedTributes.length} tribute${publishedTributes.length === 1 ? '' : 's'} published` : 'Tributes hidden'}</span>
            </div>
            <ShareLinkBox url={publicUrl} compact />
          </div>
        ) : (
          <Callout tone="info">Activate the public page from the overview to generate the link and QR code. Verification must be approved first.</Callout>
        )}
      </section>

      <section className="cw-panel" aria-labelledby="cw-safety-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Safety controls</p><h2 id="cw-safety-title" className="cw-panel__title">Holds and suspension</h2></div>
        </div>
        <div className="cw-safety-block">
          <h3>Active holds</h3>
          {holds.length === 0 ? <p className="cw-inline-note">No active holds on this case.</p> : holds.map((hold) => (
            <article key={hold.id} className="cw-hold">
              <div><strong>{money(hold.amount)} · {ledgerSourceLabels[hold.source]}</strong><p>{hold.reason}</p><span className="cw-inline-note">Placed by {hold.createdBy} · {new Date(hold.createdAt).toLocaleDateString('en-GB')}</span></div>
              <StatusChip tone="warning">Active</StatusChip>
            </article>
          ))}
        </div>

        <div className="cw-safety-block">
          <h3>Disputes and reports</h3>
          {disputes.length === 0 ? <p className="cw-inline-note">No disputes or public reports for this case.</p> : disputes.map((dispute) => (
            <article key={dispute.id} className="cw-hold">
              <div><strong>{dispute.category} · {dispute.owner}</strong><p>{dispute.summary}</p><span className="cw-inline-note">{new Date(dispute.createdAt).toLocaleString('en-GB')}</span></div>
              <DisputeStatusChip status={dispute.status} />
            </article>
          ))}
        </div>

        {isAdmin && item.status === 'verified' && (
          <form className="cw-form cw-form--boxed" onSubmit={suspend}>
            <h3 style={{ margin: 0 }}>Suspend this case</h3>
            <p className="cw-inline-note">Suspension immediately removes public contribution capability. It must be recorded with a reason and reviewed.</p>
            <label className="field"><span className="field__label">Reason</span><input className="input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. family authority dispute" required /></label>
            <button type="submit" className="btn btn--outline btn--sm">Suspend public page</button>
          </form>
        )}
        {item.status === 'suspended' && (
          <div className="cw-safety-block">
            <Callout tone="danger">This case is suspended. Public contributions and QR sharing are disabled.</Callout>
            {isAdmin && <button type="button" className="btn btn--outline btn--sm" onClick={() => commit(chemaStore.resumeCase(item.id, actor), 'Suspension lifted. Reactivate the public page only after the review is complete.')}>Lift suspension (admin)</button>}
          </div>
        )}
        {!isAdmin && <p className="cw-inline-note">Only the Fidelity operations role can suspend or lift a suspension in this demo.</p>}
      </section>
    </div>
  )
}

export function AuditPanel({ item, state }: PanelProps) {
  const entries = auditForCase(state, item.id)
  const disputes = state.disputes.filter((dispute) => dispute.caseId === item.id)

  function exportAudit() {
    downloadCsv(`chema-audit-${item.caseRef}.csv`, [
      ['Timestamp', 'Actor', 'Kind', 'Action', 'Details'],
      ...entries.map((entry) => [entry.at, entry.by, entry.kind, entry.action, entry.details]),
    ])
  }

  return (
    <div className="cw-tab-grid">
      <section className="cw-panel" aria-labelledby="cw-audit-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Traceability</p><h2 id="cw-audit-title" className="cw-panel__title">Case audit trail</h2></div>
          <button type="button" className="btn btn--outline btn--sm" onClick={exportAudit}><Icon name="download" size={16} /> Export audit CSV</button>
        </div>
        <p className="cw-panel__lead">Every state change records the actor, time and reason. Posted financial entries cannot be deleted or silently edited.</p>
        <ol className="cw-timeline">
          {entries.map((entry) => (
            <li key={entry.id} className="cw-timeline__item">
              <span className="cw-timeline__dot"><Icon name={entry.kind === 'verification' ? 'shield' : entry.kind === 'payout' ? 'wallet' : entry.kind === 'privacy' ? 'lock' : entry.kind === 'ledger' ? 'history' : 'clock'} size={14} /></span>
              <div className="cw-timeline__body">
                <div className="cw-timeline__top"><strong>{entry.action}</strong><StatusChip tone="neutral">{entry.kind}</StatusChip></div>
                {entry.details && <p>{entry.details}</p>}
                <span className="cw-inline-note">{entry.by} · {new Date(entry.at).toLocaleString('en-GB')}</span>
              </div>
            </li>
          ))}
          {entries.length === 0 && <li className="cw-empty-inline">No audit entries yet.</li>}
        </ol>
      </section>

      <aside className="cw-panel cw-audit-summary" aria-labelledby="cw-audit-summary-title">
        <p className="cw-eyebrow">Audit pack</p>
        <h2 id="cw-audit-summary-title" className="cw-panel__title">What is recorded</h2>
        <ul className="cw-check-list">
          <li>Case status and verification decisions, including reason codes.</li>
          <li>Every contribution intent, provider result and receipt reference.</li>
          <li>Payout requester, each approval and settlement confirmation.</li>
          <li>Privacy changes, suspensions, disputes and holds.</li>
          <li>Source-separated ledger postings with immutable posting references.</li>
        </ul>
        <p className="cw-inline-note">{disputes.length} dispute{disputes.length === 1 ? '' : 's'} linked to this case. Export produces a demonstration CSV only; production exports would be access-logged and access-controlled.</p>
      </aside>
    </div>
  )
}

export function OverviewDisputes({ disputes }: { disputes: ChemaState['disputes'] }) {
  return (
    <div className="cw-dispute-list">
      {disputes.map((dispute) => (
        <article key={dispute.id} className="cw-dispute">
          <div><strong>{dispute.category} · {dispute.owner}</strong><p>{dispute.summary}</p><span className="cw-inline-note">{disputeStatusLabels[dispute.status]} · {new Date(dispute.updatedAt).toLocaleDateString('en-GB')}</span></div>
          <DisputeStatusChip status={dispute.status} />
        </article>
      ))}
    </div>
  )
}

export function PublicPageCard({ item, publicUrl, canManage, actor, commit }: { item: ChemaCase; publicUrl: string; canManage: boolean; actor: ChemaActor; commit: Commit }) {
  const active = item.activated && item.status === 'verified'
  if (!active) {
    return (
      <section className="cw-panel cw-public-card" aria-labelledby="cw-public-title">
        <div className="cw-panel__head">
          <div><p className="cw-eyebrow">Public page</p><h2 id="cw-public-title" className="cw-panel__title">Not active</h2></div>
          <StatusChip tone="neutral">Inactive</StatusChip>
        </div>
        <p className="cw-panel__lead">
          {item.status !== 'verified'
            ? 'The public link, QR code and contribution acceptance stay disabled until community verification is approved.'
            : 'The case is verified but the public page has not been activated. Activation is a separate, explicit step.'}
        </p>
        {canManage && item.status === 'verified' && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => commit(chemaStore.activateWallet(item.id, actor), 'Public contribution page activated. The link and QR code are ready to share.')}>
            <Icon name="check" size={16} /> Activate public page
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="cw-panel cw-public-card" aria-labelledby="cw-public-title">
      <div className="cw-panel__head">
        <div><p className="cw-eyebrow">Public page</p><h2 id="cw-public-title" className="cw-panel__title">Live and verified</h2></div>
        <StatusChip tone="success">Sharing enabled</StatusChip>
      </div>
      <div className="cw-public-card__body">
        <QrCode value={publicUrl} size={148} />
        <div className="cw-public-card__share">
          <p className="cw-panel__lead">Share this link with family, friends, church members and workmates. It resolves only to the public fields approved for this case.</p>
          <ShareLinkBox url={publicUrl} compact />
        </div>
      </div>
    </section>
  )
}

export function CaseStatusLine({ item }: { item: ChemaCase }) {
  return (
    <div className="cw-status-line">
      <CaseStatusChip status={item.status} />
      <StatusChip tone={item.verification.status === 'approved' ? 'success' : item.verification.status === 'rejected' ? 'danger' : 'warning'}>
        {item.verification.status === 'approved' ? 'Community verified' : item.verification.status === 'pending' ? 'Verification pending' : item.verification.status.replace(/_/g, ' ')}
      </StatusChip>
      {item.activated && item.status === 'verified' && <StatusChip tone="success">Public page live</StatusChip>}
      {item.status === 'suspended' && <StatusChip tone="danger">Contributions disabled</StatusChip>}
    </div>
  )
}
