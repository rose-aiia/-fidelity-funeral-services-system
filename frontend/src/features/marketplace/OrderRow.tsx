import { Link } from 'react-router-dom'
import { StatusChip } from '@/components/ui/StatusChip'
import { orderPath } from '@/config/routes'
import { formatDate, formatUsd } from '@/lib/format'
import type { Order } from './data'
import { ProductImage } from './ProductImage'
import { orderStatusDisplay } from './status'
import './shop.css'

/** `bare` drops the card chrome, for use inside a panel that already is one. */
export function OrderRow({ order, bare = false }: { order: Order; bare?: boolean }) {
  const status = orderStatusDisplay[order.status]
  const first = order.lines[0]
  const more = order.lines.length - 1

  return (
    <Link className={bare ? 'order-row order-row--bare' : 'card order-row'} to={orderPath(order.id)}>
      {first && <ProductImage item={{ title: first.title, image: first.image, accent: '✦' }} className="order-row__image" />}
      <div className="order-row__main">
        <strong>
          {first?.title}
          {more > 0 && <span className="muted"> + {more} more</span>}
        </strong>
        <span className="muted">
          {order.reference} · {formatDate(order.createdAt)}
        </span>
      </div>
      <div className="order-row__side">
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        <span className="order-row__total">{formatUsd(order.total)}</span>
      </div>
    </Link>
  )
}
