import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { funeralRecordPath, paths } from '@/config/routes'
import { chemaStore } from './store'
import { contributionTotals } from './data'
import './chema-wallet.css'

function money(n: number) { return `USD ${n.toFixed(2)}` }

export default function ChemaDashboardPage() {
  const state = chemaStore.getState()
  const cases = state.cases
  const all = state.contributions
  const digital = all.filter((c) => c.kind === 'digital' && c.status === 'successful').reduce((s, c) => s + c.amount, 0)
  const cash = all.filter((c) => c.kind === 'cash').reduce((s, c) => s + c.amount, 0)
  const contributors = new Set(all.filter((c) => c.status === 'successful' || c.kind === 'cash').map((c) => c.anonymous ? c.id : c.contributorName.toLowerCase())).size
  const pending = all.filter((c) => c.status === 'pending').length
  const successful = all.filter((c) => c.status === 'successful').length
  const active = cases.filter((c) => c.activated).length
  const recent = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

  return (
    <div className="page-stack chema-grid">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Chema Wallet</p>
          <h1>Community contributions dashboard</h1>
          <p className="muted" style={{ maxWidth: '72ch' }}>Monitor simulated digital contributions, separately recorded physical cash, active funeral cases, and payout review workflows. This is a demonstration prototype and does not process real money.</p>
        </div>
        <div className="chema-actions">
          <Link className="btn btn--outline" to={paths.accountFuneralRecords}><Icon name="archive" size={18} /> Funeral cases</Link>
        </div>
      </header>

      <Callout tone="warning">
        <strong>Demonstration only:</strong> all transactions, receipts and payout workflows are simulated. No EcoCash, OneMoney or card APIs are connected, no real money is transferred, and community contributions are kept separate from Fidelity policy benefits and claims.
      </Callout>

      <section className="chema-stats" aria-label="Chema Wallet summary">
        <article className="chema-stat"><p className="chema-stat__label">Total digital contributions</p><p className="chema-stat__value">{money(digital)}</p><p className="chema-stat__hint">Simulated successful digital payments</p></article>
        <article className="chema-stat"><p className="chema-stat__label">Physical cash recorded separately</p><p className="chema-stat__value">{money(cash)}</p><p className="chema-stat__hint">Recorded by coordinator/admin (not transferred)</p></article>
        <article className="chema-stat"><p className="chema-stat__label">Number of contributors</p><p className="chema-stat__value">{contributors}</p><p className="chema-stat__hint">Unique successful/cash contribution records</p></article>
        <article className="chema-stat"><p className="chema-stat__label">Transactions</p><p className="chema-stat__value">{successful} successful / {pending} pending</p><p className="chema-stat__hint">{all.length} total contribution activity records</p></article>
        <article className="chema-stat"><p className="chema-stat__label">Active funeral cases</p><p className="chema-stat__value">{active}</p><p className="chema-stat__hint">Chema Wallet enabled for verified cases</p></article>
      </section>

      <div className="chema-two">
        <section className="card stack">
          <p className="eyebrow">Active funeral cases with Chema Wallet</p>
          <h2 className="panel__title">Case contributions overview</h2>
          <div className="chema-list">
            {cases.map((c) => {
              const caseContribs = state.contributions.filter((x) => x.caseId === c.id)
              const totals = contributionTotals(caseContribs)
              return (
                <article key={c.id} className="chema-row">
                  <div>
                    <strong>{c.deceasedName}</strong>
                    <div className="chema-meta">{c.caseRef} · {c.activated ? <span className="chema-badge chema-badge--success">Activated</span> : <span className="chema-badge chema-badge--muted">Not activated</span>} {c.verified ? <span className="chema-badge">Verified</span> : <span className="chema-badge chema-badge--warn">Unverified</span>}</div>
                    <div className="chema-meta">Digital {money(totals.digitalTotal)} · Cash {money(totals.cashTotal)} · {totals.contributorCount} contributors</div>
                  </div>
                  <div className="chema-actions">
                    <Link className="btn btn--outline btn--sm" to={funeralRecordPath(c.funeralRecordId)}>Open funeral case</Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="card stack">
          <p className="eyebrow">Contribution activity and history</p>
          <h2 className="panel__title">Recent activity</h2>
          <div className="chema-table-wrap">
            <table className="chema-table">
              <thead><tr><th>When</th><th>Case</th><th>Contributor</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((c) => {
                  const cs = cases.find((x) => x.id === c.caseId)
                  return (
                    <tr key={c.id}>
                      <td>{new Date(c.createdAt).toLocaleString('en-GB')}</td>
                      <td>{cs?.deceasedName ?? c.caseId}</td>
                      <td>{c.anonymous ? 'Anonymous' : c.contributorName}{c.kind === 'cash' ? ' (cash)' : ''}</td>
                      <td>{money(c.amount)}</td>
                      <td><span className={`chema-badge ${c.status === 'successful' ? 'chema-badge--success' : c.status === 'pending' ? 'chema-badge--warn' : 'chema-badge--muted'}`}>{c.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
