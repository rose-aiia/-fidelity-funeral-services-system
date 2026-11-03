import { useEffect, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { DEMO_OTP, formatPhone } from '@/features/auth'
import { getErrorMessage } from '@/lib/api-error'
import { env } from '@/lib/env'
import { OtpInput } from './OtpInput'

const RESEND_SECONDS = 30

type OtpVerifyProps = {
  /** E.164 number the code was sent to. */
  phone: string
  /** Receives the full code; failures are shown from `error`. */
  onSubmit: (code: string) => void
  onResend: () => void
  onBack: () => void
  isSubmitting: boolean
  error: unknown
}

/** The "enter the code we texted you" step shared by sign-in and sign-up. */
export function OtpVerify({ phone, onSubmit, onResend, onBack, isSubmitting, error }: OtpVerifyProps) {
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  // A wrong code clears the boxes so the next attempt starts fresh.
  const [seenError, setSeenError] = useState(error)
  if (error !== seenError) {
    setSeenError(error)
    if (error) setCode('')
  }

  const handleResend = () => {
    setCode('')
    setSecondsLeft(RESEND_SECONDS)
    onResend()
  }

  return (
    <div className="auth-step">
      <h1 className="auth-step__title">Enter your code</h1>
      <p className="muted">
        We sent a 6-digit code to <strong>{formatPhone(phone)}</strong>.
      </p>

      {env.useMock && (
        <Callout tone="info">
          Demo mode: use code <strong>{DEMO_OTP}</strong>.
        </Callout>
      )}

      <OtpInput value={code} onChange={setCode} onComplete={onSubmit} disabled={isSubmitting} invalid={Boolean(error)} />

      <div aria-live="polite">
        {isSubmitting && <p className="muted">Checking your code…</p>}
        {error != null && !isSubmitting && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(error)}
          </Callout>
        )}
      </div>

      <div className="auth-step__links">
        <button type="button" className="link-button" onClick={onBack} disabled={isSubmitting}>
          Change number
        </button>
        {secondsLeft > 0 ? (
          <span className="muted">Resend code in {secondsLeft}s</span>
        ) : (
          <button type="button" className="link-button" onClick={handleResend} disabled={isSubmitting}>
            Resend code
          </button>
        )}
      </div>
    </div>
  )
}
