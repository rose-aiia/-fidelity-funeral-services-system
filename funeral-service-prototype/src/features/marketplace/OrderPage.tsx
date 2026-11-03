import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusChip } from '@/components/ui/StatusChip'
import { paths } from '@/config/routes'
import { ApiError } from '@/lib/api-error'
import { formatDate, formatServiceTime, formatUsd } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { Order } from './data'
import { OrderTracker } from './OrderTracker'
import { PaymentPanel } from './PaymentPanel'
import { useOrder } from './queries'
import { needsPayment, orderStatusDisplay, paymentMethodLabel } from './status'
import { SummaryRows } from './SummaryRows'
import './shop.css'

export default function OrderPage() {
  const { id } = useParams()
  const order = useOrder(id)

  if (order.data) return <OrderView order={order.data} />

  if (order.error instanceof ApiError && order.error.status === 404) {
    return (
      <div className="page-stack">
        <div className="card empty empty--large">
          <h1 className="panel__title">We couldn’t find that order</h1>
          <p className="muted">It may belong to a different account.</p>
          <Link className="btn btn--primary" to={paths.accountOrders}>
            Back to my orders
          </Link>
        </div>
      </div>
    )
  }

  return order.isPending ? (
    <div className="page-stack" role="status" aria-busy="true">
      <span className="visually-hidden">Loading your order…</span>
      <Skeleton height="7rem" className="skeleton--card" />
      <Skeleton height="16rem" className="skeleton--card" />
    </div>
  ) : (
    <QueryState isPending={false} error={order.error} onRetry={() => void order.refetch()} noun="your order" />
  )
}

function OrderView({ order }: { order: Order }) {
  const [params] = useSearchParams()
  const justPlaced = params.get('placed') === '1'
  const status = orderStatusDisplay[order.status]
  const paid = order.payment.status === 'paid'

  return (
    <div className="page-stack">
      <header className="card order-head reveal">
        <div className="order-head__main">
          <p className="eyebrow">Order</p>
          <h1>{order.reference}</h1>
          <p className="muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </header>

      {paid && justPlaced && (
        <div className="celebrate" role="status">
          <span className="celebrate__mark" aria-hidden="true">
            <Icon name="check" size={28} />
          </span>
          <div>
            <p className="celebrate__title">Thank you. Your order is paid.</p>
            <p>The provider has been told and will confirm shortly. You can follow every step right here.</p>
          </div>
        </div>
      )}

      {needsPayment(order) || order.payment.status === 'pending' ? (
        <div className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
          <PaymentPanel order={order} />
        </div>
      ) : (
        <section className="card panel reveal" style={{ '--i': 1 } as React.CSSProperties} aria-labelledby="progress-title">
          <h2 id="progress-title" className="panel__title">
            Progress
          </h2>
          <OrderTracker status={order.status} />
          <ol className="events">
            {[...order.events].reverse().map((event) => (
              <li key={`${event.at}-${event.label}`}>
                <span className="events__label">{event.label}</span>
                <time dateTime={event.at}>{formatServiceTime(event.at)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card panel reveal" style={{ '--i': 2 } as React.CSSProperties} aria-labelledby="items-title">
        <h2 id="items-title" className="panel__title">
          What you ordered
        </h2>
        <SummaryRows
          rows={order.lines.map((line, index) => ({ key: `${line.itemId}-${index}`, ...line, accent: '✦' }))}
          subtotal={order.subtotal}
          deliveryFee={order.deliveryFee}
          total={order.total}
        />
      </section>

      <div className="order-details reveal" style={{ '--i': 3 } as React.CSSProperties}>
        <section className="card panel" aria-labelledby="delivery-details-title">
          <h2 id="delivery-details-title" className="panel__title">
            Delivery
          </h2>
          <dl className="details details--single">
            <div>
              <dt>For</dt>
              <dd>{order.delivery.recipientName}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {order.delivery.address}, {order.delivery.town}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{formatPhone(order.delivery.phone)}</dd>
            </div>
            {order.delivery.neededBy && (
              <div>
                <dt>Needed by</dt>
                <dd>{formatDate(order.delivery.neededBy)}</dd>
              </div>
            )}
            {order.inMemoryOf && (
              <div>
                <dt>In memory of</dt>
                <dd>{order.inMemoryOf}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="card panel" aria-labelledby="payment-details-title">
          <h2 id="payment-details-title" className="panel__title">
            Payment
          </h2>
          <dl className="details details--single">
            <div>
              <dt>Method</dt>
              <dd>
                {paymentMethodLabel[order.payment.method]}
                {order.payment.ecocashNumber && <> · {order.payment.ecocashNumber}</>}
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatUsd(order.payment.amount)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{order.payment.reference}</dd>
            </div>
            {order.payment.paidAt && (
              <div>
                <dt>Paid</dt>
                <dd>{formatDate(order.payment.paidAt)}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <Callout tone="info" icon="phone">
        Something not right with this order?{' '}
        <Link to={`${paths.accountRequests}?new=general`}>Ask an adviser</Link> and quote {order.reference}.
      </Callout>
    </div>
  )
}
