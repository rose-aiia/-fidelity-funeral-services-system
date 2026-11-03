import { useId, type InputHTMLAttributes } from 'react'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'id'> & {
  label: string
  value: string
  onChange: (value: string) => void
  /** Validation message; also marks the input invalid for assistive tech. */
  error?: string
  hint?: string
  /** Shown beside the label, e.g. "Optional". */
  tag?: string
}

/** A labelled input with an optional hint and an inline error, wired up for screen readers. */
export function TextField({ label, value, onChange, error, hint, tag, className, ...inputProps }: TextFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
        {tag && <small className="field__tag">{tag}</small>}
      </label>
      <input
        {...inputProps}
        id={id}
        className={`input${className ? ` ${className}` : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && !error && (
        <small id={hintId} className="field__hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={errorId} className="field__error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}
