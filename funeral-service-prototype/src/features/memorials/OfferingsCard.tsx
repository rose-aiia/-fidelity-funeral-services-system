import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Icon, type IconName } from '@/components/ui/Icon'
import { productPath } from '@/config/routes'
import { getErrorMessage } from '@/lib/api-error'
import type { Memorial, OfferingKind } from './data'
import { useOffering } from './queries'

const GARDEN_FLOWERS = 14
const GARDEN_CANDLES = 8
const BURST_MS = 1300

type Burst = { id: number; kind: OfferingKind }

const labels: Record<OfferingKind, { icon: IconName; action: string; thanks: string }> = {
  flower: { icon: 'flower', action: 'Leave a flower', thanks: 'Flower left. Thank you.' },
  candle: { icon: 'candle', action: 'Light a candle', thanks: 'Candle lit. Thank you.' },
}

/** Flower and candle buttons, with a small garden that fills as people leave them. */
export function OfferingsCard({ memorial }: { memorial: Memorial }) {
  const offering = useOffering(memorial.slug)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [announcement, setAnnouncement] = useState('')
  const nextBurst = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const leave = (kind: OfferingKind) => {
    offering.mutate(kind)
    setAnnouncement(labels[kind].thanks)

    const id = nextBurst.current++
    setBursts((current) => [...current, { id, kind }])
    timers.current.push(
      window.setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== id)), BURST_MS),
    )
  }

  const garden = [
    ...Array.from({ length: Math.min(memorial.flowers, GARDEN_FLOWERS) }, (_, index) => ({ kind: 'flower' as const, index })),
    ...Array.from({ length: Math.min(memorial.candles, GARDEN_CANDLES) }, (_, index) => ({ kind: 'candle' as const, index })),
  ]

  return (
    <section className="card offerings" aria-labelledby="offerings-title">
      <h2 id="offerings-title" className="visually-hidden">
        Leave a flower or light a candle
      </h2>

      <div className="offerings__buttons">
        {(['flower', 'candle'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className={`offering offering--${kind}`}
            onClick={() => leave(kind)}
          >
            <span className="offering__icon">
              <Icon name={labels[kind].icon} size={26} />
            </span>
            <span className="offering__text">
              <strong>{labels[kind].action}</strong>
              <span>
                {(kind === 'flower' ? memorial.flowers : memorial.candles).toLocaleString('en-US')}{' '}
                {kind === 'flower' ? 'flowers' : 'candles'}
              </span>
            </span>
            {bursts
              .filter((burst) => burst.kind === kind)
              .map((burst) => (
                <span key={burst.id} className="burst" aria-hidden="true">
                  <Icon name={labels[kind].icon} size={22} />
                </span>
              ))}
          </button>
        ))}
      </div>

      {garden.length > 0 && (
        <div className="garden" aria-hidden="true">
          {garden.map(({ kind, index }) => (
            <span
              key={`${kind}-${index}`}
              className={`garden__item garden__item--${kind}`}
              style={{ '--d': `${(index * 137) % 1400}ms` } as React.CSSProperties}
            >
              <Icon name={labels[kind].icon} size={kind === 'flower' ? 20 : 18} />
            </span>
          ))}
        </div>
      )}

      <p className="offerings__real">
        Want to do more?{' '}
        <Link to={productPath('wreath-package', memorial.name)}>Send flowers to the family</Link> or{' '}
        <Link to={productPath('granite-plaque', memorial.name)}>order a remembrance plaque</Link>.
      </p>

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>

      {offering.error && (
        <Callout tone="warning" role="alert">
          {getErrorMessage(offering.error)}
        </Callout>
      )}
    </section>
  )
}
