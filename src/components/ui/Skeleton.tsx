import type { CSSProperties } from 'react'

type SkeletonProps = {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  /** Fully round (avatars, rings). */
  round?: boolean
  className?: string
}

/** A shimmering placeholder block. Decorative: put `aria-busy` and a status message on the container instead. */
export function Skeleton({ width = '100%', height = '1rem', round = false, className }: SkeletonProps) {
  return (
    <span
      className={`skeleton${round ? ' skeleton--round' : ''}${className ? ` ${className}` : ''}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
