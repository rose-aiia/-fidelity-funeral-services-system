import { useEffect, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { Toast } from '@/components/ui/Toast'
import { getErrorMessage } from '@/lib/api-error'
import { NAME_MAX_LENGTH, TAGLINE_MAX_LENGTH, type OwnedMemorial } from './data'
import { useUpdateMemorial } from './queries'
import { fromHarareInput, toHarareInput } from './service-time'
import { hasErrors, validateNewMemorial } from './validation'

const TOAST_DURATION_MS = 2800
const today = () => new Date().toISOString().slice(0, 10)

export function DetailsTab({ memorial }: { memorial: OwnedMemorial }) {
  const update = useUpdateMemorial(memorial.id)
  const [form, setForm] = useState({
    name: memorial.name,
    born: memorial.born,
    died: memorial.died,
    tagline: memorial.tagline ?? '',
    location: memorial.location ?? '',
  })
  const [hasService, setHasService] = useState(Boolean(memorial.service))
  const [service, setService] = useState({
    date: memorial.service ? toHarareInput(memorial.service.date) : '',
    venue: memorial.service?.venue ?? '',
    address: memorial.service?.address ?? '',
    note: memorial.service?.note ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [saved])

  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))
  const setServiceField = (key: keyof typeof service) => (value: string) =>
    setService((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Record<string, string | undefined> = { ...validateNewMemorial(form) }
    if (hasService) {
      if (!fromHarareInput(service.date)) found.serviceDate = 'Choose the date and time of the service.'
      if (!service.venue.trim()) found.venue = 'Where will the service be held?'
    }
    setErrors(found)
    if (hasErrors(Object.fromEntries(Object.entries(found).filter(([, value]) => value)))) return

    update.mutate(
      {
        name: form.name.trim(),
        born: form.born,
        died: form.died,
        tagline: form.tagline.trim(),
        location: form.location.trim(),
        service: hasService
          ? {
              date: fromHarareInput(service.date),
              venue: service.venue.trim(),
              ...(service.address.trim() && { address: service.address.trim() }),
              ...(service.note.trim() && { note: service.note.trim() }),
            }
          : null,
      },
      { onSuccess: () => setSaved(true) },
    )
  }

  return (
    <form className="card panel studio-form stack" onSubmit={handleSubmit} noValidate>
      <h2 className="panel__title">Details</h2>

      <TextField label="Full name" maxLength={NAME_MAX_LENGTH} value={form.name} onChange={set('name')} error={errors.name} />
      <div className="studio-form__pair">
        <TextField label="Date of birth" type="date" max={today()} value={form.born} onChange={set('born')} error={errors.born} />
        <TextField label="Date of passing" type="date" max={today()} value={form.died} onChange={set('died')} error={errors.died} />
      </div>
      <TextField
        label="A line in their memory"
        tag="Optional"
        maxLength={TAGLINE_MAX_LENGTH}
        value={form.tagline}
        onChange={set('tagline')}
        error={errors.tagline}
        hint="Shown beneath their name."
      />
      <TextField label="Town or city" tag="Optional" value={form.location} onChange={set('location')} />

      <div className="studio-form__divider" />

      <label className="toggle">
        <input type="checkbox" checked={hasService} onChange={(event) => setHasService(event.target.checked)} />
        <span>Add the funeral or memorial service details</span>
      </label>

      {hasService && (
        <div className="stack studio-form__nested">
          <TextField
            label="Date and time"
            type="datetime-local"
            value={service.date}
            onChange={setServiceField('date')}
            error={errors.serviceDate}
            hint="In Zimbabwe time."
          />
          <TextField label="Venue" placeholder="St Mary’s Church" value={service.venue} onChange={setServiceField('venue')} error={errors.venue} />
          <TextField label="Address" tag="Optional" value={service.address} onChange={setServiceField('address')} />
          <TextField
            label="A note for guests"
            tag="Optional"
            placeholder="Burial follows at…"
            value={service.note}
            onChange={setServiceField('note')}
          />
        </div>
      )}

      {update.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(update.error)}
        </Callout>
      )}

      <div className="studio-form__actions">
        <button type="submit" className="btn btn--primary" disabled={update.isPending}>
          <Icon name="check" size={18} />
          {update.isPending ? 'Saving…' : 'Save details'}
        </button>
      </div>

      {saved && <Toast>Details saved.</Toast>}
    </form>
  )
}
