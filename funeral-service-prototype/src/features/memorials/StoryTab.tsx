import { useEffect, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/api-error'
import { BIOGRAPHY_MAX_LENGTH, MAX_TIMELINE_ENTRIES, type OwnedMemorial } from './data'
import { useUpdateMemorial } from './queries'
import { validateBiography, validateTimeline } from './validation'

const TOAST_DURATION_MS = 2800
const THIS_YEAR = new Date().getFullYear()

type Row = { id: string; year: string; title: string; text: string }

let rowCounter = 0
const newRowId = () => `t-${Date.now().toString(36)}-${rowCounter++}`

export function StoryTab({ memorial }: { memorial: OwnedMemorial }) {
  const update = useUpdateMemorial(memorial.id)
  const [biography, setBiography] = useState(memorial.biography)
  const [rows, setRows] = useState<Row[]>(
    memorial.timeline.map((entry) => ({ id: entry.id, year: String(entry.year), title: entry.title, text: entry.text ?? '' })),
  )
  const [errors, setErrors] = useState<{ biography?: string; timeline?: string }>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [saved])

  const patchRow = (id: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  const addRow = () =>
    setRows((current) => [...current, { id: newRowId(), year: String(THIS_YEAR), title: '', text: '' }])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const timeline = rows.map((row) => ({
      id: row.id,
      year: Number(row.year),
      title: row.title.trim(),
      ...(row.text.trim() && { text: row.text.trim() }),
    }))
    const found = { biography: validateBiography(biography), timeline: validateTimeline(timeline) }
    setErrors(found)
    if (found.biography || found.timeline) return
    update.mutate({ biography, timeline }, { onSuccess: () => setSaved(true) })
  }

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <section className="card panel studio-form stack" aria-labelledby="story-editor-title">
        <h2 id="story-editor-title" className="panel__title">
          Their story
        </h2>
        <div className="field">
          <label className="field__label" htmlFor="biography">
            Life story
          </label>
          <textarea
            id="biography"
            className="textarea textarea--tall"
            maxLength={BIOGRAPHY_MAX_LENGTH}
            value={biography}
            onChange={(event) => setBiography(event.target.value)}
            aria-invalid={errors.biography ? true : undefined}
            placeholder="Where they grew up, what they loved, what they were known for, and the people they leave behind."
          />
          <small className="field__hint">
            Leave a blank line between paragraphs. {biography.length}/{BIOGRAPHY_MAX_LENGTH}
          </small>
          {errors.biography && (
            <small className="field__error" role="alert">
              {errors.biography}
            </small>
          )}
        </div>
      </section>

      <section className="card panel studio-form stack" aria-labelledby="timeline-editor-title">
        <div className="panel__head">
          <h2 id="timeline-editor-title" className="panel__title">
            Timeline
          </h2>
          <button type="button" className="btn btn--outline btn--sm" onClick={addRow} disabled={rows.length >= MAX_TIMELINE_ENTRIES}>
            <Icon name="plus" size={16} />
            Add a moment
          </button>
        </div>

        {rows.length === 0 && <p className="muted">Add the moments that shaped their life: a birth, a graduation, a wedding, a move.</p>}

        <ul className="timeline-editor">
          {rows.map((row, index) => (
            <li key={row.id} className="timeline-editor__row">
              <div className="field timeline-editor__year">
                <label className="field__label" htmlFor={`year-${row.id}`}>
                  Year
                </label>
                <input
                  id={`year-${row.id}`}
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={THIS_YEAR}
                  value={row.year}
                  onChange={(event) => patchRow(row.id, { year: event.target.value })}
                />
              </div>
              <div className="field timeline-editor__title">
                <label className="field__label" htmlFor={`title-${row.id}`}>
                  Moment {index + 1}
                </label>
                <input
                  id={`title-${row.id}`}
                  className="input"
                  maxLength={80}
                  value={row.title}
                  onChange={(event) => patchRow(row.id, { title: event.target.value })}
                  placeholder="Married Joseph Nyathi"
                />
              </div>
              <div className="field timeline-editor__text">
                <label className="field__label" htmlFor={`text-${row.id}`}>
                  Detail <small className="field__tag">Optional</small>
                </label>
                <input
                  id={`text-${row.id}`}
                  className="input"
                  maxLength={300}
                  value={row.text}
                  onChange={(event) => patchRow(row.id, { text: event.target.value })}
                />
              </div>
              <button
                type="button"
                className="btn btn--outline btn--sm timeline-editor__remove"
                onClick={() => setRows((current) => current.filter((candidate) => candidate.id !== row.id))}
                aria-label={`Remove moment ${index + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        {errors.timeline && (
          <Callout tone="danger" role="alert">
            {errors.timeline}
          </Callout>
        )}
      </section>

      {update.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(update.error)}
        </Callout>
      )}

      <div className="studio-form__actions">
        <button type="submit" className="btn btn--primary" disabled={update.isPending}>
          <Icon name="check" size={18} />
          {update.isPending ? 'Saving…' : 'Save story'}
        </button>
      </div>

      {saved && <Toast>Story saved.</Toast>}
    </form>
  )
}
