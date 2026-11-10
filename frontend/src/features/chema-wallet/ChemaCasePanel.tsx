import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { chemaCasePath, contributePath } from '@/config/routes'
import { useAuth } from '@/features/auth'
import {
  availableCommunityBalance,
  contributionTotals,
  contributionsForCase,
  isPubliclyActive,
  money,
  type ChemaCommandResult,
  type ChemaState,
} from './data'
import { chemaStore } from './store'
import { CaseStatusChip, QrCode, ShareLinkBox } from './ChemaUI'
import './chema-wallet.css'

/**
 * Compact Chema Wallet summary embedded in a funeral record. The full workflow
 * (verification evidence, ledger, payouts, privacy, audit) lives in the case
 * workspace; this panel keeps the record page oriented and links across.
 */
export function ChemaCasePanel({
  funeralRecordId,
  caseRef,
  personName,
  summary,
}: {
  funeralRecordId: string
  caseRef: string
  personName: string
  summary: string
}) {
  const { user } = useAuth()
  const actor = { id: user?.id ?? 'demo-user', name: user?.name ?? 'Authorised user' }
  const isAdmin = user?.role === 'admin'
  const [state, setState] = useState<ChemaState>(() => {
    if (!chemaStore.getCaseByRecord(funeralRecordId)) {
      chemaStore.ensureCaseForRecord({ id: funeralRecordId, reference: caseRef, personName, summary }, actor)
    }
    return chemaStore.getState()
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const item = state.cases.find((entry) => entry.funeralRecordId === funeralRecordId)

  if (!item) {
    return (
      <section className="cw-embed" aria-labelledby="chema-title">
        <p className="cw-eyebrow">Chema Wallet</p>
        <h2 id="chema-title" className="cw-panel__title">Community support for this funeral</h2>
        <p className="cw-inline-note">The wallet case could not be prepared. Open the funeral record again or use the Chema Wallet dashboard.</p>
      </section>
    )
  }

  const contributions = contributionsForCase(state, item.id)
  const totals = contributionTotals(contributions)
  const available = availableCommunityBalance(state, item.id)
  const active = isPubliclyActive(item)
  const publicUrl = `${window.location.origin}${contributePath(item.contributionToken)}`
  const member = item.mandate.find((person) => person.userId === user?.id)
  const canManage = isAdmin || member?.role === 'administrator'
  const needsEvidence = item.verification.evidence.length < 3

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

  function submitForReview() {
    if (!item) return
    if (needsEvidence) chemaStore.attachSampleEvidence(item.id, actor)
    commit(chemaStore.submitForVerification(item.id, actor), 'Submitted for community verification. Public sharing stays disabled until a reviewer approves it.')
  }

  return (
    <section className="cw-embed" aria-labelledby="chema-title">
      <div className="cw-embed__head">
        <div>
          <p className="cw-eyebrow">Chema Wallet</p>
          <h2 id="chema-title" className="cw-panel__title">Community support for this funeral</h2>
          <p className="cw-embed__lead">
            A coordinated family view of community contributions, kept separate from Fidelity policy benefits and claims.
            Digital payments are simulated in this demonstration; physical cash is recorded separately.
          </p>
        </div>
        <CaseStatusChip status={item.status} />
      </div>

      {msg && <Callout tone="success" role="status">{msg}</Callout>}
      {error && <Callout tone="danger" role="alert">{error}</Callout>}

      <div className="cw-embed__stats">
        <div><span>Community available</span><strong>{money(available)}</strong><small>After commitments and holds</small></div>
        <div><span>Confirmed digital</span><strong>{money(totals.digitalTotal)}</strong><small>{totals.successfulCount} confirmed contributions</small></div>
        <div><span>Cash recorded</span><strong>{money(totals.cashTotal)}</strong><small>Memo only, not spendable</small></div>
        <div><span>Contributors</span><strong>{totals.contributorCount}</strong><small>{totals.pendingCount} payment{totals.pendingCount === 1 ? '' : 's'} pending</small></div>
      </div>

      <div className="cw-embed__body">
        <div className="cw-embed__summary">
          <ul className="cw-embed__checks">
            <li className={active ? 'is-done' : ''}>
              <Icon name={active ? 'check' : 'lock'} size={15} />
              {active ? 'Verified and open for community contributions.' : 'Public link, QR code and contributions stay disabled until verification is approved and the page is activated.'}
            </li>
            <li><Icon name="shield" size={15} /> Community verification is not insurance cover or a claim decision.</li>
            <li><Icon name="wallet" size={15} /> Only provider-confirmed digital money is spendable. Cash and Fidelity benefits are separate.</li>
          </ul>

          <div className="cw-action-row">
            <Link className="btn btn--primary btn--sm" to={chemaCasePath(item.id)}>
              Open case workspace <Icon name="arrow-right" size={16} />
            </Link>
            {active && (
              <a className="btn btn--outline btn--sm" href={contributePath(item.contributionToken)} target="_blank" rel="noopener noreferrer">
                View public page
              </a>
            )}
            {isAdmin && canManage && ['draft', 'returned', 'rejected'].includes(item.status) && (
              <button type="button" className="btn btn--outline btn--sm" onClick={submitForReview}>
                Attach sample evidence &amp; submit
              </button>
            )}
            {isAdmin && item.status === 'under_review' && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => commit(chemaStore.decideVerification(item.id, 'approved', actor, 'VER-OK'), 'Community verification approved. Activate the public page when the family is ready.')}
              >
                Approve verification
              </button>
            )}
            {isAdmin && item.status === 'verified' && !item.activated && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => commit(chemaStore.activateWallet(item.id, actor), 'Public contribution page activated. Share the link with the community.')}
              >
                Activate public page
              </button>
            )}
          </div>
        </div>

        {active ? (
          <div className="cw-embed__share">
            <QrCode value={publicUrl} size={112} />
            <div>
              <StatusChip tone="success">Public page live</StatusChip>
              <p className="cw-inline-note">Share only this verified link. Every page carries the funeral case reference.</p>
              <ShareLinkBox url={publicUrl} compact />
            </div>
          </div>
        ) : (
          <div className="cw-embed__locked">
            <span className="cw-embed__locked-icon"><Icon name="lock" size={22} /></span>
            <div>
              <strong>Sharing is locked</strong>
              <p>{item.status === 'under_review' ? 'A reviewer is deciding this case. Public contributions cannot be collected yet.' : item.status === 'returned' ? 'The reviewer returned this case for correction. Fix the evidence, resubmit, then activate.' : 'Prepare the evidence and submit the case before any public link is issued.'}</p>
            </div>
          </div>
        )}
      </div>

      <p className="cw-fineprint">
        Chema Wallet is a demonstration of BRD v8.0 controls: source-separated records, verification before sharing, receipts for confirmed payments and maker-checker approval for payouts.
      </p>
    </section>
  )
}
