import type { CSSProperties, ReactNode } from 'react'

type ProgressRingProps = {
  /** 0 to 1. */
  progress: number
  /** Announced by screen readers in place of the drawing, e.g. "4 of 6 months complete". */
  label: string
  size?: number
  children?: ReactNode
}

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** A circular gauge that draws itself in on mount (CSS only; reduced-motion users get the final state). */
export function ProgressRing({ progress, label, size = 132, children }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  const style = {
    width: size,
    height: size,
    '--ring-circ': CIRCUMFERENCE,
    '--ring-offset': CIRCUMFERENCE * (1 - clamped),
  } as CSSProperties

  return (
    <div className="ring" style={style} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring__track" cx="50" cy="50" r={RADIUS} />
        <circle className="ring__value" cx="50" cy="50" r={RADIUS} strokeDasharray={CIRCUMFERENCE} />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  )
}
