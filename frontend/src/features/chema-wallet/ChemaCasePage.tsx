import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { contributePath, funeralRecordPath, paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import {
  activeHoldsForCase,
  availableCommunityBalance,
  caseProgress,
  contributionStatusLabels,
  contributionTotals,
  contributionsForCase,
  disputesForCase,
  isPubliclyActive,
  money,
  pendingTributes,
  type ChemaCommandResult,
  type ChemaContribution,
  type ChemaState,
} from './data'
import { chemaStore } from './store'
import { CaseProgressSummary, EmptyState, SourceCard } from './ChemaUI'
import {
  AuditPanel,
  CaseStatusLine,
  LedgerPanel,
  OverviewDisputes,
  PayoutsPanel,
  PrivacyPanel,
  PublicPageCard,
  VerificationPanel,
  type Commit,
} from './ChemaCasePanels'
import './chema-wallet.css'

type TabKey = 'overview' | 'contributions' | 'payouts' | 'verification' | 'ledger' | 'privacy' | 'audit'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'contributions', label: 'Contributions' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'verification', label: 'Verification' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'privacy', label: 'Privacy & controls' },
  { key: 'audit', label: 'Audit' },
]

function contributionTone(status: ChemaContribution['status']) {
  if (status === 'successful') return 'success' as const
  if (status === 'pending' || status === 'initiated') return 'warning' as const
  if (status === 'failed' || status === 'reversed') return 'danger' as const
  return 'neutral' as const
}

function contributionFilter(item: ChemaContribution, filter: string) {
  if (filter === 'confirmed') return item.status === 'successful'
  if (filter === 'pending') return item.status === 'pending' || item.status === 'initiated'
  if (filter === 'failed') return item.status === 'failed'
  if (filter === 'cash') return item.kind === 'cash'
  return true
}

function mandateLabel(role: 'administrator' | 'approver' | 'coordinator') {
  if (role === 'administrator') return 'Wallet administrator'
  if (role === 'approver') return 'Additional approver'
  return 'Coordinator'
}

