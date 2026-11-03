type SectionHeadProps = {
  eyebrow: string
  title: string
  align?: 'center' | 'left'
}

export function SectionHead({ eyebrow, title, align = 'center' }: SectionHeadProps) {
  return (
    <div className={`section-head${align === 'left' ? ' section-head--left' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  )
}
