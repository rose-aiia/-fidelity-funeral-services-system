import { initials } from '@/lib/format'

type AvatarProps = {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

/** Initials in a warm circle; the name is exposed to assistive tech only when it isn't shown beside it. */
export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
