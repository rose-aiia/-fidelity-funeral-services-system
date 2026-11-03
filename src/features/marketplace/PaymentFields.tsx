import { Callout } from '@/components/ui/Callout'
import { TextField } from '@/components/ui/TextField'
import { env } from '@/lib/env'
import type { PaymentMethod } from './data'

const methods: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'ecocash', label: 'EcoCash', hint: 'Approve a prompt on your phone with your PIN.' },
  { id: 'paynow', label: 'Paynow', hint: 'Pay by card or other wallets on Paynow’s secure page.' },
]

type PaymentFieldsProps = {
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  ecocashNumber: string
  onEcocashNumberChange: (value: string) => void
  ecocashError?: string
}

/** Choose how to pay, and for EcoCash which wallet to charge. Shared by checkout and "try again". */
export function PaymentFields({ method, onMethodChange, ecocashNumber, onEcocashNumberChange, ecocashError }: PaymentFieldsProps) {
  return (
    <div className="stack">
      <fieldset className="choices">
        <legend className="visually-hidden">Payment method</legend>
        {methods.map((option) => (
          <label key={option.id} className="choice">
            <input type="radio" name="payment-method" value={option.id} checked={method === option.id} onChange={() => onMethodChange(option.id)} />
            <span className="choice__body">
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {method === 'ecocash' && (
        <>
          <TextField
            label="EcoCash number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="077 123 4567"
            value={ecocashNumber}
            onChange={onEcocashNumberChange}
            error={ecocashError}
            hint="The Econet number that has your EcoCash wallet."
          />
          {env.useMock && (
            <Callout tone="info">
              Demo mode: any 077 or 078 number is approved after a few seconds. Use 078 000 0000 to see a
              declined payment.
            </Callout>
          )}
        </>
      )}
    </div>
  )
}
