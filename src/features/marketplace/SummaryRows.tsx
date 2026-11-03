import { formatUsd } from '@/lib/format'
import { ProductImage } from './ProductImage'

export type SummaryRowData = {
  key: string
  title: string
  image?: string
  accent?: string
  optionLabels: string[]
  quantity: number
  lineTotal: number
  personalisation?: string
}

type SummaryRowsProps = {
  rows: SummaryRowData[]
  subtotal: number
  deliveryFee: number
  total: number
}

/** Line items and totals, shared by checkout (the basket) and the order page (what was bought). */
export function SummaryRows({ rows, subtotal, deliveryFee, total }: SummaryRowsProps) {
  return (
    <>
      <ul className="summary-rows">
        {rows.map((row) => (
          <li key={row.key} className="summary-row">
            <ProductImage item={{ title: row.title, image: row.image, accent: row.accent ?? '✦' }} className="summary-row__image" />
            <div className="summary-row__body">
              <strong>
                {row.title}
                {row.quantity > 1 && <span className="muted"> × {row.quantity}</span>}
              </strong>
              {row.optionLabels.length > 0 && <span className="muted">{row.optionLabels.join(' · ')}</span>}
              {row.personalisation && <span className="summary-row__note">“{row.personalisation}”</span>}
            </div>
            <span className="summary-row__price">{formatUsd(row.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatUsd(subtotal)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>{deliveryFee > 0 ? formatUsd(deliveryFee) : 'Free'}</dd>
        </div>
        <div className="totals__total">
          <dt>Total</dt>
          <dd>{formatUsd(total)}</dd>
        </div>
      </dl>
    </>
  )
}
