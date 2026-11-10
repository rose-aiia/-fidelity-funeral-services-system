import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { paths } from '@/config/routes'
import { chemaStore } from './store'
import { methodLabels, type ChemaContribution, type ContributionMethod } from './data'
import './chema-wallet.css'

function money(n: number) { return `USD ${n.toFixed(2)}` }

export default function ContributePage() {
  const { token = '' } = useParams()
  const [state, setState] = useState(() => chemaStore.getState())
  const item = useMemo(() => state.cases.find((c) => c.contributionToken === token), [state, token])
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState<ContributionMethod>('ecocash')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ChemaContribution | null>(null)
  const [error, setError] = useState('')

  if (!item) {
    return (
      <main className="container chema-public" id="main-content">
        <div className="card stack">
          <h1>Contribution page not available</h1>
          <p className="muted">This contribution link is invalid or no longer available. Please ask the family or coordinator to share the correct Chema Wallet link.</p>
          <Link className="btn btn--primary" to={paths.home}>Back to website</Link>
        </div>
      </main>
    )
  }

  if (!item.activated) {
    return (
      <main className="container chema-public" id="main-content">
        <div className="card stack">
          <h1>Chema Wallet not active</h1>
          <p className="muted">Chema Wallet has not been activated for this funeral case yet. Please check back later or contact the family/coordinator.</p>
          <p className="chema-meta">Case: {item.caseRef} · {item.deceasedName}</p>
        </div>
      </main>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    setError('')
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) { setError('Please enter a valid contribution amount.'); return }
    if (!anonymous && !name.trim()) { setError('Please enter your name or choose anonymous contribution.'); return }
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 900))
    const { state: next, contribution } = chemaStore.addDigitalContribution({
      caseId: item.id,
      amount: amt,
      contributorName: anonymous ? 'Anonymous' : name.trim(),
      anonymous,
      message: message.trim() || undefined,
      method,
      status: 'successful',
    })
    setState(next)
    setResult(contribution)
    setProcessing(false)
  }

  return (
    <main className="chema-public" id="main-content">
      <header className="chema-public__hero">
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>Chema Wallet · Community contribution</p>
        <h1>Support the family of {item.deceasedName}</h1>
        <p>{item.funeralInfo}</p>
        <p><strong>Funeral case:</strong> {item.caseRef}</p>
      </header>

      <div className="chema-notice" role="note">
        <strong>Important:</strong> This is a demonstration prototype. Payments are simulated only — no real EcoCash, OneMoney or card transaction is processed, no money is transferred, and no card details, PINs or OTPs are collected or stored. Community contributions are separate from Fidelity policy benefits and claims. A verified funeral case does not represent proof of insurance cover or claim approval.
      </div>

      {!result ? (
        <section className="card stack" aria-labelledby="contrib-form-title">
          <h2 id="contrib-form-title" className="panel__title">Send Chema contribution (simulated)</h2>
          {error && <Callout tone="warning">{error}</Callout>}
          <form className="chema-form" onSubmit={submit}>
            <div className="chema-form-grid">
              <label className="field"><span className="field__label">Contribution amount (USD)</span><input className="input" type="number" min="1" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 20.00" inputMode="decimal" /></label>
              <label className="field"><span className="field__label">Simulated payment method</span>
                <select className="select" value={method} onChange={(e) => setMethod(e.target.value as ContributionMethod)}>
                  <option value="ecocash">EcoCash (simulated)</option>
                  <option value="onemoney">OneMoney (simulated)</option>
                  <option value="card">Card (simulated)</option>
                </select>
              </label>
            </div>
            <label className="field"><span className="field__label">Contributor name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={anonymous} placeholder={anonymous ? 'Anonymous contribution selected' : 'Your name'} /></label>
            <label className="check-field"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> <span>Make this contribution anonymous</span></label>
            <label className="field"><span className="field__label">Condolence message (optional)</span><textarea className="textarea" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share a message of support (optional)" /></label>
            <div className="chema-notice"><strong>Simulation notice:</strong> selecting a method does not connect to any payment provider. No PIN, OTP or card details are requested.</div>
            <button type="submit" className="btn btn--primary" disabled={processing}>{processing ? 'Processing simulation…' : `Continue with ${methodLabels[method]} (simulated)`}</button>
          </form>
        </section>
      ) : (
        <section className="chema-receipt stack" aria-labelledby="receipt-title">
          <p className="eyebrow">Confirmation</p>
          <h2 id="receipt-title" className="panel__title">Contribution recorded (demo receipt)</h2>
          <p>Thank you for your support. Your simulated contribution for <strong>{item.deceasedName}</strong> has been recorded for demonstration purposes.</p>
          <dl className="chema-form-grid" style={{ margin: 0 }}>
            <div><dt className="chema-meta">Receipt reference</dt><dd><strong>{result.receiptRef}</strong> (demo)</dd></div>
            <div><dt className="chema-meta">Status</dt><dd><strong>{result.status}</strong> (simulated)</dd></div>
            <div><dt className="chema-meta">Amount</dt><dd><strong>{money(result.amount)}</strong></dd></div>
            <div><dt className="chema-meta">Method</dt><dd>{methodLabels[result.method]} (simulated)</dd></div>
            <div><dt className="chema-meta">Contributor</dt><dd>{result.anonymous ? 'Anonymous' : result.contributorName}</dd></div>
            <div><dt className="chema-meta">Funeral case</dt><dd>{item.caseRef}</dd></div>
          </dl>
          {result.message && <p><strong>Message:</strong> {result.message}</p>}
          <div className="chema-notice"><strong>No real money processed.</strong> This receipt is for demonstration only and does not confirm a real financial transaction, insurance benefit, claim approval, withdrawal or settlement.</div>
          <div className="chema-actions">
            <button type="button" className="btn btn--outline" onClick={() => { setResult(null); setAmount(''); setMessage(''); setAnonymous(false); }}>Make another simulated contribution</button>
            <Link className="btn btn--primary" to={paths.home}>Return to website</Link>
          </div>
        </section>
      )}

      <p className="chema-meta" style={{ textAlign: 'center' }}>Chema Wallet is part of the Fidelity Life Funeral Services demonstration platform. Contributions shown here are community support records and are kept separate from policy benefits and claims.</p>
    </main>
  )
}
