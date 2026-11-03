import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { TextField } from '@/components/ui/TextField'
import { paths } from '@/config/routes'
import {
  normalisePhone,
  safeNextPath,
  useAuth,
  useDemoSignIn,
  useRequestOtp,
  useSignIn,
  type Role,
} from '@/features/auth'
import { ApiError, getErrorMessage } from '@/lib/api-error'
import { env } from '@/lib/env'
import { DemoPersonas } from './DemoPersonas'
import { OtpVerify } from './OtpVerify'
import './account.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  // Only people who arrive already signed in are bounced onward; signing in here navigates explicitly.
  const [arrivedSignedIn] = useState(user)

  const [phone, setPhone] = useState(params.get('phone') ?? '')
  const [phoneError, setPhoneError] = useState<string>()
  const [step, setStep] = useState<'phone' | 'code'>('phone')

  const requestOtp = useRequestOtp()
  const signIn = useSignIn()
  const demoSignIn = useDemoSignIn()

  const nextParam = params.get('next')
  const destinationFor = (role: Role) =>
    nextParam ? safeNextPath(nextParam, paths.account) : role === 'customer' ? paths.account : paths.provider

  if (arrivedSignedIn) return <Navigate to={destinationFor(arrivedSignedIn.role)} replace />

  const normalised = normalisePhone(phone)

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!normalised) {
      setPhoneError('Enter a Zimbabwean mobile number, for example 077 123 4567.')
      return
    }
    setPhoneError(undefined)
    requestOtp.mutate(normalised, { onSuccess: () => setStep('code') })
  }

  const handleCode = (code: string) => {
    if (!normalised) return
    signIn.mutate({ phone: normalised, code }, { onSuccess: (signedIn) => navigate(destinationFor(signedIn.role)) })
  }

  const noAccount = signIn.error instanceof ApiError && signIn.error.code === 'account_not_found'

  if (step === 'code' && normalised) {
    return (
      <>
        <OtpVerify
          phone={normalised}
          onSubmit={handleCode}
          onResend={() => requestOtp.mutate(normalised)}
          onBack={() => {
            signIn.reset()
            setStep('phone')
          }}
          isSubmitting={signIn.isPending}
          error={signIn.error}
        />
        {noAccount && (
          <p className="auth-alt">
            <Link to={`${paths.signup}?phone=${encodeURIComponent(normalised)}`}>Create an account with this number</Link>
          </p>
        )}
      </>
    )
  }

  return (
    <div className="auth-step">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="auth-step__title">Sign in to your account</h1>
      </div>
      <p className="muted">We’ll text you a one-time code. No password to remember.</p>

      <form className="stack" onSubmit={handlePhoneSubmit} noValidate>
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          value={phone}
          onChange={setPhone}
          error={phoneError}
        />
        {requestOtp.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(requestOtp.error)}
          </Callout>
        )}
        <button type="submit" className="btn btn--primary btn--lg w-full" disabled={requestOtp.isPending}>
          {requestOtp.isPending ? 'Sending code…' : 'Send me a code'}
        </button>
      </form>

      <p className="auth-alt">
        New here? <Link to={paths.signup}>Create an account</Link>
      </p>

      {env.useMock && (
        <DemoPersonas
          disabled={demoSignIn.isPending}
          pendingId={demoSignIn.isPending ? demoSignIn.variables : undefined}
          onPick={(persona) =>
            demoSignIn.mutate(persona.user.id, { onSuccess: (signedIn) => navigate(destinationFor(signedIn.role)) })
          }
        />
      )}
    </div>
  )
}
