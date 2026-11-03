import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api-error'
import { formatDate, formatRelativeDays } from '@/lib/format'
import { TRIBUTE_MAX_LENGTH, type Tribute } from './data'
import { usePublicTributes, useSubmitTribute } from './queries'
import { hasErrors, validateTribute, type FieldErrors } from './validation'

const RECENT_DAYS = 30

const tributeDate = (iso: string) =>
  Date.now() - new Date(iso).getTime() < RECENT_DAYS * 86_400_000 ? formatRelativeDays(iso) : formatDate(iso)

export function TributeWall({ slug, name }: { slug: string; name: string }) {
  const tributes = usePublicTributes(slug)

  return (
    <section className="memorial-section" id="tributes" aria-labelledby="tributes-title">
      <p className="eyebrow">Tributes</p>
      <h2 id="tributes-title" className="memorial-section__title">
        Words for {name.split(' ')[0]}
      </h2>

      <div className="tributes">
        <TributeForm slug={slug} name={name} />

        <div className="tributes__list">
          {tributes.data ? (
            tributes.data.length > 0 ? (
              <ul className="stack">
                {tributes.data.map((tribute, index) => (
                  <li key={tribute.id} className="reveal" style={{ '--i': Math.min(index, 6) } as React.CSSProperties}>
                    <TributeCard tribute={tribute} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card empty">
                <span className="icon-tile icon-tile--lg">
                  <Icon name="heart" size={24} />
                </span>
                <p>
                  <strong>Be the first to write.</strong>
                  <span className="muted"> A few kind words mean a great deal to a grieving family.</span>
                </p>
              </div>
            )
          ) : (
            <QueryState
              isPending={tributes.isPending}
              error={tributes.error}
              onRetry={() => void tributes.refetch()}
              noun="tributes"
              skeleton
            />
          )}
        </div>
      </div>
    </section>
  )
}

function TributeCard({ tribute }: { tribute: Tribute }) {
  return (
    <figure className="tribute">
      <blockquote>{tribute.message}</blockquote>
      <figcaption>
        <strong>{tribute.authorName}</strong>
        {tribute.relationship && <span className="muted">, {tribute.relationship}</span>}
        <span className="tribute__date">{tributeDate(tribute.createdAt)}</span>
      </figcaption>
    </figure>
  )
}

function TributeForm({ slug, name }: { slug: string; name: string }) {
  const [authorName, setAuthorName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FieldErrors<'authorName' | 'relationship' | 'message'>>({})
  const submit = useSubmitTribute(slug)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateTribute({ authorName, relationship, message })
    setErrors(found)
    if (hasErrors(found)) return
    submit.mutate(
      { authorName: authorName.trim(), relationship: relationship.trim() || undefined, message: message.trim() },
      {
        onSuccess: () => {
          setMessage('')
        },
      },
    )
  }

  if (submit.isSuccess) {
    const approved = submit.data.status === 'approved'
    return (
      <div className="card tribute-form tribute-form--done" role="status">
        <span className="celebrate__mark" aria-hidden="true">
          <Icon name="heart" size={26} />
        </span>
        <h3>Thank you</h3>
        <p>
          {approved
            ? 'Your tribute is now part of the wall.'
            : `Your words have been sent to ${name.split(' ')[0]}’s family. They’ll appear once the family has read and approved them.`}
        </p>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => submit.reset()}>
          Write another
        </button>
      </div>
    )
  }

  return (
    <form className="card tribute-form stack" onSubmit={handleSubmit} noValidate>
      <h3>Share a tribute</h3>
      <TextField
        label="Your name"
        autoComplete="name"
        value={authorName}
        onChange={setAuthorName}
        error={errors.authorName}
      />
      <TextField
        label="Your relationship"
        tag="Optional"
        placeholder="Friend, neighbour, colleague…"
        value={relationship}
        onChange={setRelationship}
        error={errors.relationship}
      />
      <div className="field">
        <label className="field__label" htmlFor="tribute-message">
          Your message
        </label>
        <textarea
          id="tribute-message"
          className="textarea"
          maxLength={TRIBUTE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'tribute-message-error' : undefined}
          placeholder="A memory, a thank you, a few kind words…"
        />
        <small className="field__hint">
          {message.length}/{TRIBUTE_MAX_LENGTH}
        </small>
        {errors.message && (
          <small id="tribute-message-error" className="field__error" role="alert">
            {errors.message}
          </small>
        )}
      </div>

      {submit.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(submit.error)}
        </Callout>
      )}

      <button type="submit" className="btn btn--primary" disabled={submit.isPending}>
        {submit.isPending ? 'Sending…' : 'Send tribute'}
      </button>
      <p className="tribute-form__note">The family reads every tribute before it is shown.</p>
    </form>
  )
}
