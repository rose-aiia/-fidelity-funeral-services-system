import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { paths } from '@/config/routes'
import { site } from '@/config/site'
import { formatUsd } from '@/lib/format'
import { cart } from './cart'
import type { MarketplaceItem } from './data'
import { resolveOptions, unitPrice } from './pricing'
import { ProductCard } from './ProductCard'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'
import { useMarketplaceItem, useMarketplaceItems } from './queries'
import { suggestPersonalisation } from './status'
import './shop.css'

export default function ProductPage() {
  const { id } = useParams()
  const { item, isPending, error, refetch } = useMarketplaceItem(id)

  useEffect(() => {
    if (item) document.title = `${item.title} | Marketplace | ${site.footerName}`
  }, [item])

  if (item) return <ProductView key={item.id} item={item} />

  if (!isPending && !error) {
    return (
      <main className="container status-page" id="main-content">
        <p className="eyebrow">Marketplace</p>
        <h1>We couldn’t find that product</h1>
        <p className="muted">It may have been removed, or the link may be mistyped.</p>
        <Link className="btn btn--primary" to={paths.marketplace}>
          Back to the marketplace
        </Link>
      </main>
    )
  }

  return (
    <main className="container shop-body" id="main-content">
      {isPending ? (
        <div className="product-layout" role="status" aria-busy="true">
          <span className="visually-hidden">Loading the product…</span>
          <Skeleton height="26rem" className="skeleton--card" />
          <div className="stack">
            <Skeleton width="60%" height="2.4rem" />
            <Skeleton height="8rem" />
          </div>
        </div>
      ) : (
        <QueryState isPending={false} error={error} onRetry={() => void refetch()} noun="the product" />
      )}
    </main>
  )
}

function ProductView({ item }: { item: MarketplaceItem }) {
  const [params] = useSearchParams()
  const inMemoryOf = params.get('inMemoryOf')?.slice(0, 80) || undefined

  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [text, setText] = useState(() => suggestPersonalisation(item.id, inMemoryOf ?? null))
  const [quantity, setQuantity] = useState(1)
  const [touched, setTouched] = useState(false)

  const resolved = resolveOptions(item, chosen)
  const price = resolved ? unitPrice(item, resolved) : item.price
  const personalisation = item.personalisation
  const textMissing = Boolean(personalisation?.required && !text.trim())
  const isService = item.fulfilment === 'service'

  const add = () => {
    setTouched(true)
    if (textMissing || !resolved) return
    cart.add(
      { itemId: item.id, options: resolved.selected, quantity, ...(text.trim() && { personalisation: text.trim() }) },
      inMemoryOf,
    )
  }

  return (
    <main id="main-content">
      <div className="container shop-body">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to={paths.marketplace}>Marketplace</Link>
          <Icon name="arrow-right" size={14} />
          <span aria-current="page">{item.title}</span>
        </nav>

        <div className="product-layout">
          <div className="product-gallery reveal">
            <ProductImage item={item} decorative={false} className="product-image--hero" />
          </div>

          <div className="product-info reveal" style={{ '--i': 1 } as React.CSSProperties}>
            <p className="eyebrow">{item.category}</p>
            <h1>{item.title}</h1>
            <p className="product-meta">
              {item.provider && (
                <span>
                  <Icon name="shield" size={16} /> {item.provider}
                </span>
              )}
              {item.leadTime && (
                <span>
                  <Icon name="clock" size={16} /> {item.leadTime}
                </span>
              )}
            </p>

            <p className="product-price" aria-live="polite">
              {formatUsd(price * quantity)}
              {quantity > 1 && <small> ({formatUsd(price)} each)</small>}
            </p>

            <p className="product-desc">{item.details ?? item.description}</p>

            {item.options?.map((group) => (
              <fieldset key={group.id} className="option-group">
                <legend>{group.label}</legend>
                <div className="option-group__choices">
                  {group.choices.map((choice) => {
                    const selected = (chosen[group.id] ?? group.choices[0]?.id) === choice.id
                    return (
                      <label key={choice.id} className={`option${selected ? ' is-selected' : ''}`}>
                        <input
                          type="radio"
                          name={group.id}
                          value={choice.id}
                          checked={selected}
                          onChange={() => setChosen((current) => ({ ...current, [group.id]: choice.id }))}
                        />
                        <span className="option__label">{choice.label}</span>
                        {choice.priceDelta !== 0 && (
                          <span className="option__delta">
                            {choice.priceDelta > 0 ? '+' : '−'}
                            {formatUsd(Math.abs(choice.priceDelta))}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            {personalisation && (
              <div className="field">
                <label className="field__label" htmlFor="personalisation">
                  {personalisation.label}
                  {!personalisation.required && <small className="field__tag">Optional</small>}
                </label>
                <textarea
                  id="personalisation"
                  className="textarea"
                  rows={3}
                  maxLength={personalisation.maxLength}
                  placeholder={personalisation.placeholder}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  aria-invalid={touched && textMissing ? true : undefined}
                  aria-describedby="personalisation-hint"
                />
                <small id="personalisation-hint" className={touched && textMissing ? 'field__error' : 'field__hint'} role={touched && textMissing ? 'alert' : undefined}>
                  {touched && textMissing
                    ? `${personalisation.label} is needed so the provider knows what to ${item.id === 'granite-plaque' ? 'engrave' : 'print'}.`
                    : `${text.length}/${personalisation.maxLength}`}
                </small>
              </div>
            )}

            <div className="product-buy">
              <QuantityStepper value={quantity} onChange={setQuantity} label={item.title} />
              <button type="button" className="btn btn--primary btn--lg product-buy__add" onClick={add}>
                <Icon name="bag" size={20} />
                Add to basket
              </button>
            </div>

            <ul className="product-assurances">
              <li>
                <Icon name="lock" size={16} /> Pay securely with EcoCash or Paynow
              </li>
              <li>
                <Icon name={isService ? 'phone' : 'home'} size={16} />
                {isService ? 'The provider contacts you to confirm the details' : 'Delivered by the provider, with updates in your account'}
              </li>
            </ul>

            {item.includes && item.includes.length > 0 && (
              <section className="product-includes" aria-labelledby="includes-title">
                <h2 id="includes-title">What’s included</h2>
                <ul className="check-list">
                  {item.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <Related current={item} />
      </div>
    </main>
  )
}

function Related({ current }: { current: MarketplaceItem }) {
  const { data } = useMarketplaceItems()
  const others = data?.filter((item) => item.id !== current.id).slice(0, 3) ?? []
  if (others.length === 0) return null

  return (
    <section className="related" aria-labelledby="related-title">
      <h2 id="related-title">Others families choose</h2>
      <ul className="shop-grid shop-grid--compact">
        {others.map((item) => (
          <li key={item.id}>
            <ProductCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
