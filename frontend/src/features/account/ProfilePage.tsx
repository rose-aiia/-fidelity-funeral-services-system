import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { Toast } from '@/components/ui/Toast'
import { formatPhone, isEmail, useAuth, useSignOutAndLeave, useUpdateProfile, type Language } from '@/features/auth'
import { getErrorMessage } from '@/lib/api-error'
import './account.css'

const TOAST_DURATION_MS = 3000

const languages: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'sn', label: 'chiShona' },
  { value: 'nd', label: 'isiNdebele' },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const handleSignOut = useSignOutAndLeave()
  const update = useUpdateProfile()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [language, setLanguage] = useState<Language>(user?.language ?? 'en')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [saved])

  if (!user) return null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = {
      name: name.trim().length >= 2 ? undefined : 'Enter your full name.',
      email: !email.trim() || isEmail(email.trim()) ? undefined : 'Enter a valid email address, or leave it blank.',
    }
    setErrors(found)
    if (found.name || found.email) return
    update.mutate({ name: name.trim(), email: email.trim() || undefined, language }, { onSuccess: () => setSaved(true) })
  }

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">Profile</p>
        <h1>Your details.</h1>
      </header>

      <section className="card panel profile reveal" style={{ '--i': 1 } as React.CSSProperties} aria-label="Profile details">
        <div className="profile__who">
          <Avatar name={user.name} size="lg" />
          <div>
            <strong>{user.name}</strong>
            <span className="muted">{formatPhone(user.phone)}</span>
          </div>
        </div>

        <form className="stack" onSubmit={handleSubmit} noValidate>
          <TextField label="Full name" autoComplete="name" value={name} onChange={setName} error={errors.name} />
          <TextField
            label="Email"
            tag="Optional"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
          />
          <TextField
            label="Mobile number"
            value={formatPhone(user.phone)}
            onChange={() => undefined}
            readOnly
            hint="This is how you sign in. To change it, ask an adviser."
          />

          <div className="field">
            <label className="field__label" htmlFor="profile-language">
              Preferred language
            </label>
            <select
              id="profile-language"
              className="select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              {languages.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small className="field__hint">Used for how advisers speak with you. The website itself is in English for now.</small>
          </div>

          {update.error && (
            <Callout tone="danger" role="alert">
              {getErrorMessage(update.error)}
            </Callout>
          )}

          <button type="submit" className="btn btn--primary" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="card panel reveal" style={{ '--i': 2 } as React.CSSProperties} aria-label="Sign out">
        <h2 className="panel__title">Signing out</h2>
        <p className="muted">You can sign back in any time with a code sent to your phone.</p>
        <button type="button" className="btn btn--outline" onClick={handleSignOut}>
          <Icon name="logout" size={18} />
          Sign out
        </button>
      </section>

      {saved && <Toast>Your details have been saved.</Toast>}
    </div>
  )
}
