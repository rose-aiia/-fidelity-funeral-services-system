import { Icon, type IconName } from '@/components/ui/Icon'
import { StatusChip, type StatusTone } from '@/components/ui/StatusChip'
import { formatRelativeDays } from '@/lib/format'
import { requestKindLabel, REQUEST_STEPS, type AssistanceRequest, type RequestKind, type RequestStatus } from './data'

const kindIcon: Record<RequestKind, IconName> = { bereavement: 'heart', claim: 'file', general: 'chat' }

const statusTone: Record<RequestStatus, StatusTone> = {
  received: 'info',
  assigned: 'info',
  in_progress: 'warning',
  complete: 'success',
}

const statusLabel = (status: RequestStatus) => REQUEST_STEPS.find((step) => step.value === status)?.label ?? status

type RequestCardProps = {
  request: AssistanceRequest
  /** Dashboard variant: no message, no stepper labels. */
  compact?: boolean
}

export function RequestCard({ request, compact = false }: RequestCardProps) {
  const currentIndex = REQUEST_STEPS.findIndex((step) => step.value === request.status)

  return (
    <article className={`request-card${compact ? ' request-card--compact' : ''}`}>
      <div className="request-card__head">
        <span className="icon-tile">
          <Icon name={kindIcon[request.kind]} size={20} />
        </span>
        <div className="request-card__title">
          <strong>{requestKindLabel[request.kind]}</strong>
          <span className="muted">
            {request.reference} · {formatRelativeDays(request.createdAt)}
          </span>
        </div>
        <StatusChip tone={statusTone[request.status]}>{statusLabel(request.status)}</StatusChip>
      </div>

      {!compact && request.message && <p className="request-card__message">“{request.message}”</p>}

      {!compact && (
        <>
          <ol className="stepper" aria-label="Request progress">
            {REQUEST_STEPS.map((step, index) => (
              <li
                key={step.value}
                className={`stepper__step${index < currentIndex ? ' is-done' : ''}${index === currentIndex ? ' is-current' : ''}`}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className="stepper__dot" aria-hidden="true">
                  {index < currentIndex && <Icon name="check" size={12} />}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
          {request.assignedTo && (
            <p className="request-card__adviser">
              <Icon name="user" size={16} /> {request.assignedTo} is looking after this for you.
            </p>
          )}
        </>
      )}
    </article>
  )
}
