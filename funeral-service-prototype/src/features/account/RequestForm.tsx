import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { getErrorMessage } from '@/lib/api-error'
import {
  CONTACT_OPTIONS,
  MESSAGE_MAX_LENGTH,
  REQUEST_KINDS,
  type ContactPreference,
  type RequestKind,
} from './data'
import { useCreateRequest } from './queries'

const nextSteps = [
  'An adviser reads your request, usually within the hour.',
  'They contact you on the channel you chose.',
  'You can follow every step right here.',
]

type RequestFormProps = {
  initialKind?: RequestKind
  onClose: () => void
}

export function RequestForm({ initialKind = 'general', onClose }: RequestFormProps) {
  const [kind, setKind] = useState<RequestKind>(initialKind)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState<ContactPreference>('call')
  const [messageError, setMessageError] = useState<string>()
  const create = useCreateRequest()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (kind === 'general' && message.trim().length < 10) {
      setMessageError('Tell us a little more so we can help.')
      return
    }
    setMessageError(undefined)
    create.mutate({ kind, message: message.trim(), contactPreference: contact })
  }

  if (create.isSuccess) {
    return (
      <section className="card panel request-done" aria-live="polite">
        <span className="celebrate__mark" aria-hidden="true">
          <Icon name="check" size={28} />
        </span>
        <h2 className="panel__title">We’ve got your request</h2>
        <p>
          Your reference is <strong>{create.data.reference}</strong>. Keep it handy if you phone us.
        </p>
        <ol className="next-steps">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button type="button" className="btn btn--dark" onClick={onClose}>
          Done
        </button>
      </section>
    )
  }

  return (
    <form className="card panel request-form" onSubmit={handleSubmit} noValidate>
      <h2 className="panel__title">How can we help?</h2>

      <fieldset className="choices">
        <legend className="visually-hidden">What do you need help with?</legend>
        {REQUEST_KINDS.map((option) => (
          <label key={option.value} className="choice">
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
            />
            <span className="choice__body">
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {kind === 'bereavement' && (
        <Callout tone="info" icon="heart" role="status">
          We’re so sorry for your loss. You don’t need to write anything. An adviser will call you as soon as possible.
        </Callout>
      )}

      <div className="field">
        <label className="field__label" htmlFor="request-message">
          Message
          {kind !== 'general' && <small className="field__tag">Optional</small>}
        </label>
        <textarea
          id="request-message"
          className="textarea"
          maxLength={MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={messageError ? true : undefined}
          aria-describedby={messageError ? 'request-message-error' : undefined}
          placeholder="Anything you’d like us to know?"
        />
        <small className="field__hint">
          {message.length}/{MESSAGE_MAX_LENGTH}
        </small>
        {messageError && (
          <small id="request-message-error" className="field__error" role="alert">
            {messageError}
          </small>
        )}
      </div>

      <fieldset className="segmented">
        <legend className="field__label">Best way to reach you</legend>
        <div className="segmented__options">
          {CONTACT_OPTIONS.map((option) => (
            <label key={option.value} className="segmented__option">
              <input
                type="radio"
                name="contact"
                value={option.value}
                checked={contact === option.value}
                onChange={() => setContact(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {create.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(create.error)}
        </Callout>
      )}

      <div className="request-form__actions">
        <button type="submit" className="btn btn--primary" disabled={create.isPending}>
          {create.isPending ? 'Sending…' : 'Send request'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onClose} disabled={create.isPending}>
          Cancel
        </button>
      </div>
    </form>
  )
}
