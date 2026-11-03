import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api-error'
import { formatUsd } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { AdminProvider, NewProvider } from './data'
import { validateNewProvider } from './logic'
import { useCreateProvider, useProviders, useSetProviderActive } from './queries'
import './portal.css'

const empty: NewProvider = { name: '', providerType: '', contactPerson: '', phone: '', email: '', city: '', province: '' }

export default function ProvidersPage() {
  const providers = useProviders()
  const [adding, setAdding] = useState(false)

  return (
    <div className="page-stack">
      <header className="page-head page-head--row reveal">
        <div>
          <p className="eyebrow">Providers</p>
          <h1>Who we work with.</h1>
        </div>
        {!adding && (
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <Icon name="plus" size={18} />
            Add a provider
          </button>
        )}
      </header>

      {adding && <NewProviderForm onDone={() => setAdding(false)} />}

      {providers.data ? (
        <ul className="provider-grid">
          {providers.data.map((provider, index) => (
            <li key={provider.id} className="reveal" style={{ '--i': Math.min(index, 8) } as React.CSSProperties}>
              <ProviderCard provider={provider} />
            </li>
          ))}
        </ul>
      ) : providers.isPending ? (
        <div className="provider-grid" role="status" aria-busy="true">
          <span className="visually-hidden">Loading providers…</span>
          <Skeleton height="12rem" className="skeleton--card" />
          <Skeleton height="12rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={providers.error} onRetry={() => void providers.refetch()} noun="providers" />
      )}
    </div>
  )
}

function ProviderCard({ provider }: { provider: AdminProvider }) {
  const toggle = useSetProviderActive()

  return (
    <article className={`card provider-card${provider.isActive ? '' : ' provider-card--off'}`}>
      <header className="provider-card__head">
        <div>
          <p className="provider-card__type">{provider.providerType}</p>
          <h2>{provider.name}</h2>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={provider.isActive}
            disabled={toggle.isPending}
            onChange={(event) => toggle.mutate({ id: provider.id, isActive: event.target.checked })}
            aria-label={`${provider.name} is ${provider.isActive ? 'active' : 'switched off'}`}
          />
          <span className="switch__track" aria-hidden="true" />
          {provider.isActive ? 'Active' : 'Off'}
        </label>
      </header>

      <div className="provider-card__meta">
        <span>
          {provider.contactPerson} · {formatPhone(provider.phone)}
        </span>
        <span>
          {provider.city}, {provider.province}
        </span>
      </div>

      {!provider.isActive && (
        <p className="provider-card__note">Switched off: no new requests, and {provider.productCount > 0 ? 'its products are hidden from the marketplace' : 'nothing to hide in the marketplace'}.</p>
      )}
      {toggle.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(toggle.error)}
        </Callout>
      )}

      <dl className="provider-card__stats">
        <div>
          <dt>Open</dt>
          <dd>{provider.openAssignments}</dd>
        </div>
        <div>
          <dt>Done</dt>
          <dd>{provider.completedAssignments}</dd>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>{provider.orderCount}</dd>
        </div>
        <div>
          <dt>Revenue</dt>
          <dd>{formatUsd(provider.revenue)}</dd>
        </div>
      </dl>
    </article>
  )
}

function NewProviderForm({ onDone }: { onDone: () => void }) {
  const create = useCreateProvider()
  const [form, setForm] = useState<NewProvider>(empty)
  const [errors, setErrors] = useState<ReturnType<typeof validateNewProvider>>({})
  const set = (key: keyof NewProvider) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateNewProvider(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    create.mutate(form, { onSuccess: onDone })
  }

  return (
    <form className="card panel stack reveal" onSubmit={submit} noValidate aria-labelledby="new-provider-title">
      <h2 id="new-provider-title" className="panel__title">
        Add a provider
      </h2>
      <div className="studio-form__pair">
        <TextField label="Business name" value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="What they do" placeholder="Funeral director, florist…" value={form.providerType} onChange={set('providerType')} error={errors.providerType} />
      </div>
      <div className="studio-form__pair">
        <TextField label="Contact person" value={form.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} />
        <TextField label="Contact mobile" type="tel" inputMode="tel" placeholder="077 123 4567" value={form.phone} onChange={set('phone')} error={errors.phone} />
      </div>
      <div className="studio-form__pair">
        <TextField label="Email" tag="Optional" type="email" value={form.email ?? ''} onChange={set('email')} error={errors.email} />
        <TextField label="Town or city" value={form.city} onChange={set('city')} error={errors.city} />
      </div>
      {create.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(create.error)}
        </Callout>
      )}
      <div className="studio-form__actions">
        <button type="submit" className="btn btn--primary" disabled={create.isPending}>
          {create.isPending ? 'Adding…' : 'Add provider'}
        </button>
        <button type="button" className="btn btn--outline" onClick={onDone} disabled={create.isPending}>
          Cancel
        </button>
      </div>
    </form>
  )
}
