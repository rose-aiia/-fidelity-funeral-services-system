import QRCode from 'qrcode'
import { useEffect, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'
import { StatusChip } from '@/components/ui/StatusChip'
import {
  caseStatusLabels,
  caseStatusTone,
  disputeCategoryLabels,
  disputeStatusLabels,
  disputeStatusTone,
  money,
  payoutStatusLabels,
  payoutStatusTone,
  roundMoney,
  type ChemaCase,
  type ChemaDispute,
  type ChemaPayoutRequest,
  type CaseStatus,
  type DisputeStatus,
  type PayoutStatus,
} from './data'

export function CaseStatusChip({ status }: { status: CaseStatus }) {
  return <StatusChip tone={caseStatusTone[status]}>{caseStatusLabels[status]}</StatusChip>
}

export function PayoutStatusChip({ status }: { status: PayoutStatus }) {
  return <StatusChip tone={payoutStatusTone[status]}>{payoutStatusLabels[status]}</StatusChip>
}

export function DisputeStatusChip({ status }: { status: DisputeStatus }) {
  return <StatusChip tone={disputeStatusTone[status]}>{disputeStatusLabels[status]}</StatusChip>
}

export function ProgressBar({
  value,
  target,
  showAmounts = true,
  label = 'Community contributions',
}: {
  value: number
  target: number
  showAmounts?: boolean
  label?: string
}) {
  const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
  return (
    <div className="cw-progress">
      <div className="cw-progress__meta">
        <span>{label}</span>
        <strong>{showAmounts ? (target > 0 ? `${percent}% of ${money(target)}` : money(value)) : 'Progress hidden by the family'}</strong>
      </div>
      <div
        className="cw-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target > 0 ? target : Math.max(value, 1)}
        aria-valuenow={showAmounts ? value : undefined}
        aria-label={showAmounts ? `${money(value)} raised${target > 0 ? ` of ${money(target)}` : ''}` : 'Contribution progress is private'}
      >
        <span className="cw-progress__bar" style={{ width: `${showAmounts ? percent : 0}%` }} />
      </div>
    </div>
  )
}

export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  const [result, setResult] = useState<{ value: string; src?: string; failed?: boolean }>({ value: '' })

  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: '#242424', light: '#ffffff' } })
      .then((url) => {
        if (live) setResult({ value, src: url })
      })
      .catch(() => {
        if (live) setResult({ value, failed: true })
      })
    return () => {
      live = false
    }
  }, [value, size])

  const failed = result.value === value && result.failed
  const src = result.value === value ? result.src : undefined

  if (failed) return <div className="cw-qr cw-qr--empty" style={{ width: size, height: size }}><Icon name="alert" size={24} /><span>QR unavailable</span></div>
  if (!src) return <div className="cw-qr cw-qr--empty" style={{ width: size, height: size }} aria-busy="true"><span className="visually-hidden">Generating QR code</span></div>
  return <img className="cw-qr" src={src} width={size} height={size} alt="QR code for the public Chema Wallet contribution page" />
}

export function ShareLinkBox({ url, compact = false }: { url: string; compact?: boolean }) {
  const [note, setNote] = useState('')
  const encoded = encodeURIComponent(`You can support the family through this verified Chema Wallet contribution page: ${url}`)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setNote('Link copied.')
    } catch {
      setNote('Copy is not available in this browser. Select the link to copy it.')
    }
    window.setTimeout(() => setNote(''), 3500)
  }

  return (
    <div className={`cw-share ${compact ? 'cw-share--compact' : ''}`}>
      <div className="cw-share__field">
        <input className="input" readOnly value={url} aria-label="Public contribution link" onFocus={(event) => event.currentTarget.select()} />
        <button type="button" className="btn btn--outline btn--sm" onClick={copy}>Copy link</button>
      </div>
      <div className="cw-share__actions">
        <a className="btn btn--primary btn--sm" href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noopener noreferrer">
          <Icon name="chat" size={16} /> Share on WhatsApp
        </a>
        <a className="btn btn--outline btn--sm" href={url} target="_blank" rel="noopener noreferrer">
          Open public page <Icon name="arrow-right" size={16} />
        </a>
      </div>
      {note && <p className="cw-inline-note" role="status">{note}</p>}
    </div>
  )
}

export function SourceCard({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
  badge,
}: {
  icon: IconName
  label: string
  value: number | string
  hint: string
  tone?: 'community' | 'cash' | 'fidelity' | 'neutral'
  badge?: string
}) {
  return (
    <article className={`cw-source cw-source--${tone}`}>
      <div className="cw-source__top">
        <span className="cw-source__icon"><Icon name={icon} size={19} /></span>
        {badge && <span className="cw-source__badge">{badge}</span>}
      </div>
      <p className="cw-source__label">{label}</p>
      <p className="cw-source__value">{typeof value === 'number' ? money(value) : value}</p>
      <p className="cw-source__hint">{hint}</p>
    </article>
  )
}

export function StatTile({
  icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: IconName
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <article className={`cw-stat ${accent ? 'cw-stat--accent' : ''}`}>
      <span className="cw-stat__icon"><Icon name={icon} size={19} /></span>
      <div>
        <p className="cw-stat__label">{label}</p>
        <p className="cw-stat__value">{value}</p>
        {hint && <p className="cw-stat__hint">{hint}</p>}
      </div>
    </article>
  )
}

export function CaseProgressSummary({ item, raised }: { item: ChemaCase; raised: number }) {
  const percent = item.targetAmount > 0 ? Math.min(100, Math.round((raised / item.targetAmount) * 100)) : 0
  return (
    <div className="cw-case-progress">
      <div className="cw-case-progress__copy">
        <strong>{money(raised)}</strong>
        <span>{item.targetAmount > 0 ? `of ${money(roundMoney(item.targetAmount))} target` : 'No target set'}</span>
      </div>
      <div className="cw-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={item.targetAmount || Math.max(raised, 1)} aria-valuenow={raised} aria-label={`${money(raised)} raised`}>
        <span className="cw-progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function DisputeRow({ dispute }: { dispute: ChemaDispute }) {
  return (
    <article className="cw-queue-row">
      <span className={`cw-queue-row__icon ${dispute.severity === 'high' ? 'is-danger' : ''}`}><Icon name="alert" size={17} /></span>
      <div className="cw-queue-row__main">
        <strong>{disputeCategoryLabels[dispute.category]}</strong>
        <p>{dispute.summary}</p>
        <div className="cw-inline-meta">
          <span>Owner: {dispute.owner}</span>
          {dispute.amount ? <span>{money(dispute.amount)}</span> : null}
        </div>
      </div>
      <DisputeStatusChip status={dispute.status} />
    </article>
  )
}

export function PayoutRow({ payout }: { payout: ChemaPayoutRequest }) {
  const approved = payout.approvals.filter((approval) => approval.decision === 'approved').length
  return (
    <article className="cw-queue-row">
      <span className="cw-queue-row__icon"><Icon name="wallet" size={17} /></span>
      <div className="cw-queue-row__main">
        <strong>{money(payout.amount)} · {payout.purpose}</strong>
        <p>Requested by {payout.requestedBy} · {new Date(payout.requestedAt).toLocaleDateString('en-GB')}</p>
        <div className="cw-inline-meta">
          <span>{approved}/{payout.requiredApprovals} approvals</span>
          <span>{payout.destinationMasked}</span>
        </div>
      </div>
      <PayoutStatusChip status={payout.status} />
    </article>
  )
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="cw-empty">
      <span className="cw-empty__icon"><Icon name={icon} size={22} /></span>
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  )
}
