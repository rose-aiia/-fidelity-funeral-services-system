import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { StatusChip } from '@/components/ui/StatusChip'
import { paths } from '@/config/routes'
import { formatDate, formatUsd, nextDueDate } from '@/lib/format'
import { coverProgress, statusDisplay } from './cover'
import type { Policy } from './data'

type PolicyCardProps = {
  policy: Policy
  /** Hide the "view full policy" link when already on the policy page. */
  showLink?: boolean
}

export function PolicyCard({ policy, showLink = true }: PolicyCardProps) {
  const cover = coverProgress(policy)
  const status = statusDisplay[policy.status]
  const ringLabel = cover.isComplete
    ? 'Waiting period complete'
    : `${policy.monthsPaid} of ${policy.waitingPeriodMonths} waiting-period months complete`

  return (
    <article className="card policy-card" aria-labelledby="policy-card-title">
      <header className="policy-card__head">
        <div>
          <p className="eyebrow">Your policy</p>
          <h2 id="policy-card-title" className="policy-card__title">
            {policy.planName}
          </h2>
          <p className="policy-card__number">{policy.number}</p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </header>

      <div className="policy-card__body">
        <ProgressRing progress={cover.fraction} label={ringLabel}>
          {cover.isComplete ? (
            <>
              <Icon name="check" size={26} className="policy-card__tick" />
              <small>Fully covered</small>
            </>
          ) : (
            <>
              <strong>
                {policy.monthsPaid}/{policy.waitingPeriodMonths}
              </strong>
              <small>months</small>
            </>
          )}
        </ProgressRing>

        <dl className="policy-card__facts">
          <div>
            <dt>Cover amount</dt>
            <dd className="policy-card__cover">{formatUsd(policy.coverAmount)}</dd>
          </div>
          <div>
            <dt>Monthly premium</dt>
            <dd>{formatUsd(policy.monthlyPremium)}</dd>
          </div>
          <div>
            <dt>Next payment</dt>
            <dd>{formatDate(nextDueDate(policy.paymentDay))}</dd>
          </div>
        </dl>
      </div>

      {!cover.isComplete && (
        <p className="policy-card__note">
          {cover.monthsRemaining} more {cover.monthsRemaining === 1 ? 'month' : 'months'} of premiums until the full
          benefit is payable.
        </p>
      )}

      {showLink && (
        <Link className="link-arrow" to={paths.accountPolicy}>
          View full policy <Icon name="arrow-right" size={16} />
        </Link>
      )}
    </article>
  )
}
