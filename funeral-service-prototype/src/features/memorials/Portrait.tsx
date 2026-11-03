import { initials } from '@/lib/format'
import type { Memorial } from './data'

type PortraitProps = {
  memorial: Pick<Memorial, 'name' | 'photos' | 'portraitId'>
  size?: 'sm' | 'md' | 'lg'
}

/** The chosen portrait inside a gold ring, or the person's initials when there isn't one yet. */
export function Portrait({ memorial, size = 'md' }: PortraitProps) {
  const photo = memorial.photos.find((candidate) => candidate.id === memorial.portraitId)

  return (
    <span className={`portrait portrait--${size}`}>
      {photo ? (
        <img src={photo.url} alt={`Portrait of ${memorial.name}`} />
      ) : (
        <span className="portrait__monogram" aria-hidden="true">
          {initials(memorial.name)}
        </span>
      )}
    </span>
  )
}
