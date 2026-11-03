import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { orderPath, paths } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { ApiError, getErrorMessage } from '@/lib/api-error'
import { formatUsd } from '@/lib/format'
import { formatPhone, normalisePhone } from '@/lib/phone'
import { cart, useCartMemory } from './cart'
import { DELIVERY_TOWNS, type DeliveryDetails, type PaymentMethod } from './data'
import { PaymentFields } from './PaymentFields'
import { useCreateOrder } from './queries'
import { SummaryRows } from './SummaryRows'
import { useCartSummary } from './useCart'
import { hasErrors, normaliseEcocash, validateDelivery, validatePayment } from './validation'
import './shop.css'

type Errors = Record<string, string | undefined>

/** Server-side validation messages arrive as `delivery.phone`, `payment.ecocashNumber`...; show them on the field. */
const fieldErrorsFrom = (error: unknown): Errors => {
  if (!(error instanceof ApiError) || typeof error.details !== 'object' || error.details === null) return {}
  return Object.fromEntries(Object.entries(error.details as Record<string, string>).map(([key, message]) => [key.split('.').pop()!, message]))
}

/** Problems the server found in the basket itself (a missing engraving, an item withdrawn), which no field can show. */
const basketProblems = (error: unknown): string[] => {
  if (!(error instanceof ApiError) || typeof error.details !== 'object' || error.details === null) return []
  return Object.entries(error.details as Record<string, string>)
    .filter(([key]) => key === 'lines' || key.startsWith('lines.'))
    .map(([, message]) => message)
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const summary = useCartSummary()
  const inMemoryOf = useCartMemory()
  const create = useCreateOrder()

  const [delivery, setDelivery] = useState({
    recipientName: user?.name ?? '',
    phone: user ? formatPhone(user.phone) : '',
    town: '',
    address: '',
    neededBy: '',
    note: '',
  })
  const [method, setMethod] = useState<PaymentMethod>('ecocash')
  const [ecocash, setEcocash] = useState(user ? formatPhone(user.phone) : '')
  const [errors, setErrors] = useState<Errors>({})
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  const set = (key: keyof typeof delivery) => (value: string) => setDelivery((current) => ({ ...current, [key]: value }))

  if (summary.lines.length === 0 && !create.isPending && !create.isSuccess) {
    return (
      <main className="container status-page" id="main-content">
        <p className="eyebrow">Checkout</p>
        <h1>Your basket is empty</h1>
        <p className="muted">Add something from the marketplace and come back here to check out.</p>
        <Link className="btn btn--primary" to={paths.marketplace}>
          Browse the marketplace
        </Link>
      </main>
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const phone = normalisePhone(delivery.phone) ?? delivery.phone
    const payload: DeliveryDetails = {
      recipientName: delivery.recipientName,
      phone,
      town: delivery.town,
      address: delivery.address,
      ...(delivery.neededBy && { neededBy: delivery.neededBy }),
      ...(delivery.note.trim() && { note: delivery.note.trim() }),
    }
    const found: Errors = {
      ...validateDelivery(payload),
      ...(method === 'ecocash' && validatePayment({ method, ecocashNumber: ecocash })),
    }
    setErrors(found)
    if (hasErrors(found)) return

    create.mutate(
      {
        lines: summary.lines.map(({ line }) => ({
          itemId: line.itemId,
          options: line.options,
          quantity: line.quantity,
          ...(line.personalisation && { personalisation: line.personalisation }),
        })),
        delivery: payload,
        payment: { method, ...(method === 'ecocash' && { ecocashNumber: normaliseEcocash(ecocash) ?? ecocash }) },
        ...(inMemoryOf && { inMemoryOf }),
      },
      {
        onSuccess: (order) => {
          cart.clear()
          navigate(orderPath(order.id, '?placed=1'), { replace: true })
        },
        onError: (error) => setErrors(fieldErrorsFrom(error)),
      },
    )
  }

  return (
    <main id="main-content">
      <div className="container shop-body">
        <header className="page-head reveal">
          <p className="eyebrow">Checkout</p>
          <h1>Nearly there.</h1>
        </header>

        <form className="checkout" onSubmit={handleSubmit} noValidate>
          <div className="checkout__forms">
            <section className="card panel stack reveal" style={{ '--i': 1 } as React.CSSProperties} aria-labelledby="delivery-title">
              <h2 id="delivery-title" className="panel__title">
                <span className="step-badge">1</span> Delivery details
              </h2>
              {inMemoryOf && (
                <Callout tone="info" icon="heart">
                  This order is in memory of <strong>{inMemoryOf}</strong>.
                </Callout>
              )}
              <TextField label="Who will receive this?" autoComplete="name" value={delivery.recipientName} onChange={set('recipientName')} error={errors.recipientName} />
              <TextField
                label="Their mobile number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={delivery.phone}
                onChange={set('phone')}
                error={errors.phone}
                hint="The provider will use this to arrange delivery."
              />
              <div className="field">
                <label className="field__label" htmlFor="town">
                  Town
                </label>
                <select
                  id="town"
                  className="select"
                  value={delivery.town}
                  onChange={(event) => set('town')(event.target.value)}
                  aria-invalid={errors.town ? true : undefined}
                >
                  <option value="">Choose a town</option>
                  {DELIVERY_TOWNS.map((town) => (
                    <option key={town}>{town}</option>
                  ))}
                </select>
                {errors.town && (
                  <small className="field__error" role="alert">
                    {errors.town}
                  </small>
                )}
              </div>
              <TextField
                label="Address or venue"
                autoComplete="street-address"
                placeholder="St Mary’s Church, Makokoba"
                value={delivery.address}
                onChange={set('address')}
                error={errors.address}
              />
              <TextField
                label="Needed by"
                tag="Optional"
                type="date"
                min={today}
                value={delivery.neededBy}
                onChange={set('neededBy')}
                error={errors.neededBy}
              />
              <TextField label="A note for the provider" tag="Optional" value={delivery.note} onChange={set('note')} error={errors.note} />
            </section>

            <section className="card panel stack reveal" style={{ '--i': 2 } as React.CSSProperties} aria-labelledby="payment-title">
              <h2 id="payment-title" className="panel__title">
                <span className="step-badge">2</span> Payment
              </h2>
              <PaymentFields
                method={method}
                onMethodChange={setMethod}
                ecocashNumber={ecocash}
                onEcocashNumberChange={setEcocash}
                ecocashError={errors.ecocashNumber}
              />
            </section>
          </div>

          <aside className="card panel checkout__summary reveal" style={{ '--i': 3 } as React.CSSProperties} aria-labelledby="summary-title">
            <h2 id="summary-title" className="panel__title">
              Your order
            </h2>
            <SummaryRows
              rows={summary.lines.map(({ line, item, optionLabels, lineTotal }) => ({
                key: line.id,
                title: item.title,
                image: item.image,
                accent: item.accent,
                optionLabels,
                quantity: line.quantity,
                lineTotal,
                personalisation: line.personalisation,
              }))}
              subtotal={summary.subtotal}
              deliveryFee={summary.deliveryFee}
              total={summary.total}
            />

            {create.error && !(create.error instanceof ApiError && create.error.status === 422) && (
              <Callout tone="danger" role="alert">
                {getErrorMessage(create.error)}
              </Callout>
            )}
            {create.error instanceof ApiError && create.error.status === 422 && (
              <Callout tone="danger" role="alert">
                {basketProblems(create.error).length > 0
                  ? basketProblems(create.error).join(' ')
                  : 'Please check the highlighted details and try again.'}
              </Callout>
            )}

            <button type="submit" className="btn btn--primary btn--lg w-full" disabled={create.isPending}>
              <Icon name="lock" size={18} />
              {create.isPending ? 'Placing your order…' : `Pay ${formatUsd(summary.total)}`}
            </button>
            <p className="checkout__fine">
              You’ll confirm the payment on the next screen. Prices are confirmed by us when you place the order.
            </p>
          </aside>
        </form>
      </div>
    </main>
  )
}
