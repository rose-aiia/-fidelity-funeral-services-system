import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  /** Called once, when the last digit is filled in. */
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
}

/** Six boxes that behave like one field: auto-advance, backspace, arrow keys, paste and SMS autofill. */
export function OtpInput({ value, onChange, onComplete, length = 6, disabled, invalid }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, index) => value[index] ?? '')
  const isEmpty = value === ''

  // Land on the first box when the step opens, and again after a wrong code clears the field.
  useEffect(() => {
    if (!disabled && isEmpty) inputs.current[0]?.focus()
  }, [disabled, isEmpty])

  const focusBox = (index: number) => inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus()

  const commit = (next: string) => {
    onChange(next)
    if (next.length === length) onComplete?.(next)
  }

  /** Writes `chars` into the code starting at `start`, never leaving a gap. */
  const fill = (start: number, chars: string) => {
    const next = value.split('')
    const at = Math.min(start, next.length)
    for (let offset = 0; offset < chars.length && at + offset < length; offset++) next[at + offset] = chars[offset]!
    return { code: next.join('').slice(0, length), last: Math.min(at + chars.length, length - 1) }
  }

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) {
      onChange(value.slice(0, index) + value.slice(index + 1))
      return
    }
    const { code, last } = fill(index, typed)
    commit(code)
    focusBox(last)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index]) {
      event.preventDefault()
      onChange(value.slice(0, index - 1) + value.slice(index))
      focusBox(index - 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusBox(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!pasted) return
    event.preventDefault()
    const code = pasted.slice(0, length)
    commit(code)
    focusBox(code.length)
  }

  return (
    <div className="otp" role="group" aria-label="One-time code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element
          }}
          className="otp__box"
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? true : undefined}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  )
}
