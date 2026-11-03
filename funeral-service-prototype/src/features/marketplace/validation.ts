// Pure order validation shared by the checkout form and the mock servers.
// Importable from Node (scripts/mock-api.mjs): only relative `.ts` imports.
import { normalisePhone } from '../../lib/phone.ts'
import { DELIVERY_TOWNS, type DeliveryDetails, type PaymentInput } from './data.ts'

export type FieldErrors<Key extends string> = Partial<Record<Key, string>>

export const hasErrors = (errors: object): boolean => Object.values(errors).some(Boolean)

/** EcoCash is Econet's wallet, so only Econet mobile numbers (077 and 078) can pay with it. */
export function normaliseEcocash(raw: string): string | null {
  const phone = normalisePhone(raw)
  return phone && /^\+2637[78]/.test(phone) ? phone : null
}

const isoDay = (now: Date) => now.toISOString().slice(0, 10)

export function validateDelivery(
  delivery: DeliveryDetails,
  now: Date = new Date(),
): FieldErrors<'recipientName' | 'phone' | 'town' | 'address' | 'neededBy' | 'note'> {
  const errors: FieldErrors<'recipientName' | 'phone' | 'town' | 'address' | 'neededBy' | 'note'> = {}
  const name = delivery.recipientName.trim()
  if (name.length < 2) errors.recipientName = 'Who will receive this?'
  else if (name.length > 80) errors.recipientName = 'Keep the name under 80 characters.'

  if (!normalisePhone(delivery.phone)) errors.phone = 'Enter a Zimbabwean mobile number, for example 077 123 4567.'

  if (!(DELIVERY_TOWNS as readonly string[]).includes(delivery.town)) errors.town = 'Choose a town we deliver to.'

  const address = delivery.address.trim()
  if (address.length < 5) errors.address = 'Tell us where to deliver or hold the service.'
  else if (address.length > 200) errors.address = 'Keep the address under 200 characters.'

  if (delivery.neededBy) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(delivery.neededBy) || Number.isNaN(Date.parse(delivery.neededBy))) {
      errors.neededBy = 'Choose a valid date.'
    } else if (delivery.neededBy < isoDay(now)) {
      errors.neededBy = 'That date has already passed.'
    }
  }

  if ((delivery.note?.trim().length ?? 0) > 300) errors.note = 'Keep the note under 300 characters.'
  return errors
}

export function validatePayment(payment: PaymentInput): FieldErrors<'method' | 'ecocashNumber'> {
  const errors: FieldErrors<'method' | 'ecocashNumber'> = {}
  if (payment.method !== 'ecocash' && payment.method !== 'paynow') errors.method = 'Choose how you’d like to pay.'
  if (payment.method === 'ecocash' && !normaliseEcocash(payment.ecocashNumber ?? '')) {
    errors.ecocashNumber = 'Enter the Econet number that has your EcoCash wallet (077 or 078).'
  }
  return errors
}
