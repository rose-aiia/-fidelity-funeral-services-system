import { useEffect, useId, useState, type FormEvent } from 'react'
import { Callout } from '@/components/ui/Callout'
import { StatusChip } from '@/components/ui/StatusChip'
import { TextField } from '@/components/ui/TextField'
import { sendAlerts, type PlanInput } from '@/features/alerts'
import { normaliseInternationalPhone } from '@/lib/phone'
import { durationOptions, funeralDays, isSharing, LEG_SECONDS, minutesLeft, simulatedPosition, type FuneralDay, type ShareState } from './data'
import { loadShare, saveShare } from './store'
import './procession.css'

const kindLabel = { departure: 'Departure', venue: 'Service venue', cemetery: 'Burial' } as const

function Tracker({ day, share, now }: { day: FuneralDay; share: ShareState; now: number }) {
  const elapsed = now - new Date(share.startedAt as string).getTime()
  const pos = simulatedPosition(elapsed, day.stops.length)
  const legs = day.stops.length - 1
  const progress = Math.min(1, (pos.legIndex + pos.fraction) / legs)
  const left = Math.max(0, Math.ceil(((legs - pos.legIndex - pos.fraction) * LEG_SECONDS)))
  const from = day.stops[pos.legIndex]
  const to = day.stops[pos.legIndex + 1]
  const summary = pos.arrived
    ? `Arrived at ${day.stops[legs].label}.`
    : `Travelling from ${from.label} to ${to.label}. Simulated arrival in about ${left} seconds.`

  return (
    <div>
      <p role="status"><strong>{summary}</strong></p>
      <div className="pr-track" aria-hidden="true">
        <div className="pr-fill" style={{ width: `calc(${progress * 100}% )` }} />
        {day.stops.map((s, i) => (
          <div key={s.id} className={`pr-dot${pos.arrived || i <= pos.legIndex ? ' pr-dot--done' : ''}`}>
            <strong>{s.label}</strong>
            <span>{s.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayCard({ day }: { day: FuneralDay }) {
  const [share, setShare] = useState<ShareState>(() => loadShare(day.id))
  const [now, setNow] = useState(() => Date.now())
  const [viewer, setViewer] = useState('')
  const [viewerPhone, setViewerPhone] = useState('')
  const [viewerAgreed, setViewerAgreed] = useState(false)
  const [viewerError, setViewerError] = useState('')
  const [consent, setConsent] = useState(false)
  const [duration, setDuration] = useState(share.durationMin)
  const consentId = useId()
  const durId = useId()
  const sharing = isSharing(share, now)

  useEffect(() => {
    if (!sharing) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [sharing])

  function update(next: ShareState) { setShare(next); saveShare(day.id, next) }

  // Sharing that has run out counts as ended, whether or not the family pressed stop.
  const hasEnded = Boolean(share.startedAt) && !sharing

  function addViewer(e: FormEvent) {
    e.preventDefault()
    const name = viewer.trim()
    if (!name || share.viewers.some((v) => v.toLowerCase() === name.toLowerCase())) return
    let contacts = share.contacts
    if (viewerPhone.trim()) {
      const phone = normaliseInternationalPhone(viewerPhone)
      if (!phone) { setViewerError('Enter a valid number, with a + country code if it is not a Zimbabwean number.'); return }
      if (!viewerAgreed) { setViewerError('Confirm that they agreed to receive messages, or leave the number blank.'); return }
      contacts = { ...contacts, [name]: phone }
    }
    setViewerError('')
    update({ ...share, viewers: [...share.viewers, name], contacts })
    setViewer('')
    setViewerPhone('')
    setViewerAgreed(false)
  }

  /** Messages the invited relatives who gave a number and agreed. Alert failures never block the action. */
  function notify(event: 'procession.started' | 'procession.stopped', next: ShareState, minutes?: number) {
    const inputs: PlanInput[] = Object.entries(next.contacts ?? {}).map(([name, phone]) => ({
      event,
      recipient: { phone, consent: true },
      payload: { name, deceased: day.person, minutes, link: `${window.location.origin}${window.location.pathname}` },
      ref: `${day.id}:${next.startedAt ?? ''}`,
    }))
    void sendAlerts(inputs)
  }

  function start() {
    const t = Date.now()
    setNow(t)
    const next = { ...share, startedAt: new Date(t).toISOString(), endedAt: null, durationMin: duration }
    update(next)
    notify('procession.started', next, duration)
  }

  function stop() {
    const next = { ...share, endedAt: new Date().toISOString() }
    update(next)
    notify('procession.stopped', next)
  }

  const status = sharing ? <StatusChip tone="success">Sharing is on</StatusChip> : hasEnded ? <StatusChip tone="neutral">Sharing ended</StatusChip> : <StatusChip tone="neutral">Sharing is off</StatusChip>

  return (
    <article className="card stack" aria-labelledby={`${day.id}-t`}>
      <div className="pr-actions" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="eyebrow">{day.date}</p>
          <h2 id={`${day.id}-t`} className="panel__title" style={{ margin: 0 }}>{day.person}</h2>
        </div>
        {status}
      </div>

      <h3 style={{ margin: 0 }}>Programme and directions</h3>
      <ol className="pr-stops">
        {day.stops.map((s) => (
          <li key={s.id} className="pr-stop">
            <span className="pr-time">{s.time}</span>
            <div>
              <strong>{s.label}</strong> <span className="pr-hint">· {kindLabel[s.kind]}</span>
              <div className="pr-hint">{s.address}</div>
              <p style={{ margin: '4px 0 0' }}>{s.directions}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 style={{ margin: 0 }}>Share the procession&rsquo;s location (simulated)</h3>
      <Callout tone="info">
        Location sharing is <strong>voluntary</strong>, <strong>time-limited</strong> and only visible to the people the family invites. It can be stopped at any time. This demonstration uses simulated movement and never reads your device&rsquo;s location.
      </Callout>

      {sharing ? (
        <>
          <Tracker day={day} share={share} now={now} />
          <p className="pr-hint">Visible to: {share.viewers.length ? share.viewers.join(', ') : 'no one yet. Invite relatives below.'} · {minutesLeft(share, now)} min of sharing left.</p>
          <div className="pr-actions"><button className="btn btn--outline btn--sm" type="button" onClick={stop}>Stop sharing now</button></div>
        </>
      ) : (
        <div className="pr-form">
          <div className="field">
            <label htmlFor={durId} className="field__label">Share for</label>
            <select id={durId} className="select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {durationOptions.map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <label htmlFor={consentId} style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
            <input id={consentId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 4 }} />
            <span>The family agrees to share the procession&rsquo;s location with the invited relatives below, for the time chosen.</span>
          </label>
          <div className="pr-actions"><button className="btn btn--primary btn--sm" type="button" disabled={!consent || share.viewers.length === 0} onClick={start}>Start sharing</button></div>
          {share.viewers.length === 0 && <p className="pr-hint">Invite at least one relative first.</p>}
          {hasEnded && <p className="pr-hint">Sharing has ended and nobody can see the location now.</p>}
        </div>
      )}

      <form className="pr-form" onSubmit={addViewer} aria-label="Invite a relative">
        <TextField label="Invite a relative to see the location" value={viewer} onChange={setViewer} />
        <TextField label="Mobile number" tag="Optional" hint="Add a number to message them when sharing starts and stops." value={viewerPhone} onChange={setViewerPhone} inputMode="tel" error={viewerError} />
        {viewerPhone.trim() && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
            <input type="checkbox" checked={viewerAgreed} onChange={(e) => setViewerAgreed(e.target.checked)} style={{ marginTop: 4 }} />
            <span>They agreed to receive SMS or WhatsApp messages about this funeral.</span>
          </label>
        )}
        <div className="pr-actions"><button className="btn btn--outline btn--sm" type="submit">Invite</button></div>
        {share.viewers.length > 0 && (
          <ul className="pr-stops">
            {share.viewers.map((v) => (
              <li key={v} className="pr-actions" style={{ justifyContent: 'space-between' }}>
                <span>{v}{share.contacts?.[v] ? ' · will be messaged' : ''}</span>
                <button className="btn btn--outline btn--sm" type="button" aria-label={`Remove ${v}`} onClick={() => update({ ...share, viewers: share.viewers.filter((x) => x !== v), contacts: Object.fromEntries(Object.entries(share.contacts ?? {}).filter(([k]) => k !== v)) })}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </form>
    </article>
  )
}

export default function ProcessionPage() {
  return (
    <div className="page-stack pr-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Funeral day</p>
        <h1>Schedule, directions and procession updates</h1>
        <p className="muted" style={{ maxWidth: '72ch' }}>See the times and venues, get directions, and let invited relatives follow the procession. Settings are saved in this browser only.</p>
      </header>
      <Callout tone="warning"><strong>Demonstration only.</strong> The venues, addresses and movement shown here are fictional and simulated. No real vehicle is being tracked.</Callout>
      {funeralDays.map((d) => <DayCard key={d.id} day={d} />)}
    </div>
  )
}
