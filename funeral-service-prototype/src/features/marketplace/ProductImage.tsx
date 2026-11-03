import type { MarketplaceItem } from './data'

type ProductImageProps = {
  item: Pick<MarketplaceItem, 'title' | 'image' | 'accent'>
  /** Decorative when the title is shown beside it (the default); pass false to give it its own alt text. */
  decorative?: boolean
  className?: string
}

/** The product's picture, or a gold glyph tile when it has none. */
export function ProductImage({ item, decorative = true, className }: ProductImageProps) {
  const classes = `product-image${className ? ` ${className}` : ''}`
  if (item.image) {
    return (
      <span className={classes}>
        <img src={item.image} alt={decorative ? '' : item.title} loading="lazy" decoding="async" />
      </span>
    )
  }
  return (
    <span className={`${classes} product-image--glyph`} aria-hidden={decorative || undefined}>
      {item.accent}
    </span>
  )
}
