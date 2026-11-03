import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Sheet } from '@/components/ui/Sheet'
import { StatusChip } from '@/components/ui/StatusChip'
import { orderStatusDisplay, paymentMethodLabel } from '@/features/marketplace/status'
import { getErrorMessage } from '@/lib/api-error'
import { formatDate, formatServiceTime, formatUsd } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { AdminOrder } from './data'
import { orderActionLabel, usePortalRole } from './portal-ui'
import { useUpdateOrderStatus } from './queries'
import './portal.css'

type OrderSheetProps = {
  /** The order to show; `undefined` closes the sheet. */
  order: AdminOrder | undefined
  onClose: () => void
}

export function OrderSheet({ order, onClose }: OrderSheetProps) {
  return (
    <Sheet open={Boolean(order)} onClose={onClose} eyebrow="Order" title={order?.reference ?? 'Order'}>
      {order && <OrderBody order={order} />}
    </Sheet>
  )
}

function OrderBody({ order }: { order: AdminOrder }) {
  const role = usePortalRole()
  const update = useUpdateOrderStatus()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const status = orderStatusDisplay[order.status]
  const forward = order.actions.filter((action) => action !== 'cancelled')
  const canCancel = order.actions.includes('cancelled')

  return (
    <>
      <div className="sheet-actions">
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        {order.scoped && <span className="muted">Showing your part of this order</span>}
      </div>

      {order.shared && (
        <Callout tone="info">
          {role === 'admin'
            ? 'This order includes more than one provider, so you coordinate it. Move it along when every provider is ready.'
            : 'This order includes other providers too, so our team coordinates it. You’ll see it here for reference.'}
        </Callout>
      )}

      {update.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(update.error)}
        </Callout>
      )}

      {(forward.length > 0 || canCancel) && (
        <section className="sheet-section" aria-labelledby="next-title">
          <h3 id="next-title">Next step</h3>
          <div className="sheet-actions">
            {forward.map((action) => (
              <button key={action} type="button" className="btn btn--primary btn--sm" disabled={update.isPending} onClick={() => update.mutate({ id: order.id, status: action })}>
                {orderActionLabel[action]}
              </button>
            ))}
            {canCancel && !confirmingCancel && (
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmingCancel(true)}>
                {orderActionLabel.cancelled}
              </button>
            )}
          </div>
          {confirmingCancel && (
            <Callout tone="warning" role="alert">
              Cancel {order.reference}? The customer is told, and any refund is arranged separately.
              <div className="sheet-actions" style={{ marginTop: 'var(--space-3)' }}>
                <button type="button" className="btn btn--deep btn--sm" disabled={update.isPending} onClick={() => update.mutate({ id: order.id, status: 'cancelled' }, { onSuccess: () => setConfirmingCancel(false) })}>
                  Yes, cancel it
                </button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmingCancel(false)}>
                  Keep it
                </button>
              </div>
            </Callout>
          )}
        </section>
      )}

      <section className="sheet-section" aria-labelledby="lines-title">
        <h3 id="lines-title">Items</h3>
        <ul className="mini-list">
          {order.lines.map((line, index) => (
            <li key={`${line.itemId}-${index}`}>
              <span>
                <strong>
                  {line.title}
                  {line.quantity > 1 && ` × ${line.quantity}`}
                </strong>
                {line.optionLabels.length > 0 && <small>{line.optionLabels.join(' · ')}</small>}
                {line.personalisation && <small>“{line.personalisation}”</small>}
                {role === 'admin' && line.provider && <small>by {line.provider}</small>}
              </span>
              <span>{formatUsd(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="kv">
          <div>
            <dt>{order.scoped ? 'Your share' : 'Total'}</dt>
            <dd>{formatUsd(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="sheet-section" aria-labelledby="delivery-title">
        <h3 id="delivery-title">Delivery</h3>
        <dl className="kv">
          <div>
            <dt>For</dt>
            <dd>{order.delivery.recipientName}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{formatPhone(order.delivery.phone)}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>
              {order.delivery.address}, {order.delivery.town}
            </dd>
          </div>
          {order.delivery.neededBy && (
            <div>
              <dt>Needed by</dt>
              <dd>{formatDate(order.delivery.neededBy)}</dd>
            </div>
          )}
          {order.delivery.note && (
            <div>
              <dt>Note</dt>
              <dd>{order.delivery.note}</dd>
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

      {role === 'admin' && (
        <section className="sheet-section" aria-labelledby="customer-title">
          <h3 id="customer-title">Customer and payment</h3>
          <dl className="kv">
            <div>
              <dt>Customer</dt>
              <dd>{order.customer.name}</dd>
            </div>
            <div>
              <dt>Paid with</dt>
              <dd>
                {paymentMethodLabel[order.payment.method]} · {order.payment.status}
              </dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{order.payment.reference}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="sheet-section" aria-labelledby="history-title">
        <h3 id="history-title">History</h3>
        <ul className="mini-list">
          {[...order.events].reverse().map((event) => (
            <li key={`${event.at}-${event.label}`}>
              <span>{event.label}</span>
              <small>{formatServiceTime(event.at)}</small>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
