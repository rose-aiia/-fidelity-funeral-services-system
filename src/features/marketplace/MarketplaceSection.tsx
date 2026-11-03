import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { paths } from '@/config/routes'
import { ALL_CATEGORIES, type MarketplaceItem } from './data'
import { ProductCard } from './ProductCard'
import { useMarketplaceItems } from './queries'
import './marketplace.css'
import './shop.css'

export function MarketplaceSection() {
  const { data: items, isPending, error, refetch } = useMarketplaceItems()

  return (
    <Section id="marketplace">
      <SectionHead eyebrow="Marketplace" title="Browse funeral-related products and provider services." />

      {items ? (
        <MarketplaceCatalogue items={items} />
      ) : (
        <QueryState isPending={isPending} error={error} onRetry={() => void refetch()} noun="marketplace" skeleton />
      )}
    </Section>
  )
}

function MarketplaceCatalogue({ items }: { items: MarketplaceItem[] }) {
  const [filter, setFilter] = useState(ALL_CATEGORIES)

  const categories = [ALL_CATEGORIES, ...new Set(items.map((item) => item.category))]
  const visibleItems = filter === ALL_CATEGORIES ? items : items.filter((item) => item.category === filter)

  return (
    <>
      <div className="marketplace-filters" aria-label="Marketplace category filters">
        {categories.map((category) => (
          <button key={category} type="button" className="chip" onClick={() => setFilter(category)} aria-pressed={filter === category}>
            {category}
          </button>
        ))}
      </div>

      <ul className="shop-grid">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <ProductCard item={item} />
          </li>
        ))}
      </ul>

      <p className="marketplace-more">
        <Link className="btn btn--dark" to={paths.marketplace}>
          Browse the whole marketplace <Icon name="arrow-right" size={18} />
        </Link>
      </p>
    </>
  )
}
