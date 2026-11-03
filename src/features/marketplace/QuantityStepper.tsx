import { Icon } from '@/components/ui/Icon'
import { MAX_QUANTITY } from './data'

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  /** Names what is being counted, for screen readers: "Granite remembrance plaque". */
  label: string
  /** Allow stepping to 0 (which the caller treats as "remove"). */
  allowZero?: boolean
}

export function QuantityStepper({ value, onChange, label, allowZero = false }: QuantityStepperProps) {
  return (
    <div className="stepper-qty" role="group" aria-label={`Quantity of ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= (allowZero ? 0 : 1)}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY} aria-label="Increase quantity">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
