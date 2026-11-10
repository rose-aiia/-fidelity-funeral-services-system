import { useCallback, useEffect, useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { StatusChip } from '@/components/ui/StatusChip'
import { usePolicy } from '@/features/account/queries'
import { loadAftercare } from '@/features/aftercare/store'
import { useAuth } from '@/features/auth'
import { formatPhone } from '@/lib/phone'
import { clearAlertOutbox, getAlertState, sendAlerts, setAlertPref, simulateStopReply } from './api'
import { CHANNEL_LABEL, EVENT_GROUPS, EVENT_LABEL } from './labels'
import { CHANNELS, isEnabled } from './rules'
import { scheduledAlerts } from './scheduled'
import type { AlertChannel, AlertEvent, AlertState, AlertStatus } from './types'
import './alerts.css'

const TONE: Record<AlertStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  sent: 'success', delivered: 'success', queued: 'neutral', blocked: 'warning', failed: 'danger',
}
const timeFmt = new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' })

export default function AlertsPage() {
  const { user } = useAuth()
  const policy = usePolicy().data
  const [state, setState] = useState<AlertState | null>(null)

  const refresh = useCallback(() => { void getAlertState().then(setState) }, [])
  useEffect(refresh, [refresh])

  // Date-driven alerts (reminders, premium) are evaluated whenever the page opens; dedupe stops repeats.
  useEffect(() => {
    if (!user) return
    const inputs = scheduledAlerts(user, loadAftercare().reminders, policy ?? undefined, new Date())
    void sendAlerts(inputs).then(refresh)
  }, [user, policy, refresh])

  async function toggle(event: AlertEvent, channel: AlertChannel, enabled: boolean) {
    setState(await setAlertPref(event, channel, enabled))
  }

  if (!state || !user) return <p className="muted">Loading…</p>

  const stopped = CHANNELS.flatMap((c) => state.stopped[c].map((p) => `${formatPhone(p)} (${CHANNEL_LABEL[c]})`))

  return (
    <div className="page-stack al-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Message alerts</p>
        <h1>SMS and WhatsApp alerts</h1>
        <p className="muted" style={{ maxWidth: '72ch' }}>
          Choose which updates you would like to receive on {formatPhone(user.phone)}. Everything is off until you switch it on, and you can reply STOP to any message.
        </p>
      </header>

      <Callout tone="warning">
        <strong>Demonstration only.</strong> Nothing is delivered. The outbox below shows what would be sent. Messages are held between 21:00 and 06:00 (Harare time) unless they are about the funeral day.
      </Callout>

      <section className="card stack" aria-labelledby="al-prefs">
        <h2 id="al-prefs" className="panel__title" style={{ margin: 0 }}>What to send me</h2>
        {EVENT_GROUPS.map((group) => (
          <fieldset key={group.title} className="al-group">
            <legend>{group.title}</legend>
            <ul className="al-list">
              {group.events.map(({ event, label }) => (
                <li key={event} className="al-row">
                  <span>{label}</span>
                  <span className="al-toggles">
                    {CHANNELS.map((c) => (
                      <label key={c}>
                        <input type="checkbox" checked={isEnabled(state.prefs, event, c)} onChange={(e) => void toggle(event, c, e.target.checked)} /> {CHANNEL_LABEL[c]}
                      </label>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
        <p className="al-hint">Help-request updates use the contact method you chose on each request. Messages to relatives (procession, thank-yous) also need their agreement, which you confirm when adding their number.</p>
      </section>

      <section className="card stack" aria-labelledby="al-outbox">
        <div className="al-head">
          <h2 id="al-outbox" className="panel__title" style={{ margin: 0 }}>Outbox</h2>
          <span className="al-actions">
            <button className="btn btn--outline btn--sm" type="button" onClick={() => void simulateStopReply('sms', user.phone).then(setState)}>Simulate STOP on SMS</button>
            <button className="btn btn--outline btn--sm" type="button" onClick={() => void clearAlertOutbox().then(setState)}>Clear</button>
          </span>
        </div>
        {stopped.length > 0 && <p className="al-hint">Stopped: {stopped.join(', ')}</p>}
        {state.outbox.length === 0 ? (
          <p className="muted">Nothing yet. Turn on an alert and trigger it, for example by sending a help request.</p>
        ) : (
          <ul className="al-list">
            {state.outbox.map((r) => (
              <li key={r.id} className="al-item">
                <div className="al-item__top">
                  <strong>{EVENT_LABEL[r.event]}</strong>
                  <StatusChip tone={TONE[r.status]}>{r.status}</StatusChip>
                </div>
                <p className="al-meta">
                  {CHANNEL_LABEL[r.channel]} to {formatPhone(r.to)} · {timeFmt.format(new Date(r.createdAt))}
                  {r.reason ? ` · ${r.reason}` : ''}
                  {r.sendAfter ? ` until ${timeFmt.format(new Date(r.sendAfter))}` : ''}
                </p>
                <p className="al-body">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
