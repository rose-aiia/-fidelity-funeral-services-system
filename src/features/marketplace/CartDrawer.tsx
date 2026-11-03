import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { paths } from '@/config/routes'
import { formatUsd } from '@/lib/format'
import { cart, useCartLines, useCartOpen } from './cart'
import type { SummaryLine } from './cart-logic'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'
import { useCartSummary } from './useCart'
import './shop.css'

/** The header's basket button, with a count badge. */
export function CartButton() {
  const { length } = useCartLines()
  const summary = useCartSummary()
  const count = summary.count || length

  return (
    <button type="button" className="cart-button" onClick={cart.open} aria-label={`Open basket, ${count} ${count === 1 ? 'item' : 'items'}`}>
      <Icon name="bag" size={20} />
      {count > 0 && <span className="cart-button__count">{count}</span>}
    </button>
  )
}

/** A slide-in basket on a native <dialog>: focus is trapped, Esc and the backdrop close it. Mounted once, in the app. */
export function CartDrawer() {
  const isOpen = useCartOpen()
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const summary = useCartSummary()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (isOpen && !element.open) element.showModal()
    if (!isOpen && element.open) element.close()
  }, [isOpen])

  const checkout = () => {
    cart.close()
    navigate(paths.checkout)
  }

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={cart.close}
      onClick={(event) => event.target === dialog.current && cart.close()}
    >
      <div className="drawer__panel">
        <header className="drawer__head">
          <h2 id="drawer-title">Your basket {summary.count > 0 && <span className="muted">({summary.count})</span>}</h2>
          <button type="button" className="drawer__close" onClick={cart.close} aria-label="Close basket">
            <Icon name="plus" size={20} className="drawer__x" />
          </button>
        </header>

        {summary.lines.length === 0 && summary.unavailable.length === 0 ? (
          <div className="drawer__empty">
            <span className="icon-tile icon-tile--lg">
              <Icon name="bag" size={24} />
            </span>
            <p>
              <strong>Your basket is empty.</strong>
              <span className="muted"> Flowers, plaques, stationery and more are a tap away.</span>
            </p>
            <Link className="btn btn--primary" to={paths.marketplace} onClick={cart.close}>
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__lines">
              {summary.lines.map((entry) => (
                <li key={entry.line.id}>
                  <CartLineRow entry={entry} />
                </li>
              ))}
            </ul>

            {summary.unavailable.length > 0 && (
              <Callout tone="warning" role="alert">
                {summary.unavailable.length === 1 ? 'One item in your basket is' : `${summary.unavailable.length} items in your basket are`} no
                longer available.{' '}
                <button type="button" className="link-button" onClick={() => summary.unavailable.forEach((line) => cart.remove(line.id))}>
                  Remove {summary.unavailable.length === 1 ? 'it' : 'them'}
                </button>
              </Callout>
            )}

            <footer className="drawer__foot">
              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatUsd(summary.subtotal)}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>{summary.deliveryFee > 0 ? formatUsd(summary.deliveryFee) : 'Free'}</dd>
                </div>
                <div className="totals__total">
                  <dt>Total</dt>
                  <dd>{formatUsd(summary.total)}</dd>
                </div>
              </dl>
              <button type="button" className="btn btn--primary btn--lg w-full" onClick={checkout} disabled={summary.lines.length === 0}>
                Checkout <Icon name="arrow-right" size={18} />
              </button>
              <button type="button" className="link-button drawer__keep" onClick={cart.close}>
                Keep browsing
              </button>
            </footer>
          </>
        )}
      </div>
    </dialog>
  )
}

function CartLineRow({ entry }: { entry: SummaryLine }) {
  const { line, item } = entry

  return (
    <div className="cart-line">
      <ProductImage item={item} className="cart-line__image" />
      <div className="cart-line__body">
        <strong>{item.title}</strong>
        {entry.optionLabels.length > 0 && <span className="muted">{entry.optionLabels.join(' · ')}</span>}
        {line.personalisation && <span className="cart-line__note">“{line.personalisation.slice(0, 60)}{line.personalisation.length > 60 ? '…' : ''}”</span>}
        <div className="cart-line__controls">
          <QuantityStepper value={line.quantity} onChange={(next) => cart.setQuantity(line.id, next)} label={item.title} allowZero />
          <button type="button" className="link-button" onClick={() => cart.remove(line.id)}>
            Remove
          </button>
        </div>
      </div>
      <span className="cart-line__price">{formatUsd(entry.lineTotal)}</span>
    </div>
  )
}
