import { Icon } from '@/components/ui/Icon'
import type { OrderStatus } from './data'
import { TRACKING_STEPS, trackingIndex } from './status'

/** A horizontal progress track for a paid order: Paid, Confirmed, Being prepared, Delivered. */
export function OrderTracker({ status }: { status: OrderStatus }) {
  const current = trackingIndex(status)
  if (current < 0) return null

  return (
    <ol className="tracker" aria-label="Order progress">
      {TRACKING_STEPS.map((step, index) => {
        const state = index < current || status === 'delivered' ? 'done' : index === current ? 'current' : 'todo'
        return (
          <li key={step.status} className={`tracker__step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tracker__dot" aria-hidden="true">
              {state === 'done' && <Icon name="check" size={14} />}
            </span>
            <span className="tracker__label">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
