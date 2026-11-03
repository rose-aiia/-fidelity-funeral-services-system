import { useState } from 'react'
import { QueryState } from '@/components/ui/QueryState'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { formatUsd } from '@/lib/format'
import { ALL_CATEGORIES, type MarketplaceItem } from './data'
import { useMarketplaceItems } from './queries'
import './marketplace.css'

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
          <button
            key={category}
            type="button"
            className="chip"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="marketplace-grid">
        {visibleItems.map((item) => (
          <article key={item.id} className="card card--interactive stack marketplace-card">
            <div className="marketplace-card__top">
              <span className="marketplace-card__badge">{item.category}</span>
              <span className="marketplace-card__price">{formatUsd(item.price)}</span>
            </div>
            <div className="icon-tile icon-tile--lg" aria-hidden="true">
              {item.accent}
            </div>
            <div className="marketplace-card__body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
            <div className="marketplace-card__footer">
              <span>Request quote</span>
              <button type="button" className="btn btn--outline btn--sm">
                Enquire
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
