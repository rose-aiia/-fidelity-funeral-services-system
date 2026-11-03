import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { OrderRow } from './OrderRow'
import { useOrders } from './queries'
import './shop.css'

/** The dashboard's window onto orders: the latest, or an invitation to the marketplace. */
export function OrdersSummaryCard() {
  const { data, isPending } = useOrders()

  if (isPending) return <Skeleton height="8rem" className="skeleton--card" />
  // A failed fetch shouldn't clutter the dashboard; the Orders page shows the error with a retry.
  if (!data) return null

  if (data.length === 0) {
    return (
      <Link className="soon__tile" to={paths.marketplace}>
        <span className="soon__icon">
          <Icon name="bag" size={22} />
        </span>
        <span>
          <strong>Visit the marketplace</strong>
          <span>Flowers, plaques, stationery and more.</span>
        </span>
        <Icon name="arrow-right" size={18} />
      </Link>
    )
  }

  return (
    <section className="card panel" aria-labelledby="orders-summary-title">
      <div className="panel__head">
        <h2 id="orders-summary-title" className="panel__title">
          Orders
        </h2>
        <Link className="link-arrow" to={paths.accountOrders}>
          View all <Icon name="arrow-right" size={16} />
        </Link>
      </div>
      <OrderRow order={data[0]!} />
    </section>
  )
}
