import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { TextField } from '@/components/ui/TextField'
import { accountMemorialPath, paths } from '@/config/routes'
import { getErrorMessage } from '@/lib/api-error'
import { NAME_MAX_LENGTH, TAGLINE_MAX_LENGTH } from './data'
import { useCreateMemorial } from './queries'
import { hasErrors, validateNewMemorial } from './validation'
import './memorial.css'
import './studio.css'

const today = () => new Date().toISOString().slice(0, 10)

/** The short first step: just enough to give the memorial a name and an address. The rest is the editor. */
export function NewMemorialForm() {
  const navigate = useNavigate()
  const create = useCreateMemorial()
  const [form, setForm] = useState({ name: '', born: '', died: '', tagline: '', location: '' })
  const [errors, setErrors] = useState<ReturnType<typeof validateNewMemorial>>({})

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateNewMemorial(form)
    setErrors(found)
    if (hasErrors(found)) return
    create.mutate(
      {
        name: form.name.trim(),
        born: form.born,
        died: form.died,
        tagline: form.tagline.trim() || undefined,
        location: form.location.trim() || undefined,
      },
      { onSuccess: (memorial) => navigate(accountMemorialPath(memorial.id), { replace: true, state: { created: true } }) },
    )
  }

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">New memorial</p>
        <h1>Who are we remembering?</h1>
        <p className="muted page-head__lead">
          Start with a few details. You can add their story, photographs and service details next, and nothing is public
          until you choose to publish it.
        </p>
      </header>

      <form className="card panel studio-form stack reveal" style={{ '--i': 1 } as React.CSSProperties} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <div className="studio-form__pair">
          <TextField label="Date of birth" type="date" max={today()} value={form.born} onChange={set('born')} error={errors.born} />
          <TextField label="Date of passing" type="date" max={today()} value={form.died} onChange={set('died')} error={errors.died} />
        </div>
        <TextField
          label="A line in their memory"
          tag="Optional"
          placeholder="A mother to many, and a friend to everyone."
          maxLength={TAGLINE_MAX_LENGTH}
          value={form.tagline}
          onChange={set('tagline')}
          error={errors.tagline}
          hint="Shown beneath their name."
        />
        <TextField label="Town or city" tag="Optional" placeholder="Bulawayo" value={form.location} onChange={set('location')} />

        {create.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(create.error)}
          </Callout>
        )}

        <div className="studio-form__actions">
          <button type="submit" className="btn btn--primary" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create memorial'}
          </button>
          <Link className="btn btn--outline" to={paths.accountMemorials}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
