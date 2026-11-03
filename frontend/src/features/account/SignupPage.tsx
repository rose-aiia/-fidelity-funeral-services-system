import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { TextField } from '@/components/ui/TextField'
import { paths } from '@/config/routes'
import { isEmail, normalisePhone, useAuth, useRequestOtp, useSignUp } from '@/features/auth'
import { getErrorMessage } from '@/lib/api-error'
import { env } from '@/lib/env'
import { OtpVerify } from './OtpVerify'
import { DEMO_POLICY_HINT } from './data'
import { useLinkPolicy } from './queries'
import './account.css'

type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'policyNumber' | 'idNumber', string>>

export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [arrivedSignedIn] = useState(user)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState(params.get('phone') ?? '')
  const [email, setEmail] = useState('')
  const [hasPolicy, setHasPolicy] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [step, setStep] = useState<'details' | 'code'>('details')

  const requestOtp = useRequestOtp()
  const signUp = useSignUp()
  const linkPolicy = useLinkPolicy()

  if (arrivedSignedIn) return <Navigate to={paths.account} replace />

  const normalised = normalisePhone(phone)

  const validate = (): FieldErrors => {
    const found: FieldErrors = {}
    if (name.trim().length < 2) found.name = 'Enter your full name.'
    if (!normalised) found.phone = 'Enter a Zimbabwean mobile number, for example 077 123 4567.'
    if (email.trim() && !isEmail(email.trim())) found.email = 'Enter a valid email address, or leave it blank.'
    if (hasPolicy && !policyNumber.trim()) found.policyNumber = 'Enter the policy number from your documents.'
    if (hasPolicy && !idNumber.trim()) found.idNumber = 'Enter the ID number you registered the policy with.'
    return found
  }

  const handleDetailsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0 || !normalised) return
    requestOtp.mutate(normalised, { onSuccess: () => setStep('code') })
  }

  const handleCode = async (code: string) => {
    if (!normalised) return
    try {
      await signUp.mutateAsync({ name: name.trim(), phone: normalised, code, email: email.trim() || undefined })
    } catch {
      return // The error is shown from the mutation state.
    }

    if (!hasPolicy) {
      navigate(paths.account, { state: { welcome: true } })
      return
    }

    // The account now exists. A policy that doesn't match shouldn't undo that, so hand over to the policy page.
    try {
      await linkPolicy.mutateAsync({ policyNumber: policyNumber.trim(), idNumber: idNumber.trim() })
      navigate(paths.account, { state: { welcome: true } })
    } catch {
      navigate(paths.accountPolicy, { state: { policyNotMatched: true } })
    }
  }

  if (step === 'code' && normalised) {
    return (
      <OtpVerify
        phone={normalised}
        onSubmit={(code) => void handleCode(code)}
        onResend={() => requestOtp.mutate(normalised)}
        onBack={() => {
          signUp.reset()
          setStep('details')
        }}
        isSubmitting={signUp.isPending || linkPolicy.isPending}
        error={signUp.error}
      />
    )
  }

  return (
    <div className="auth-step">
      <div>
        <p className="eyebrow">Get started</p>
        <h1 className="auth-step__title">Create your account</h1>
      </div>
      <p className="muted">Takes about a minute. Already insured with us? Add your policy and it’s ready on day one.</p>

      <form className="stack" onSubmit={handleDetailsSubmit} noValidate>
        <TextField label="Full name" autoComplete="name" value={name} onChange={setName} error={errors.name} />
        <TextField
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="077 123 4567"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
        />
        <TextField
          label="Email"
          tag="Optional"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />

        <label className="toggle">
          <input type="checkbox" checked={hasPolicy} onChange={(event) => setHasPolicy(event.target.checked)} />
          <span>I already have a Fidelity Life policy</span>
        </label>

        {hasPolicy && (
          <div className="stack signup-policy">
            <TextField
              label="Policy number"
              placeholder="FLA-123456"
              autoCapitalize="characters"
              value={policyNumber}
              onChange={setPolicyNumber}
              error={errors.policyNumber}
            />
            <TextField
              label="ID number"
              placeholder="63-123456-K-42"
              autoCapitalize="characters"
              value={idNumber}
              onChange={setIdNumber}
              error={errors.idNumber}
              hint="We use this once, to confirm the policy is yours."
            />
            {env.useMock && <Callout tone="info">{DEMO_POLICY_HINT}</Callout>}
          </div>
        )}

        {requestOtp.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(requestOtp.error)}
          </Callout>
        )}

        <button type="submit" className="btn btn--primary btn--lg w-full" disabled={requestOtp.isPending}>
          {requestOtp.isPending ? 'Sending code…' : 'Continue'}
        </button>
        <p className="auth-fineprint">By continuing you agree to the sample Terms and Privacy Notice.</p>
      </form>

      <p className="auth-alt">
        Already have an account? <Link to={paths.login}>Sign in</Link>
      </p>
    </div>
  )
}
