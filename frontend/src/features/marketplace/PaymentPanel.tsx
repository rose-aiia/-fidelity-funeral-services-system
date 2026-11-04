import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { getErrorMessage } from '@/lib/api-error'
import { env } from '@/lib/env'
import { formatUsd } from '@/lib/format'
import type { Order, PaymentMethod } from './data'
import { PaymentFields } from './PaymentFields'
import { usePayOrder, useResolveHostedPayment } from './queries'
import { validatePayment } from './validation'

/**
 * What to do about an order that isn't paid: wait for the EcoCash prompt, finish on the (simulated) Paynow page,
 * or try again after a failure. The order page polls, so this updates by itself once the payment settles.
 */
export function PaymentPanel({ order }: { order: Order }) {
  const { payment } = order

  if (payment.status === 'pending') {
    return payment.method === 'ecocash' ? <EcocashWaiting order={order} /> : <PaynowWaiting order={order} />
  }
  return <TryAgain order={order} />
}

function EcocashWaiting({ order }: { order: Order }) {
  return (
    <section className="card payment-panel payment-panel--waiting" role="status" aria-live="polite">
      <span className="pulse" aria-hidden="true">
        <Icon name="phone" size={26} />
      </span>
      <div className="stack">
        <h2 className="panel__title">Check your phone</h2>
        <p>
          We’ve sent a request for <strong>{formatUsd(order.payment.amount)}</strong> to{' '}
          <strong>{order.payment.ecocashNumber}</strong>. Enter your EcoCash PIN to approve it.
        </p>
        <p className="muted">This page updates by itself as soon as the payment comes through. Reference {order.payment.reference}.</p>
      </div>
    </section>
  )
}

function PaynowWaiting({ order }: { order: Order }) {
  const resolve = useResolveHostedPayment(order.id)

  // In mock mode there is no real Paynow, so this stands in for its hosted page. In live mode the shopper is
  // sent to Paynow and the result arrives from there; this panel then simply waits.
  if (!env.useMock) {
    return (
      <section className="card payment-panel payment-panel--waiting" role="status" aria-live="polite">
        <span className="pulse" aria-hidden="true">
          <Icon name="lock" size={26} />
        </span>
        <div className="stack">
          <h2 className="panel__title">Waiting for Paynow</h2>
          <p className="muted">Complete the payment on Paynow. This page updates by itself once it’s confirmed.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="card payment-panel hosted" aria-labelledby="hosted-title">
      <p className="hosted__brand">
        <Icon name="lock" size={14} /> Paynow secure checkout <span className="hosted__demo">Demo</span>
      </p>
      <h2 id="hosted-title" className="panel__title">
        Pay {formatUsd(order.payment.amount)} to Fidelity Life Assurance of Zimbabwe
      </h2>
      <p className="muted">
        This stands in for Paynow’s own page. In production you would be redirected there and brought back when you’re done.
      </p>
      {resolve.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(resolve.error)}
        </Callout>
      )}
      <div className="payment-actions">
        <button type="button" className="btn btn--primary" disabled={resolve.isPending} onClick={() => resolve.mutate('paid')}>
          {resolve.isPending ? 'Processing…' : `Pay ${formatUsd(order.payment.amount)}`}
        </button>
        <button type="button" className="btn btn--outline" disabled={resolve.isPending} onClick={() => resolve.mutate('failed')}>
          Cancel payment
        </button>
      </div>
    </section>
  )
}

function TryAgain({ order }: { order: Order }) {
  const pay = usePayOrder(order.id)
  const [method, setMethod] = useState<PaymentMethod>(order.payment.method)
  const [ecocash, setEcocash] = useState('')
  const [error, setError] = useState<string>()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validatePayment({ method, ecocashNumber: ecocash })
    setError(found.ecocashNumber)
    if (found.ecocashNumber || found.method) return
    pay.mutate({ method, ...(method === 'ecocash' && { ecocashNumber: ecocash }) })
  }

  return (
    <form className="card payment-panel stack" onSubmit={handleSubmit} noValidate aria-labelledby="retry-title">
      <h2 id="retry-title" className="panel__title">
        {order.status === 'payment_failed' ? 'Let’s try that again' : 'Complete your payment'}
      </h2>
      {order.status === 'payment_failed' && (
        <Callout tone="danger" role="alert">
          {(order.payment.failureReason ?? 'The payment didn’t go through').replace(/[.]?$/, '.')} Nothing was charged
          {order.payment.ecocashNumber ? ` to ${order.payment.ecocashNumber}` : ''}. Your order is saved, so you can pay again or use another
          method.
        </Callout>
      )}
      <PaymentFields
        method={method}
        onMethodChange={setMethod}
        ecocashNumber={ecocash}
        onEcocashNumberChange={setEcocash}
        ecocashError={error}
      />
      {pay.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(pay.error)}
        </Callout>
      )}
      <div>
        <button type="submit" className="btn btn--primary" disabled={pay.isPending}>
          <Icon name="lock" size={18} />
          {pay.isPending ? 'Starting payment…' : `Pay ${formatUsd(order.total)}`}
        </button>
      </div>
    </form>
  )
}
