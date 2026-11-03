import type { ReactNode } from 'react'

type SectionProps = {
  id?: string
  soft?: boolean
  containerClassName?: string
  children: ReactNode
}

export function Section({ id, soft = false, containerClassName, children }: SectionProps) {
  return (
    <section className={`section${soft ? ' section--soft' : ''}`} id={id}>
      <div className={containerClassName ? `container ${containerClassName}` : 'container'}>{children}</div>
    </section>
  )
}
