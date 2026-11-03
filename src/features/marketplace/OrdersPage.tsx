import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { OrderRow } from './OrderRow'
import { useOrders } from './queries'
import './shop.css'

export default function OrdersPage() {
  const orders = useOrders()

  return (
    <div className="page-stack">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Everything you’ve ordered.</h1>
        </div>
        <Link className="btn btn--outline" to={paths.marketplace}>
          <Icon name="bag" size={18} />
          Browse the marketplace
        </Link>
      </header>

      {orders.data ? (
        orders.data.length > 0 ? (
          <ul className="order-list">
            {orders.data.map((order, index) => (
              <li key={order.id} className="reveal" style={{ '--i': index } as React.CSSProperties}>
                <OrderRow order={order} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card empty empty--large">
            <span className="icon-tile icon-tile--lg">
              <Icon name="bag" size={26} />
            </span>
            <h2 className="panel__title">No orders yet</h2>
            <p className="muted" style={{ maxWidth: '44ch' }}>
              Flowers, plaques, stationery, venue hire and more, from providers we trust. Pay with EcoCash or Paynow and follow
              each order here.
            </p>
            <Link className="btn btn--primary" to={paths.marketplace}>
              Browse the marketplace
            </Link>
          </div>
        )
      ) : orders.isPending ? (
        <div className="order-list" role="status" aria-busy="true">
          <span className="visually-hidden">Loading your orders…</span>
          <Skeleton height="6rem" className="skeleton--card" />
          <Skeleton height="6rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={orders.error} onRetry={() => void orders.refetch()} noun="your orders" />
      )}
    </div>
  )
}
