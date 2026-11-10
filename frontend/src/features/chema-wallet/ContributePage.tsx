import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import { paths } from '@/config/routes'
import {
  caseProgress,
  contributionTotals,
  contributionsForCase,
  isPubliclyActive,
  methodHints,
  methodLabels,
  money,
  publicTributes,
  type ChemaContribution,
  type ContributionMethod,
} from './data'
import { chemaStore } from './store'
import { ProgressBar } from './ChemaUI'
import './chema-wallet.css'

type Stage = 'form' | 'review' | 'processing' | 'success' | 'failed' | 'pending'

const presetAmounts = [10, 20, 50, 100]

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

export default function ContributePage() {
  const { token = '' } = useParams()
  const [state, setState] = useState(() => chemaStore.getState())
  const item = useMemo(() => state.cases.find((entry) => entry.contributionToken === token), [state, token])
  const [stage, setStage] = useState<Stage>('form')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState<ContributionMethod>('ecocash')
  const [error, setError] = useState('')
  const [result, setResult] = useState<ChemaContribution | null>(null)
  const [intentId, setIntentId] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [report, setReport] = useState({ category: 'report', reason: '' })
  const [reportNote, setReportNote] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  const contributions = item ? contributionsForCase(state, item.id) : []
  const totals = contributionTotals(contributions)
  const progress = item ? caseProgress(item, contributions) : { raised: 0, target: 0, percent: 0, remaining: 0 }
  const tributes = item ? publicTributes(state, item.id) : []
  const live = item ? isPubliclyActive(item) : false

  if (!item) {
    return (
      <div className="cw-public">
        <div className="container cw-public__inner cw-public__unavailable">
          <div className="cw-public__unavailable-card">
            <span className="cw-public__unavailable-icon"><Icon name="lock" size={28} /></span>
            <p className="cw-eyebrow">Chema Wallet</p>
            <h1>This contribution page is not available</h1>
            <p>The link may be incomplete, or the family may have closed or suspended the page. Please ask the family or coordinator for the verified link.</p>
            <Link className="btn btn--primary" to={paths.home}>Back to the website</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!live) {
    const title =
      item.status === 'suspended' ? 'Contributions are paused for this case'
        : item.status === 'rejected' ? 'This case did not pass community verification'
          : item.status === 'returned' ? 'The family is correcting this case'
            : item.status === 'under_review' || item.status === 'submitted' ? 'This case is still being verified'
              : 'This contribution page is not active yet'
    const copy =
      item.status === 'suspended' ? 'The family or Fidelity operations has paused public contributions while a concern is reviewed. Please check back later.'
        : item.status === 'rejected' ? 'Community contributions cannot be accepted for this funeral case. If you believe this is wrong, contact the family or Fidelity support.'
          : item.status === 'returned' ? 'Public sharing stays disabled until the family corrects the evidence and the case is verified.'
            : item.status === 'under_review' || item.status === 'submitted' ? 'A reviewer must approve the funeral case and wallet authority before any link or QR code can accept contributions.'
              : 'The family has not activated the public page yet. A verified case is not automatically shareable.'
    return (
      <div className="cw-public">
        <div className="container cw-public__inner cw-public__unavailable">
          <div className="cw-public__unavailable-card">
            <span className="cw-public__unavailable-icon"><Icon name="shield" size={28} /></span>
            <p className="cw-eyebrow">Chema Wallet · {item.caseRef}</p>
            <h1>{title}</h1>
            <p>{copy}</p>
            <p className="cw-inline-note">No contribution has been requested and no payment method is shown while this page is inactive.</p>
            <Link className="btn btn--primary" to={paths.home}>Back to the website</Link>
          </div>
        </div>
      </div>
    )
  }

  const publicName = item.privacy.showDeceasedName ? item.deceasedName : 'a loved one'
  const showProgress = item.privacy.showProgress && item.privacy.showAmounts
  const recentTributes = tributes.slice(0, 5)

  function validate(): string {
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 1) return 'Enter a contribution of at least USD 1.00.'
    if (value > 100_000) return 'For this demonstration, contributions are capped at USD 100,000.00.'
    if (!anonymous && !name.trim()) return 'Enter your name or choose to contribute anonymously.'
    return ''
  }

  function continueToReview(event: FormEvent) {
    event.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setStage('review')
    document.getElementById('cw-donate-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function pay(outcome: 'successful' | 'failed' | 'pending') {
    if (!item) return
    const value = Number(amount)
    const key = `${item.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
    const intent = chemaStore.addContributionIntent({
      caseId: item.id,
      amount: value,
      contributorName: anonymous ? 'Anonymous' : name,
      anonymous,
      message,
      method,
      idempotencyKey: key,
    })
    if (!intent.ok) {
      setError(intent.error)
      setStage('form')
      return
    }
    setState(intent.state)
    setIntentId(intent.data.id)
    setStage('processing')
    await delay(1300)
    const resolved = chemaStore.resolveContribution(intent.data.id, outcome, `${method.toUpperCase()}-SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
    if (!resolved.ok) {
      setError(resolved.error)
      setStage('form')
      return
    }
    setState(resolved.state)
    setResult(resolved.data)
    setStage(outcome === 'successful' ? 'success' : outcome === 'failed' ? 'failed' : 'pending')
  }

  async function checkPending() {
    if (!intentId) return
    setStage('processing')
    await delay(900)
    const resolved = chemaStore.resolveContribution(intentId, 'successful')
    if (!resolved.ok) {
      setError(resolved.error)
      setStage('pending')
      return
    }
    setState(resolved.state)
    setResult(resolved.data)
    setStage('success')
  }

  function reset() {
    setStage('form')
    setAmount('')
    setMessage('')
    setError('')
    setResult(null)
    setIntentId('')
  }

  function openReport() {
    setReportOpen(true)
    window.setTimeout(() => dialogRef.current?.showModal(), 0)
  }

  function submitReport(event: FormEvent) {
    event.preventDefault()
    if (report.reason.trim().length < 10) return
    const outcome = chemaStore.reportSuspiciousCase(token, { reporter: name.trim() || 'Anonymous visitor', category: report.category as 'report' | 'fraud' | 'authority' | 'payment', reason: report.reason })
    if (outcome.ok) {
      setState(outcome.state)
      setReportNote('Report received. A human reviewer will assess it. No automatic action has been taken against the family.')
      setReport({ category: 'report', reason: '' })
      dialogRef.current?.close()
      setReportOpen(false)
    }
  }

  const step = stage === 'form' ? 1 : stage === 'review' || stage === 'processing' ? 2 : 3

  return (
    <div className="cw-public">
      <div className="container cw-public__inner">
        <div className="cw-public__topline">
          <Link to={paths.home} className="cw-public__brand">Chema Wallet <span>by Fidelity Life</span></Link>
          <span className="cw-public__demo-tag">Demonstration · no real money</span>
        </div>

        <header className="cw-public__hero">
          <div className="cw-public__hero-overlay" aria-hidden="true" />
          <div className="cw-public__hero-content">
            <span className="cw-public__verified"><Icon name="shield" size={16} /> Community verified funeral case</span>
            <h1>Support the family of {publicName}</h1>
            <p className="cw-public__service">{item.funeralInfo}</p>
            <div className="cw-public__meta">
              <span>Case {item.caseRef}</span>
              {item.funeralDate && <span>Funeral {new Date(item.funeralDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span>{totals.contributorCount} {totals.contributorCount === 1 ? 'contributor' : 'contributors'}</span>
            </div>
          </div>
          <div className="cw-public__hero-progress">
            {showProgress ? (
              <>
                <p className="cw-public__hero-raised">{money(progress.raised)}</p>
                <p className="cw-public__hero-target">raised towards {money(progress.target)}</p>
                <ProgressBar value={progress.raised} target={progress.target} label="Community contributions" />
              </>
            ) : (
              <p className="cw-public__private-progress"><Icon name="lock" size={16} /> The family has chosen not to publish contribution amounts.</p>
            )}
          </div>
        </header>

        <div className="cw-public__notice">
          <Icon name="alert" size={18} />
          <p><strong>Community support only.</strong> This page is not a Fidelity policy benefit or claim. A verified badge confirms the funeral case and wallet authority, not insurance cover. Payments are simulated in this demonstration.</p>
        </div>

        <div className="cw-public__grid">
          <div className="cw-public__story">
            <section className="cw-public__card" aria-labelledby="cw-public-about">
              <p className="cw-eyebrow">About this fund</p>
              <h2 id="cw-public-about">One coordinated way for the community to help</h2>
              <p>
                Family, friends, church members, workmates and diaspora contacts can contribute towards the funeral through this verified page. Every confirmed contribution receives a receipt and is recorded in a source-separated community ledger.
              </p>
              <div className="cw-public__source-row">
                <div><span className="cw-source-tag cw-source-tag--community">Community</span><strong>{money(totals.digitalTotal)}</strong><small>Confirmed digital contributions</small></div>
                <div><span className="cw-source-tag cw-source-tag--cash">Fidelity benefit</span><strong>Separate</strong><small>Not linked to this community page</small></div>
              </div>
              <div className="cw-public__trust">
                <div><Icon name="shield" size={18} /><span><strong>Verified before sharing</strong><small>The case and wallet authority were reviewed before this link was activated.</small></span></div>
                <div><Icon name="lock" size={18} /><span><strong>Source-separated records</strong><small>Community money never mixes with Fidelity policy benefits or claims.</small></span></div>
                <div><Icon name="check" size={18} /><span><strong>Receipt after confirmation</strong><small>A receipt is issued only when the provider confirms the payment.</small></span></div>
              </div>
            </section>

            {item.privacy.showTributes && (
              <section className="cw-public__card" aria-labelledby="cw-tributes-title">
                <div className="cw-public__card-head">
                  <div><p className="cw-eyebrow">Messages of support</p><h2 id="cw-tributes-title">Tribute wall</h2></div>
                  <StatusChip tone="info">{tributes.length} published</StatusChip>
                </div>
                {recentTributes.length === 0 ? (
                  <p className="cw-public__empty">The family has not published any tributes yet. Messages are reviewed before they appear here.</p>
                ) : (
                  <div className="cw-tributes">
                    {recentTributes.map((tribute) => {
                      const displayName = tribute.anonymous || !item.privacy.showContributors ? 'A friend' : tribute.contributorName
                      return (
                        <article key={tribute.id} className="cw-tribute">
                          <span className="cw-tribute__avatar" aria-hidden="true">{initial(displayName)}</span>
                          <div>
                            <p className="cw-tribute__message">“{tribute.message}”</p>
                            <p className="cw-tribute__meta">{displayName} · {new Date(tribute.confirmedAt ?? tribute.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="cw-public__card cw-public__controls" aria-labelledby="cw-controls-title">
              <p className="cw-eyebrow">How your contribution is handled</p>
              <h2 id="cw-controls-title">Clear, protected and separate</h2>
              <ul className="cw-check-list">
                <li>Your payment is handed to an approved provider checkout. This demo never collects a PIN, OTP or card number.</li>
                <li>If a payment is pending or unknown, it is not counted as money raised and cannot be paid out.</li>
                <li>Anonymous display hides your name publicly; the payment and audit record still exist for authorised staff.</li>
                <li>Your message appears only after moderation and only if the family allows tributes.</li>
                <li>Community contributions are not Fidelity operating funds, policy premiums or claim proceeds.</li>
              </ul>
            </section>
          </div>

          <aside className="cw-public__aside">
            <section className="cw-donate-card" id="cw-donate-card" aria-labelledby="cw-donate-title">
              <div className="cw-donate-card__head">
                <div><p className="cw-eyebrow">Chema contribution</p><h2 id="cw-donate-title">{stage === 'success' ? 'Thank you' : stage === 'failed' ? 'Payment declined' : stage === 'pending' ? 'Payment pending' : 'Send support'}</h2></div>
                <span className="cw-donate-card__demo">Simulated</span>
              </div>

              <ol className="cw-steps" aria-label="Contribution steps">
                <li className={step >= 1 ? 'is-on' : ''}><span>1</span>Choose</li>
                <li className={step >= 2 ? 'is-on' : ''}><span>2</span>Review</li>
                <li className={step >= 3 ? 'is-on' : ''}><span>3</span>Receipt</li>
              </ol>

              {stage === 'form' && (
                <form className="cw-donate-form" onSubmit={continueToReview} noValidate>
                  {error && <Callout tone="warning" role="alert">{error}</Callout>}

                  <fieldset className="cw-amount-field">
                    <legend className="field__label">Contribution amount (USD)</legend>
                    <div className="cw-amount-presets">
                      {presetAmounts.map((value) => (
                        <button key={value} type="button" className="cw-amount-chip" aria-pressed={amount === String(value)} onClick={() => { setAmount(String(value)); setError('') }}>${value}</button>
                      ))}
                    </div>
                    <div className="cw-amount-input">
                      <span aria-hidden="true">$</span>
                      <input className="input" type="number" min="1" step="0.01" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} placeholder="Other amount" aria-label="Custom contribution amount in US dollars" />
                      <small>USD</small>
                    </div>
                  </fieldset>

                  <label className="field">
                    <span className="field__label">Your name <span className="field__tag">shown publicly only if you allow it</span></span>
                    <input className="input" value={name} onChange={(event) => setName(event.target.value)} disabled={anonymous} placeholder={anonymous ? 'Anonymous contribution selected' : 'Your name or group'} />
                  </label>
                  <label className="cw-check">
                    <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                    <span><strong>Contribute anonymously</strong><small>Your name is hidden from the public page, but the transaction record remains for audit.</small></span>
                  </label>

                  <label className="field">
                    <span className="field__label">Message of support <span className="field__tag">optional · moderated</span></span>
                    <textarea className="textarea" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={280} placeholder="Share a condolence or words of support" />
                    <span className="field__hint">{message.length}/280 characters</span>
                  </label>

                  <fieldset className="cw-method-field">
                    <legend className="field__label">Payment method (simulated)</legend>
                    {(Object.keys(methodLabels) as ContributionMethod[]).map((key) => (
                      <label key={key} className="cw-method">
                        <input type="radio" name="payment-method" value={key} checked={method === key} onChange={() => setMethod(key)} />
                        <span className="cw-method__icon"><Icon name={key === 'card' ? 'bag' : 'phone'} size={18} /></span>
                        <span><strong>{methodLabels[key]}</strong><small>{methodHints[key]}</small></span>
                        <span className="cw-method__check" aria-hidden="true">{method === key ? '✓' : ''}</span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="cw-donate-form__notice"><Icon name="lock" size={15} /><span>No PIN, OTP or card number is collected on this page. The provider checkout is simulated.</span></div>
                  <button type="submit" className="btn btn--primary cw-donate-submit">Continue with {methodLabels[method]}</button>
                  <p className="cw-inline-note">By continuing you agree to the demonstration privacy notice. No real payment is made.</p>
                </form>
              )}

              {stage === 'review' && (
                <div className="cw-review">
                  <p className="cw-review__amount">{money(Number(amount))}</p>
                  <p className="cw-review__method">{methodLabels[method]} · simulated</p>
                  <dl className="cw-review__facts">
                    <div><dt>Contributor</dt><dd>{anonymous ? 'Anonymous' : name.trim()}</dd></div>
                    <div><dt>Receipt</dt><dd>Issued after confirmation</dd></div>
                    {message.trim() && <div><dt>Message</dt><dd>“{message.trim()}”</dd></div>}
                  </dl>
                  <Callout tone="info">You would now be handed to the {methodLabels[method]} checkout. In this demo the provider result is simulated; no credentials are requested.</Callout>
                  <button type="button" className="btn btn--primary cw-donate-submit" onClick={() => void pay('successful')}>Complete simulated payment</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setStage('form')}>Back to edit</button>
                  <details className="cw-demo-outcomes">
                    <summary>Demo payment outcomes</summary>
                    <p>These options show how the page behaves when a provider declines or leaves a payment unknown.</p>
                    <div className="cw-action-row">
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => void pay('failed')}>Simulate decline</button>
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => void pay('pending')}>Simulate pending result</button>
                    </div>
                  </details>
                </div>
              )}

              {stage === 'processing' && (
                <div className="cw-processing" role="status" aria-live="polite">
                  <span className="cw-spinner" aria-hidden="true" />
                  <h3>Waiting for the provider</h3>
                  <p>We are simulating a secure {methodLabels[method]} checkout and waiting for an authoritative result. A timeout or unknown result is never treated as success.</p>
                </div>
              )}

              {stage === 'success' && result && (
                <div className="cw-receipt">
                  <span className="cw-receipt__mark"><Icon name="check" size={26} /></span>
                  <h3>Contribution recorded</h3>
                  <p>Thank you. Your support for the family has been recorded in this demonstration.</p>
                  <dl className="cw-receipt__facts">
                    <div><dt>Receipt reference</dt><dd>{result.receiptRef}</dd></div>
                    <div><dt>Amount</dt><dd>{money(result.amount)}</dd></div>
                    <div><dt>Method</dt><dd>{methodLabels[result.method]}</dd></div>
                    <div><dt>Contributor</dt><dd>{result.anonymous ? 'Anonymous' : result.contributorName}</dd></div>
                    <div><dt>Case</dt><dd>{item.caseRef}</dd></div>
                    <div><dt>Status</dt><dd><StatusChip tone="success">Confirmed</StatusChip></dd></div>
                  </dl>
                  {result.message && <p className="cw-receipt__message">“{result.message}”</p>}
                  {result.message && <p className="cw-inline-note"><Icon name="clock" size={14} /> Your message is held for moderation and will appear on the tribute wall only if the family allows it and a moderator approves it.</p>}
                  <div className="cw-receipt__notice">No real money was processed. This receipt is a demonstration record and does not confirm insurance cover, a claim or a Fidelity benefit.</div>
                  <div className="cw-action-row">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => window.print()}>Print receipt</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={reset}>Make another contribution</button>
                  </div>
                </div>
              )}

              {stage === 'failed' && (
                <div className="cw-outcome cw-outcome--failed">
                  <span className="cw-outcome__icon"><Icon name="alert" size={24} /></span>
                  <h3>The simulated payment was declined</h3>
                  <p>No money was taken, no receipt was issued and nothing was added to the family&rsquo;s confirmed total.</p>
                  <div className="cw-action-row">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => setStage('form')}>Try another method</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={reset}>Start again</button>
                  </div>
                </div>
              )}

              {stage === 'pending' && (
                <div className="cw-outcome cw-outcome--pending">
                  <span className="cw-outcome__icon"><Icon name="clock" size={24} /></span>
                  <h3>Waiting for confirmation</h3>
                  <p>The provider has not confirmed this payment. It is not included in the public total, does not count as money raised and cannot be paid out.</p>
                  <p className="cw-inline-note">Reference {result?.providerRef ?? 'simulated'} · no receipt yet</p>
                  <div className="cw-action-row">
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => void checkPending()}>Check provider status (demo)</button>
                    <button type="button" className="btn btn--outline btn--sm" onClick={reset}>Start again</button>
                  </div>
                </div>
              )}
            </section>

            <div className="cw-public__assurance">
              <Icon name="shield" size={18} />
              <p><strong>Verified case, separate sources.</strong> This page accepts community contributions only. A Fidelity benefit, if any, is handled separately through Fidelity Claims.</p>
            </div>

            <button type="button" className="cw-report-link" onClick={openReport}>
              <Icon name="alert" size={14} /> Report a concern with this page
            </button>
            {reportNote && <p className="cw-report-note" role="status">{reportNote}</p>}
          </aside>
        </div>

        <p className="cw-public__fineprint">
          Chema Wallet is part of the Fidelity Life funeral services demonstration platform. No real EcoCash, OneMoney or card payment is processed. Verification applies to the community funeral case only and is not proof of insurance cover or claim approval. All names, amounts and events on this page are sample data.
        </p>
      </div>

      <dialog ref={dialogRef} className="cw-dialog" onClose={() => setReportOpen(false)} aria-labelledby="cw-report-title">
        <form className="cw-dialog__inner" onSubmit={submitReport}>
          <div className="cw-dialog__head">
            <div><p className="cw-eyebrow">Trust &amp; safety</p><h2 id="cw-report-title">Report a concern</h2></div>
            <button type="button" className="cw-dialog__close" aria-label="Close report form" onClick={() => { dialogRef.current?.close(); setReportOpen(false) }}>×</button>
          </div>
          {reportOpen && (
            <>
              <p className="cw-inline-note">Tell us what looks wrong. Reports create a traceable case for a human reviewer; they never automatically block the family.</p>
              <label className="field"><span className="field__label">What is the concern?</span>
                <select className="select" value={report.category} onChange={(event) => setReport({ ...report, category: event.target.value })}>
                  <option value="report">Something looks wrong on the page</option>
                  <option value="fraud">Suspected fraud or impersonation</option>
                  <option value="authority">Family authority concern</option>
                  <option value="payment">Payment concern</option>
                </select>
              </label>
              <label className="field"><span className="field__label">Details</span><textarea className="textarea" rows={4} minLength={10} required value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })} placeholder="What did you notice? Please avoid sharing sensitive documents in this demo." /></label>
              <div className="cw-action-row">
                <button type="submit" className="btn btn--primary btn--sm">Submit report</button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => { dialogRef.current?.close(); setReportOpen(false) }}>Cancel</button>
              </div>
            </>
          )}
        </form>
      </dialog>
    </div>
  )
}
