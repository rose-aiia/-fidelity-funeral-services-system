import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { productPath } from '@/config/routes'
import { formatUsd } from '@/lib/format'
import type { MarketplaceItem } from './data'
import { ProductImage } from './ProductImage'

export function ProductCard({ item }: { item: MarketplaceItem }) {
  const hasChoices = Boolean(item.options?.length)

  return (
    <article className="card product-card">
      <Link className="product-card__link" to={productPath(item.id)} aria-label={`${item.title}, from ${formatUsd(item.price)}`}>
        <div className="product-card__media">
          <ProductImage item={item} />
          <span className="product-card__badge">{item.category}</span>
        </div>
        <div className="product-card__body">
          <h3>{item.title}</h3>
          {item.provider && <p className="product-card__provider">by {item.provider}</p>}
          <p className="product-card__desc">{item.description}</p>
        </div>
        <div className="product-card__footer">
          <span className="product-card__price">
            {hasChoices && <small>From </small>}
            {formatUsd(item.price)}
          </span>
          <span className="product-card__cta">
            View <Icon name="arrow-right" size={16} />
          </span>
        </div>
      </Link>
    </article>
  )
}
