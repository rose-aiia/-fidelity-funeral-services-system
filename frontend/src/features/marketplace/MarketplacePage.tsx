import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { ALL_CATEGORIES, type MarketplaceItem } from './data'
import { ProductCard } from './ProductCard'
import { useMarketplaceItems } from './queries'
import './shop.css'

type Sort = 'featured' | 'price-asc' | 'price-desc'

const sorters: Record<Sort, (a: MarketplaceItem, b: MarketplaceItem) => number> = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
}

export default function MarketplacePage() {
  const { data: items, isPending, error, refetch } = useMarketplaceItems()

  return (
    <main id="main-content">
      <header className="shop-hero" data-header-tone="dark" data-header-overlay>
        <div className="container shop-hero__inner">
          <p className="eyebrow">Marketplace</p>
          <h1>Everything a family needs, from providers we trust.</h1>
          <p className="shop-hero__lead">
            Flowers, memorials, stationery, venue hire and more. Choose what you need, pay with EcoCash or Paynow, and
            follow every order from your account.
          </p>
        </div>
      </header>

      <div className="container shop-body">
        {items ? (
          <Catalogue items={items} />
        ) : (
          <QueryState isPending={isPending} error={error} onRetry={() => void refetch()} noun="the marketplace" skeleton />
        )}
      </div>
    </main>
  )
}

function Catalogue({ items }: { items: MarketplaceItem[] }) {
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')

  const categories = useMemo(() => [ALL_CATEGORIES, ...new Set(items.map((item) => item.category))], [items])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items
      .filter((item) => category === ALL_CATEGORIES || item.category === category)
      .filter(
        (item) =>
          !needle ||
          [item.title, item.description, item.provider ?? '', item.category].some((text) => text.toLowerCase().includes(needle)),
      )
      .sort(sorters[sort])
  }, [items, category, query, sort])

  return (
    <>
      <div className="shop-toolbar">
        <div className="shop-filters" role="group" aria-label="Filter by category">
          {categories.map((name) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>

        <div className="shop-tools">
          <label className="shop-search">
            <Icon name="map" size={16} className="shop-search__icon" />
            <span className="visually-hidden">Search the marketplace</span>
            <input
              type="search"
              className="input"
              placeholder="Search products and providers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="shop-sort">
            <span className="visually-hidden">Sort by</span>
            <select className="select" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'product' : 'products'} shown
      </p>

      {visible.length > 0 ? (
        <ul className="shop-grid">
          {visible.map((item, index) => (
            <li key={item.id} className="reveal" style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
              <ProductCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card empty empty--large">
          <span className="icon-tile icon-tile--lg">
            <Icon name="bag" size={24} />
          </span>
          <p>
            <strong>Nothing matches that.</strong>
            <span className="muted"> Try a different word, or clear the filters.</span>
          </p>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              setCategory(ALL_CATEGORIES)
              setQuery('')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
