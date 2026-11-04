import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Position in a group: later items arrive a beat after earlier ones. */
  index?: number
}

/**
 * Fades and lifts its content into place once, the first time it scrolls into view. Anything already in view
 * shows straight away, and so does everything for people who have asked for reduced motion.
 */
export function Reveal({ children, as: Tag = 'div', className, index = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const show = () => element.classList.add('is-visible')

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      show()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show()
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal-on-scroll${className ? ` ${className}` : ''}`} style={{ '--i': Math.min(index, 8) } as CSSProperties}>
      {children}
    </Tag>
  )
}
