import { Icon } from '@/components/ui/Icon'

/** A brief, warm confirmation shown the moment a policy gets linked. */
export function LinkedCelebration({ policyNumber }: { policyNumber: string }) {
  return (
    <div className="celebrate" role="status">
      <span className="celebrate__mark" aria-hidden="true">
        <Icon name="check" size={28} />
      </span>
      <div>
        <p className="celebrate__title">Policy linked</p>
        <p>
          {policyNumber} is now part of your account. Everything about your cover is here whenever you need it.
        </p>
      </div>
    </div>
  )
}