export default function ChemaCasePage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState(() => chemaStore.getState())
  const [tab, setTab] = useState<TabKey>('overview')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [cash, setCash] = useState({ amount: '', contributorName: '', note: '' })

  const item = state.cases.find((entry) => entry.id === id)
  if (!item) {
    return (
      <div className="page-stack">
        <div className="card empty empty--large">
          <h1 className="panel__title">Chema Wallet case not found</h1>
          <p className="muted">This case may have been removed from the demonstration, or the link is incomplete.</p>
          <Link className="btn btn--primary" to={paths.accountChemaWallet}>Back to Chema Wallet</Link>
        </div>
      </div>
    )
  }

  const actor = { id: user?.id ?? 'demo-user', name: user?.name ?? 'Demo user' }
  const isAdmin = user?.role === 'admin'
  const member = item.mandate.find((person) => person.userId === user?.id)
  const canManage = isAdmin || member?.role === 'administrator'
  const canApprove = isAdmin || member?.role === 'administrator' || member?.role === 'approver'
  const contributions = contributionsForCase(state, item.id)
  const totals = contributionTotals(contributions)
  const progress = caseProgress(item, contributions)
  const available = availableCommunityBalance(state, item.id)
  const payouts = state.payouts.filter((payout) => payout.caseId === item.id)
  const openApprovals = payouts.filter((payout) => payout.status === 'awaiting_approval').length
  const disputes = disputesForCase(state, item.id)
  const openDisputes = disputes.filter((dispute) => ['raised', 'triaged', 'investigating'].includes(dispute.status))
  const holds = activeHoldsForCase(state, item.id)
  const publicUrl = `${window.location.origin}${contributePath(item.contributionToken)}`
  const active = isPubliclyActive(item)
  const groupedContributions = contributions.filter((entry) => contributionFilter(entry, filter))
  const queues = pendingTributes(state, item.id)

  function commit(result: ChemaCommandResult<unknown>, success: string) {
    if (!result.ok) {
      setError(result.error)
      setMsg('')
      return
    }
    setState(result.state)
    setError('')
    setMsg(success)
    window.setTimeout(() => setMsg(''), 5000)
  }

  function recordCash(event: React.FormEvent) {
    event.preventDefault()
    if (!item) return
    const amount = Number(cash.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    const result = chemaStore.recordCashContribution(item.id, { amount, contributorName: cash.contributorName, note: cash.note }, actor)
    commit(result, 'Physical cash recorded separately. It is not counted as digital money available for payout.')
    if (result.ok) setCash({ amount: '', contributorName: '', note: '' })
  }

  const tabCounts: Partial<Record<TabKey, number>> = {
    contributions: contributions.length,
    payouts: openApprovals,
    verification: item.status === 'draft' || item.status === 'returned' || item.status === 'under_review' ? 1 : 0,
    audit: state.audit.filter((entry) => entry.caseId === item.id).length,
  }

  return (
    <div className="cw-page cw-case-page">
      <div className="cw-case-breadcrumb">
        <Link to={paths.accountChemaWallet}><Icon name="arrow-right" size={14} className="cw-back-icon" /> Chema Wallet</Link>
        <span aria-hidden="true">/</span>
        <span>{item.caseRef}</span>
      </div>

      {msg && <Callout tone="success" role="status">{msg}</Callout>}
      {error && <Callout tone="danger" role="alert">{error}</Callout>}

      <header className="cw-case-hero reveal">
        <div className="cw-case-hero__main">
          <p className="cw-eyebrow">Chema Wallet case</p>
          <h1>{item.privacy.showDeceasedName || active ? item.deceasedName : 'Verified funeral case'}</h1>
          <p className="cw-case-hero__meta">
            {item.caseRef}
            {item.dateOfDeath && <> · Date of death {new Date(item.dateOfDeath).toLocaleDateString('en-GB')}</>}
            {item.funeralDate && <> · Funeral {new Date(item.funeralDate).toLocaleDateString('en-GB')}</>}
          </p>
          <CaseStatusLine item={item} />
          <p className="cw-case-hero__info">{item.funeralInfo}</p>
          <div className="cw-action-row">
            {active && <a className="btn btn--primary btn--sm" href={contributePath(item.contributionToken)}><Icon name="wallet" size={16} /> Open public page</a>}
            <Link className="btn btn--outline btn--sm" to={funeralRecordPath(item.funeralRecordId)}><Icon name="archive" size={16} /> Funeral record</Link>
            {item.coordinator && <span className="cw-inline-note">Coordinator: {item.coordinator.name}</span>}
          </div>
        </div>

        <aside className="cw-case-hero__summary" aria-label="Case balance summary">
          <p className="cw-case-hero__summary-label">Community available</p>
          <p className="cw-case-hero__summary-value">{money(available)}</p>
          <p className="cw-case-hero__summary-hint">Settled money after commitments and holds. Cash and any Fidelity benefit are shown separately.</p>
          <CaseProgressSummary item={item} raised={progress.raised} />
          <dl className="cw-case-hero__facts">
            <div><dt>Confirmed digital</dt><dd>{money(totals.digitalTotal)}</dd></div>
            <div><dt>Cash recorded</dt><dd>{money(totals.cashTotal)}</dd></div>
            <div><dt>Contributors</dt><dd>{totals.contributorCount}</dd></div>
            <div><dt>Pending payments</dt><dd>{money(totals.pendingTotal)}</dd></div>
          </dl>
        </aside>
      </header>

      <div className="cw-tabs" role="tablist" aria-label="Chema Wallet case sections">
        {tabs.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            id={`cw-tab-${entry.key}`}
            aria-selected={tab === entry.key}
            aria-controls={`cw-panel-${entry.key}`}
            className="cw-tab"
            onClick={() => setTab(entry.key)}
          >
            {entry.label}
            {tabCounts[entry.key] ? <span className="cw-tab__count">{tabCounts[entry.key]}</span> : null}
          </button>
        ))}
      </div>

      <div id={`cw-panel-${tab}`} role="tabpanel" aria-labelledby={`cw-tab-${tab}`} className="cw-tab-panel">
        {tab === 'overview' && (
          <div className="cw-overview">
            <div className="cw-overview__main">
              <section className="cw-source-grid" aria-label="Source-separated balances">
                <SourceCard tone="community" icon="wallet" label="Community contributions" value={totals.digitalTotal} hint="Provider-confirmed digital money, kept in a community sub-ledger." badge="Source A" />
                <SourceCard tone="cash" icon="archive" label="Physical cash recorded" value={totals.cashTotal} hint="Recorded for the family view. Not held, settled or spendable through Chema." badge="Memo only" />
                <SourceCard tone="fidelity" icon="shield" label="Fidelity benefit" value="Not linked" hint="Claims remain with Fidelity. No benefit is credited or routed by this wallet." badge="Separate" />
                <SourceCard tone="neutral" icon="clock" label="Awaiting confirmation" value={totals.pendingTotal} hint="Pending or unknown payments are never included in the public total or spendable balance." badge={`${totals.pendingCount} pending`} />
              </section>

              <PublicPageCard item={item} publicUrl={publicUrl} canManage={canManage} actor={actor} commit={commit} />

              <section className="cw-panel" aria-labelledby="cw-overview-recent-title">
                <div className="cw-panel__head">
                  <div><p className="cw-eyebrow">Confirmed only</p><h2 id="cw-overview-recent-title" className="cw-panel__title">Recent contributions</h2></div>
                  <button type="button" className="link-arrow" onClick={() => setTab('contributions')}>View all <Icon name="arrow-right" size={16} /></button>
                </div>
                {contributions.filter((entry) => entry.status === 'successful').length === 0 ? (
                  <EmptyState icon="heart" title="No confirmed contributions yet">Share the public page once the case is verified and active.</EmptyState>
                ) : (
                  <div className="cw-mini-list">
                    {contributions.filter((entry) => entry.status === 'successful').slice(0, 4).map((entry) => (
                      <article key={entry.id} className="cw-mini-row">
                        <span className={`cw-mini-row__icon cw-mini-row__icon--${entry.kind === 'cash' ? 'cash' : 'community'}`}><Icon name={entry.kind === 'cash' ? 'archive' : 'heart'} size={16} /></span>
                        <div><strong>{entry.anonymous ? 'Anonymous contributor' : entry.contributorName}</strong><p>{entry.kind === 'cash' ? 'Physical cash recorded' : `${entry.method} · ${contributionStatusLabels[entry.status]}`}{entry.message ? ` · “${entry.message}”` : ''}</p></div>
                        <span className="cw-mini-row__amount">{money(entry.amount)}</span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="cw-overview__side">
              <section className="cw-panel" aria-labelledby="cw-facts-title">
                <p className="cw-eyebrow">Case record</p>
                <h2 id="cw-facts-title" className="cw-panel__title">Key facts</h2>
                <dl className="cw-facts">
                  <div><dt>Case reference</dt><dd>{item.caseRef}</dd></div>
                  <div><dt>Opened</dt><dd>{new Date(item.createdAt).toLocaleDateString('en-GB')}</dd></div>
                  <div><dt>Funeral date</dt><dd>{item.funeralDate ? new Date(item.funeralDate).toLocaleDateString('en-GB') : 'Not set'}</dd></div>
                  <div><dt>Target</dt><dd>{item.targetAmount > 0 ? money(item.targetAmount) : 'No target set'}</dd></div>
                  <div><dt>Approval threshold</dt><dd>{money(item.approvalThreshold)}</dd></div>
                  <div><dt>Coordinator</dt><dd>{item.coordinator ? item.coordinator.name : 'Not assigned'}</dd></div>
                </dl>
              </section>

              <section className="cw-panel" aria-labelledby="cw-mandate-title">
                <p className="cw-eyebrow">Wallet mandate</p>
                <h2 id="cw-mandate-title" className="cw-panel__title">Who can act</h2>
                <ul className="cw-mandate-list">
                  {item.mandate.map((person) => (
                    <li key={`${person.userId}-${person.role}`}>
                      <span className="avatar avatar--sm">{person.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                      <span><strong>{person.name}</strong><small>{mandateLabel(person.role)}{person.phoneMasked ? ` · ${person.phoneMasked}` : ''}</small></span>
                      <StatusChip tone={person.role === 'administrator' ? 'info' : person.role === 'approver' ? 'neutral' : 'neutral'}>{person.role}</StatusChip>
                    </li>
                  ))}
                </ul>
                <p className="cw-inline-note">The policy beneficiary, claimant, wallet administrator and approver are separate roles. A coordinator cannot approve payouts.</p>
              </section>

              {(openDisputes.length > 0 || holds.length > 0) && (
                <section className="cw-panel" aria-labelledby="cw-disputes-title">
                  <p className="cw-eyebrow">Exceptions</p>
                  <h2 id="cw-disputes-title" className="cw-panel__title">Disputes and holds</h2>
                  {holds.length > 0 && <p className="cw-inline-note">{money(holds.reduce((sum, hold) => sum + hold.amount, 0))} is held on the community source only.</p>}
                  <OverviewDisputes disputes={openDisputes} />
                </section>
              )}

              <section className="cw-panel cw-next-action" aria-labelledby="cw-next-title">
                <p className="cw-eyebrow">Next step</p>
                <h2 id="cw-next-title" className="cw-panel__title">Keep the case moving</h2>
                <p className="cw-panel__lead">{nextActionCopy(item)}</p>
                <NextAction item={item} canManage={canManage} actor={actor} commit={commit} onTab={setTab} publicUrl={publicUrl} />
              </section>
            </aside>
          </div>
        )}

        {tab === 'contributions' && (
          <div className="cw-tab-grid">
            <section className="cw-panel" aria-labelledby="cw-contrib-title">
              <div className="cw-panel__head">
                <div><p className="cw-eyebrow">Receipts and provider records</p><h2 id="cw-contrib-title" className="cw-panel__title">Contribution history</h2></div>
                <StatusChip tone="info">{totals.successfulCount} confirmed digital</StatusChip>
              </div>
              <div className="cw-filters" role="group" aria-label="Filter contributions">
                {[
                  ['all', 'All'],
                  ['confirmed', 'Confirmed'],
                  ['pending', 'Pending'],
                  ['failed', 'Failed'],
                  ['cash', 'Cash recorded'],
                ].map(([key, label]) => (
                  <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
                ))}
              </div>
              <div className="cw-table-wrap">
                <table className="cw-table">
                  <thead><tr><th scope="col">Date</th><th scope="col">Contributor</th><th scope="col">Type</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Reconciliation</th><th scope="col">Receipt</th></tr></thead>
                  <tbody>
                    {groupedContributions.map((entry) => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</td>
                        <td>{entry.anonymous ? 'Anonymous' : entry.contributorName}{entry.recordedBy ? <span className="cw-table__sub">Recorded by {entry.recordedBy}</span> : null}{entry.message ? <span className="cw-table__sub">“{entry.message}”</span> : null}</td>
                        <td>{entry.kind === 'cash' ? 'Cash (recorded)' : entry.method}</td>
                        <td className="cw-table__amount">{money(entry.amount)}</td>
                        <td><StatusChip tone={contributionTone(entry.status)}>{contributionStatusLabels[entry.status]}</StatusChip></td>
                        <td>{entry.kind === 'cash' ? 'Separate record' : entry.reconciled ? 'Matched' : 'Awaiting match'}</td>
                        <td className="cw-table__ref">{entry.receiptRef ?? 'Issued on confirmation'}</td>
                      </tr>
                    ))}
                    {groupedContributions.length === 0 && <tr><td colSpan={7} className="cw-table__empty">No contributions in this view.</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="cw-inline-note">A receipt exists only for a provider-confirmed contribution. Pending and failed payments are never shown as available.</p>
            </section>

            <div className="cw-side-stack">
              {canManage && item.status === 'verified' && (
                <section className="cw-panel" aria-labelledby="cw-cash-title">
                  <div className="cw-panel__head"><div><p className="cw-eyebrow">Offline support</p><h2 id="cw-cash-title" className="cw-panel__title">Record physical cash</h2></div><Icon name="archive" size={20} /></div>
                  <p className="cw-panel__lead">Cash collected at the homestead can be recorded for the family view. It is not processed by Chema and is not spendable through the wallet.</p>
                  <form className="cw-form" onSubmit={recordCash}>
                    <label className="field"><span className="field__label">Amount (USD)</span><input className="input" type="number" min="0.01" step="0.01" value={cash.amount} onChange={(event) => setCash({ ...cash, amount: event.target.value })} required /></label>
                    <label className="field"><span className="field__label">Contributor or group</span><input className="input" value={cash.contributorName} onChange={(event) => setCash({ ...cash, contributorName: event.target.value })} placeholder="Optional" /></label>
                    <label className="field"><span className="field__label">Note</span><input className="input" value={cash.note} onChange={(event) => setCash({ ...cash, note: event.target.value })} placeholder="e.g. collected at the homestead" /></label>
                    <button type="submit" className="btn btn--outline btn--sm">Record cash separately</button>
                  </form>
                </section>
              )}

              {isAdmin && queues.length > 0 && (
                <section className="cw-panel" aria-labelledby="cw-moderation-title">
                  <div className="cw-panel__head"><div><p className="cw-eyebrow">Tribute moderation</p><h2 id="cw-moderation-title" className="cw-panel__title">Held messages</h2></div><StatusChip tone="warning">{queues.length}</StatusChip></div>
                  <div className="cw-moderation-list">
                    {queues.map((entry) => (
                      <article key={entry.id} className="cw-moderation">
                        <div><strong>{entry.anonymous ? 'Anonymous' : entry.contributorName}</strong><p>“{entry.message}”</p></div>
                        <div className="cw-action-row">
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => commit(chemaStore.moderateTribute(entry.id, 'approved', actor), 'Tribute published to the public page.')}>Publish</button>
                          <button type="button" className="btn btn--outline btn--sm" onClick={() => commit(chemaStore.moderateTribute(entry.id, 'rejected', actor), 'Tribute will not be published.')}>Keep private</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <p className="cw-inline-note">Tributes are moderated separately from financial records. Anonymous display never removes the audit record.</p>
                </section>
              )}

              <section className="cw-panel" aria-labelledby="cw-summary-title">
                <p className="cw-eyebrow">At a glance</p>
                <h2 id="cw-summary-title" className="cw-panel__title">Contribution sources</h2>
                <div className="cw-recon">
                  <div><span>Digital confirmed</span><strong>{money(totals.digitalTotal)}</strong></div>
                  <div><span>Cash recorded</span><strong>{money(totals.cashTotal)}</strong></div>
                  <div><span>Pending</span><strong>{money(totals.pendingTotal)}</strong></div>
                  <div><span>Failed</span><strong>{totals.failedCount}</strong></div>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'payouts' && <PayoutsPanel item={item} state={state} actor={actor} isAdmin={isAdmin} canManage={canManage} canApprove={canApprove} commit={commit} />}
        {tab === 'verification' && <VerificationPanel item={item} state={state} actor={actor} isAdmin={isAdmin} canManage={canManage} canApprove={canApprove} commit={commit} />}
        {tab === 'ledger' && <LedgerPanel item={item} state={state} actor={actor} isAdmin={isAdmin} canManage={canManage} canApprove={canApprove} commit={commit} />}
        {tab === 'privacy' && <PrivacyPanel item={item} state={state} actor={actor} isAdmin={isAdmin} canManage={canManage} canApprove={canApprove} commit={commit} />}
        {tab === 'audit' && <AuditPanel item={item} state={state} actor={actor} isAdmin={isAdmin} canManage={canManage} canApprove={canApprove} commit={commit} />}
      </div>

      <p className="cw-fineprint">Community verification is not insurance cover or claim approval. Chema Wallet keeps community contributions separate from Fidelity policy benefits, with source-level records and audit evidence.</p>
    </div>
  )
}

function nextActionCopy(item: ChemaState['cases'][number]) {
  if (item.status === 'draft') return 'Attach the required evidence and submit the case for community verification.'
  if (item.status === 'returned') return 'Correct the evidence recorded by the reviewer, then resubmit the case.'
  if (item.status === 'under_review') return 'A reviewer must record a decision. Public sharing stays disabled until approval.'
  if (item.status === 'rejected') return 'The case was rejected. Review the reason and decide whether to correct and resubmit.'
  if (item.status === 'verified' && !item.activated) return 'Verification is complete. Activate the public page to generate the link and QR code.'
  if (item.status === 'verified') return 'Share the verified page, monitor receipts and review payout requests before money moves.'
  if (item.status === 'suspended') return 'Review the suspension reason. Public contributions are disabled until the case is restored.'
  return 'Review the case record and audit trail.'
}

function NextAction({ item, canManage, actor, commit, onTab, publicUrl }: { item: ChemaState['cases'][number]; canManage: boolean; actor: { id: string; name: string }; commit: Commit; onTab: (tab: TabKey) => void; publicUrl: string }) {
  if (item.status === 'draft' || item.status === 'returned' || item.status === 'rejected') {
    return <button type="button" className="btn btn--primary btn--sm" onClick={() => onTab('verification')}>Open verification <Icon name="arrow-right" size={16} /></button>
  }
  if (item.status === 'under_review') {
    return <button type="button" className="btn btn--primary btn--sm" onClick={() => onTab('verification')}>Review the case <Icon name="arrow-right" size={16} /></button>
  }
  if (item.status === 'verified' && !item.activated && canManage) {
    return <button type="button" className="btn btn--primary btn--sm" onClick={() => commit(chemaStore.activateWallet(item.id, actor), 'Public contribution page activated. Share the link with the community.')}>Activate public page</button>
  }
  if (item.status === 'verified' && !item.activated) {
    return <p className="cw-inline-note">Awaiting the wallet administrator to activate the public page.</p>
  }
  if (item.status === 'verified' && item.activated) {
    return (
      <div className="cw-action-row">
        <a className="btn btn--primary btn--sm" href={publicUrl} target="_blank" rel="noopener noreferrer">Open public page</a>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => onTab('payouts')}>Review payouts</button>
      </div>
    )
  }
  if (item.status === 'suspended') {
    return <button type="button" className="btn btn--primary btn--sm" onClick={() => onTab('privacy')}>Review suspension</button>
  }
  return <button type="button" className="btn btn--outline btn--sm" onClick={() => onTab('audit')}>Open audit trail</button>
}
