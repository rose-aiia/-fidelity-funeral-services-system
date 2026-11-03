import { useRef, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { getErrorMessage } from '@/lib/api-error'
import { MAX_PHOTOS, type MemorialPhoto, type OwnedMemorial } from './data'
import { isAcceptedImage, photoToDataUrl } from './image'
import { useAddPhoto, useCaptionPhoto, useRemovePhoto, useUpdateMemorial } from './queries'

export function PhotosTab({ memorial }: { memorial: OwnedMemorial }) {
  const add = useAddPhoto(memorial.id, memorial.slug)
  const remove = useRemovePhoto(memorial.id, memorial.slug)
  const update = useUpdateMemorial(memorial.id)
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const slotsLeft = MAX_PHOTOS - memorial.photos.length

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setProblem(null)

    const chosen = Array.from(files).slice(0, slotsLeft)
    if (files.length > slotsLeft) setProblem(`Only ${slotsLeft} more photo${slotsLeft === 1 ? '' : 's'} fit. The rest were skipped.`)

    for (const [index, file] of chosen.entries()) {
      if (!isAcceptedImage(file)) {
        setProblem('Only JPEG, PNG or WebP photographs can be added.')
        continue
      }
      setProgress(`Adding photo ${index + 1} of ${chosen.length}…`)
      try {
        await add.mutateAsync({ dataUrl: await photoToDataUrl(file) })
      } catch (error) {
        setProblem(getErrorMessage(error))
        break
      }
    }
    setProgress(null)
    if (input.current) input.current.value = ''
  }

  return (
    <div className="stack">
      <section className="card panel stack" aria-labelledby="photos-title">
        <div className="panel__head">
          <div>
            <h2 id="photos-title" className="panel__title">
              Photographs
            </h2>
            <p className="muted">
              {memorial.photos.length} of {MAX_PHOTOS} added. They’re resized on your device, so even large photos
              upload quickly.
            </p>
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => input.current?.click()} disabled={slotsLeft === 0 || progress !== null}>
            <Icon name="plus" size={16} />
            Add photos
          </button>
        </div>

        <input
          ref={input}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          aria-label="Choose photographs to add"
          tabIndex={-1}
        />

        <div aria-live="polite">
          {progress && <p className="muted">{progress}</p>}
          {problem && (
            <Callout tone="warning" role="alert">
              {problem}
            </Callout>
          )}
          {(remove.error || update.error) && (
            <Callout tone="danger" role="alert">
              {getErrorMessage(remove.error ?? update.error)}
            </Callout>
          )}
        </div>

        {memorial.photos.length === 0 ? (
          <div className="empty empty--large">
            <span className="icon-tile icon-tile--lg">
              <Icon name="heart" size={24} />
            </span>
            <p className="muted">
              Choose a favourite photograph to use as their portrait, then add a few more moments from their life.
            </p>
          </div>
        ) : (
          <ul className="photo-grid">
            {memorial.photos.map((photo) => (
              <li key={photo.id}>
                <PhotoCard
                  photo={photo}
                  memorialId={memorial.id}
                  slug={memorial.slug}
                  isPortrait={memorial.portraitId === photo.id}
                  onMakePortrait={() => update.mutate({ portraitId: photo.id })}
                  onRemove={() => remove.mutate(photo.id)}
                  busy={remove.isPending || update.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type PhotoCardProps = {
  photo: MemorialPhoto
  memorialId: string
  slug: string
  isPortrait: boolean
  onMakePortrait: () => void
  onRemove: () => void
  busy: boolean
}

function PhotoCard({ photo, memorialId, slug, isPortrait, onMakePortrait, onRemove, busy }: PhotoCardProps) {
  const caption = useCaptionPhoto(memorialId, slug)
  const [text, setText] = useState(photo.caption ?? '')

  const saveCaption = () => {
    if (text.trim() !== (photo.caption ?? '')) caption.mutate({ photoId: photo.id, caption: text })
  }

  return (
    <figure className="photo-card">
      <div className="photo-card__frame">
        <img src={photo.url} alt={photo.caption ?? 'Memorial photograph'} />
        {isPortrait && <span className="photo-card__badge">Portrait</span>}
      </div>
      <label className="visually-hidden" htmlFor={`caption-${photo.id}`}>
        Caption
      </label>
      <input
        id={`caption-${photo.id}`}
        className="input"
        placeholder="Add a caption"
        maxLength={140}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={saveCaption}
      />
      <div className="photo-card__actions">
        <button type="button" className="btn btn--outline btn--sm" onClick={onMakePortrait} disabled={isPortrait || busy}>
          {isPortrait ? 'Current portrait' : 'Make portrait'}
        </button>
        <button type="button" className="btn btn--outline btn--sm" onClick={onRemove} disabled={busy} aria-label="Remove this photograph">
          Remove
        </button>
      </div>
    </figure>
  )
}
