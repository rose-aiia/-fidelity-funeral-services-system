import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { StatusChip } from '@/components/ui/StatusChip'
import { TextField } from '@/components/ui/TextField'
import { paths } from '@/config/routes'
import { sendAlerts, type PlanInput } from '@/features/alerts'
import { parseContact } from '@/features/alerts/rules'
import { daysUntil, defaultThankYou, kindLabels, newId, nextOccurrence, parseRecipients, supportResources, type AftercareState, type ReminderKind } from './data'
import { loadAftercare, saveAftercare } from './store'
import './aftercare.css'

const dateFmt = new Intl.DateTimeFormat('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })

function whenLabel(days: number) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export default function AftercarePage() {
  const [state, setState] = useState<AftercareState>(loadAftercare)
  const [person, setPerson] = useState('')
  const [recipients, setRecipients] = useState('')
  const [message, setMessage] = useState(() => defaultThankYou(''))
  const [edited, setEdited] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [rem, setRem] = useState<{ person: string; kind: ReminderKind; date: string; note: string }>({ person: '', kind: 'anniversary', date: '', note: '' })
  const [remError, setRemError] = useState('')
  const msgId = useId()
  const kindId = useId()

  function update(next: AftercareState) { setState(next); saveAftercare(next) }

  function changePerson(v: string) {
    setPerson(v)
    if (!edited) setMessage(defaultThankYou(v.trim()))
  }

  function send(e: FormEvent) {
    e.preventDefault()
    const names = parseRecipients(recipients)
    if (names.length === 0) { setError('Add at least one name, separated by commas or new lines.'); return }
    if (!message.trim()) { setError('Write a message first.'); return }
    setError('')
    const contacts = names.map(parseContact)
    const inputs: PlanInput[] = contacts.filter((c) => c.phone).map((c) => ({
      event: 'aftercare.thank_you', recipient: { phone: c.phone as string, consent: true },
      payload: { name: c.name, message: message.trim().replace(/\s+/g, ' ') }, ref: `${Date.now()}:${c.phone}`,
    }))
    void sendAlerts(inputs)
    update({ ...state, thankYous: [{ id: newId('ty'), recipients: contacts.map((c) => c.name), message: message.trim(), sentAt: new Date().toISOString() }, ...state.thankYous] })
    setNote(`Saved as sent to ${names.length} ${names.length === 1 ? 'person' : 'people'}. ${inputs.length ? `${inputs.length} had a number; see Message alerts for what would be sent by SMS or WhatsApp.` : 'Add a mobile number after a name (for example "Tendai 0771234567") to send by SMS or WhatsApp.'} This is a demonstration, so nothing was actually delivered.`)
    setRecipients('')
  }

  function addReminder(e: FormEvent) {
    e.preventDefault()
    if (!rem.person.trim() || !nextOccurrence(rem.date)) { setRemError('Add a name and a valid date.'); return }
    setRemError('')
    update({ ...state, reminders: [...state.reminders, { id: newId('r'), person: rem.person.trim(), kind: rem.kind, date: rem.date, note: rem.note.trim() }] })
    setRem({ person: '', kind: 'anniversary', date: '', note: '' })
  }

  const upcoming = state.reminders
    .map((r) => ({ r, next: nextOccurrence(r.date) }))
    .filter((x): x is { r: typeof x.r; next: Date } => x.next !== null)
    .sort((a, b) => a.next.getTime() - b.next.getTime())

  return (
    <div className="page-stack af-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Aftercare</p>
        <h1>Staying connected after the funeral</h1>
        <p className="muted" style={{ maxWidth: '72ch' }}>Thank the people who supported you, set reminders for the dates that matter, and find support. Everything is saved in this browser only.</p>
      </header>

      <Callout tone="warning">
        <strong>Demonstration only.</strong> No message is sent and no reminder is delivered by email or SMS. A real service would need each person&rsquo;s consent before contacting them.
      </Callout>

      <section className="card stack" aria-labelledby="af-thanks">
        <h2 id="af-thanks" className="panel__title" style={{ margin: 0 }}>Thank-you messages</h2>
        <form className="af-form" onSubmit={send} noValidate>
          <TextField label="In memory of" tag="Optional" value={person} onChange={changePerson} />
          <TextField label="Who are you thanking?" value={recipients} onChange={setRecipients} hint="Names separated by commas. Add a mobile number after a name to message them, only if they agreed." error={error} />
          <div className="field">
            <label htmlFor={msgId} className="field__label">Message</label>
            <textarea id={msgId} className="textarea" rows={7} value={message} onChange={(e) => { setMessage(e.target.value); setEdited(true) }} />
          </div>
          <div><button className="btn btn--primary btn--sm" type="submit">Send sample thank-you</button></div>
          {note && <p role="status" className="af-hint">{note}</p>}
        </form>
        {state.thankYous.length > 0 && (
          <>
            <h3 style={{ margin: 0 }}>Sent</h3>
            <ul className="af-list">
              {state.thankYous.map((t) => (
                <li key={t.id} className="af-item">
                  <div>
                    <strong>To {t.recipients.join(', ')}</strong>
                    <div className="af-hint">{dateFmt.format(new Date(t.sentAt))}</div>
                    <p className="af-message">{t.message}</p>
                  </div>
                  <button className="btn btn--outline btn--sm" type="button" aria-label="Delete this message" onClick={() => update({ ...state, thankYous: state.thankYous.filter((y) => y.id !== t.id) })}>Delete</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="af-two">
        <section className="card stack" aria-labelledby="af-rem">
          <h2 id="af-rem" className="panel__title" style={{ margin: 0 }}>Anniversary and memorial reminders</h2>
          {upcoming.length === 0 && <p className="muted">No reminders yet.</p>}
          <ul className="af-list">
            {upcoming.map(({ r, next }) => {
              const days = daysUntil(next)
              return (
                <li key={r.id} className="af-item">
                  <div>
                    <strong>{r.person}</strong>
                    <div className="af-hint">{kindLabels[r.kind]} · {dateFmt.format(next)}{r.note ? ` · ${r.note}` : ''}</div>
                  </div>
                  <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                    <StatusChip tone={days <= 30 ? 'warning' : 'neutral'}>{whenLabel(days)}</StatusChip>
                    <button className="btn btn--outline btn--sm" type="button" aria-label={`Remove reminder for ${r.person}`} onClick={() => update({ ...state, reminders: state.reminders.filter((y) => y.id !== r.id) })}>Remove</button>
                  </div>
                </li>
              )
            })}
          </ul>
          <form className="af-form" onSubmit={addReminder} noValidate aria-label="Add a reminder">
            <TextField label="Person remembered" value={rem.person} onChange={(v) => setRem({ ...rem, person: v })} />
            <div className="field">
              <label htmlFor={kindId} className="field__label">Type</label>
              <select id={kindId} className="select" value={rem.kind} onChange={(e) => setRem({ ...rem, kind: e.target.value as ReminderKind })}>
                {(Object.keys(kindLabels) as ReminderKind[]).map((k) => <option key={k} value={k}>{kindLabels[k]}</option>)}
              </select>
            </div>
            <TextField label="Date" type="date" value={rem.date} onChange={(v) => setRem({ ...rem, date: v })} hint="Repeats every year on this day." error={remError} />
            <TextField label="Note" tag="Optional" value={rem.note} onChange={(v) => setRem({ ...rem, note: v })} />
            <div><button className="btn btn--outline btn--sm" type="submit">Add reminder</button></div>
          </form>
        </section>

        <section className="card stack" aria-labelledby="af-support">
          <h2 id="af-support" className="panel__title" style={{ margin: 0 }}>Support and follow-up</h2>
          <ul className="af-list">
            {supportResources.map((s) => (
              <li key={s.title} className="af-item"><div><strong>{s.title}</strong><p className="af-hint" style={{ margin: '4px 0 0' }}>{s.detail}</p></div></li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn--outline btn--sm" to={paths.accountMemorials}>Memorials and tributes</Link>
            <Link className="btn btn--outline btn--sm" to={paths.accountEstate}>Estate checklist</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
