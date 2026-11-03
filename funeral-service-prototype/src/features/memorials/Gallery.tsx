import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { MemorialPhoto } from './data'

/** A photo grid that opens into a full-screen viewer (native <dialog>: focus trap, Esc and backdrop for free). */
export function Gallery({ photos, name }: { photos: MemorialPhoto[]; name: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  return (
    <section className="memorial-section" aria-labelledby="gallery-title">
      <p className="eyebrow">Photographs</p>
      <h2 id="gallery-title" className="memorial-section__title">
        Moments worth keeping
      </h2>

      <ul className="gallery">
        {photos.map((photo, index) => (
          <li key={photo.id} className="reveal" style={{ '--i': index } as React.CSSProperties}>
            <button type="button" className="gallery__item" onClick={() => setOpenIndex(index)}>
              <img src={photo.url} alt={photo.caption ?? `Photograph of ${name}`} loading="lazy" />
              {photo.caption && <span className="gallery__caption">{photo.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox photos={photos} name={name} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  )
}

type LightboxProps = {
  photos: MemorialPhoto[]
  name: string
  index: number
  onChange: (index: number) => void
  onClose: () => void
}

function Lightbox({ photos, name, index, onChange, onClose }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const photo = photos[index]!
  const step = (direction: 1 | -1) => onChange((index + direction + photos.length) % photos.length)

  // Unmounting a modal dialog removes it from the top layer, so there is nothing to clean up. (Calling close()
  // here would fire a `close` event, which in StrictMode's double-run would immediately dismiss the viewer.)
  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={`Photograph ${index + 1} of ${photos.length}`}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') step(1)
        if (event.key === 'ArrowLeft') step(-1)
      }}
    >
      <figure className="lightbox__figure">
        <img src={photo.url} alt={photo.caption ?? `Photograph of ${name}`} />
        <figcaption>{photo.caption ?? `${index + 1} of ${photos.length}`}</figcaption>
      </figure>

      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close">
        <Icon name="plus" size={22} className="lightbox__x" />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous photograph">
            <Icon name="arrow-right" size={22} />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label="Next photograph">
            <Icon name="arrow-right" size={22} />
          </button>
        </>
      )}
    </dialog>
  )
}
