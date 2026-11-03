type SectionHeadProps = {
  eyebrow: string
  title: string
  align?: 'center' | 'left'
  /** Use `h1` when the heading is the page's main title (it is the only one on the page). */
  as?: 'h1' | 'h2'
}

export function SectionHead({ eyebrow, title, align = 'center', as: Heading = 'h2' }: SectionHeadProps) {
  return (
    <div className={`section-head${align === 'left' ? ' section-head--left' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <Heading>{title}</Heading>
    </div>
  )
}
