import { useCallback, useEffect, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import { Callout } from '@/components/ui/Callout'
import { StatusChip } from '@/components/ui/StatusChip'
import { TextField } from '@/components/ui/TextField'
import { env } from '@/lib/env'
import { formatPhone } from '@/lib/phone'
import { disconnect, getOverview, reconnect, saveSms, setWhatsAppEnabled, startPairing, testSms, type ConnectionStatus, type MessagingOverview } from './admin-api'
import './alerts.css'

const TONE: Record<ConnectionStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  CONNECTED: 'success', CONNECTING: 'neutral', RECONNECTING: 'warning', AWAITING_SCAN: 'warning', DISCONNECTED: 'neutral', ERROR: 'danger',
}
const LABEL: Record<ConnectionStatus, string> = {
  CONNECTED: 'Connected', CONNECTING: 'Connecting', RECONNECTING: 'Reconnecting', AWAITING_SCAN: 'Waiting for scan', DISCONNECTED: 'Not connected', ERROR: 'Error',
}

function Qr({ value }: { value: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, { margin: 1, width: 240 }).then((url) => { if (live) setSrc(url) }).catch(() => { if (live) setSrc('') })
    return () => { live = false }
  }, [value])
  return src ? <img src={src} width={240} height={240} alt="WhatsApp pairing QR code" /> : <p className="muted">Preparing the QR code…</p>
}

export default function MessagingPage() {
  const [data, setData] = useState<MessagingOverview | null>(null)
  const [error, setError] = useState('')
  const [pairPhone, setPairPhone] = useState('')
  // null means "not edited yet": show the saved value without copying it into state in an effect.
  const [senderEdit, setSenderEdit] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const refresh = useCallback(() => {
    getOverview().then((o) => { setData(o); setError('') }).catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => { refresh() }, [refresh])
  // The bridge writes QR and status changes to the database; poll while a scan is pending.
  const status = data?.connection.status
  useEffect(() => {
    if (status !== 'AWAITING_SCAN' && status !== 'CONNECTING' && status !== 'RECONNECTING') return
    const t = window.setInterval(refresh, 2000)
    return () => window.clearInterval(t)
  }, [status, refresh])

  async function run(action: () => Promise<unknown>) {
    setNote('')
    try { await action(); refresh() } catch (e) { setError((e as Error).message) }
  }

  async function pair(e: FormEvent) {
    e.preventDefault()
    await run(() => startPairing('pairing', pairPhone.trim()))
  }

  async function simulateScan() {
    const { simulateScan: scan } = await import('./admin-mock')
    scan()
    refresh()
  }

  if (error && !data) return <div className="page-stack"><Callout tone="danger" role="alert">{error}</Callout></div>
  if (!data) return <p className="muted">Loading…</p>

  const c = data.connection
  const senderId = senderEdit ?? data.sms.senderId ?? ''
  return (
    <div className="page-stack al-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Messaging</p>
        <h1>WhatsApp and SMS sending</h1>
        <p className="muted" style={{ maxWidth: '72ch' }}>
          Alerts go out from one company WhatsApp number and one SMS provider. Pair the number here, switch sending on or off, and check the SMS provider.
        </p>
      </header>

      {env.useMock && (
        <Callout tone="warning">
          <strong>Demonstration only.</strong> Nothing connects to WhatsApp or an SMS provider. &ldquo;Simulate scan&rdquo; stands in for scanning the code on a phone.
        </Callout>
      )}
      {!data.bridgeReachable && <Callout tone="danger" role="alert">The WhatsApp bridge is not running, so the number cannot be paired or used. Start it and refresh.</Callout>}
      {error && <Callout tone="danger" role="alert">{error}</Callout>}

      <section className="card stack" aria-labelledby="ms-wa">
        <div className="al-head">
          <h2 id="ms-wa" className="panel__title" style={{ margin: 0 }}>WhatsApp number</h2>
          <StatusChip tone={TONE[c.status]}>{LABEL[c.status]}</StatusChip>
        </div>

        {c.status === 'CONNECTED' && <p>Sending from <strong>{c.phone ? formatPhone(c.phone) : 'the paired number'}</strong>.</p>}
        {c.errorMessage && <p className="al-hint">{c.errorMessage}</p>}

        {c.status === 'AWAITING_SCAN' && c.qrCode && (
          <div className="stack">
            <Qr value={c.qrCode} />
            <p className="al-hint">On the company phone: WhatsApp, Settings, Linked devices, Link a device. The code refreshes about every minute.</p>
          </div>
        )}
        {c.status === 'AWAITING_SCAN' && c.pairingCode && (
          <div className="stack">
            <p style={{ fontSize: '1.6rem', letterSpacing: '0.15em', fontWeight: 600 }}>{c.pairingCode}</p>
            <p className="al-hint">On the phone: Linked devices, Link a device, Link with phone number instead, then type this code. It expires in a minute.</p>
          </div>
        )}
        {env.useMock && c.status === 'AWAITING_SCAN' && (
          <div><button type="button" className="btn btn--outline btn--sm" onClick={() => void simulateScan()}>Simulate scan</button></div>
        )}

        <div className="al-actions">
          {c.status === 'DISCONNECTED' || c.status === 'ERROR' ? (
            <button type="button" className="btn btn--primary btn--sm" disabled={!data.bridgeReachable} onClick={() => void run(() => startPairing('qr'))}>Pair with QR code</button>
          ) : (
            <>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => void run(reconnect)}>Reconnect</button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => { if (window.confirm('Disconnect this number? It will need to be paired again before alerts can be sent.')) void run(disconnect) }}>Disconnect</button>
            </>
          )}
        </div>

        {(c.status === 'DISCONNECTED' || c.status === 'ERROR') && (
          <form className="af-form" onSubmit={(e) => void pair(e)} aria-label="Pair with a phone number">
            <TextField label="Or pair with a code" tag="Optional" hint="The company number, with its country code, for example +263771234567." value={pairPhone} onChange={setPairPhone} inputMode="tel" />
            <div><button type="submit" className="btn btn--outline btn--sm" disabled={!pairPhone.trim() || !data.bridgeReachable}>Get pairing code</button></div>
          </form>
        )}

        <label className="al-toggles" style={{ marginTop: 'var(--space-2)' }}>
          <input type="checkbox" checked={data.whatsappEnabled} onChange={(e) => void run(() => setWhatsAppEnabled(e.target.checked))} />
          WhatsApp sending is on
        </label>
        <p className="al-hint">Switching this off stops every WhatsApp message at once. Messages are marked failed, not queued, so nothing sends by surprise when it is switched back on.</p>
      </section>

      <section className="card stack" aria-labelledby="ms-sms">
        <h2 id="ms-sms" className="panel__title" style={{ margin: 0 }}>SMS provider</h2>
        <p className="al-hint">
          Provider keys are set on the server, never here. Africa&rsquo;s Talking: {data.credentials.africastalking ? 'keys found' : 'no keys'} · Twilio: {data.credentials.twilio ? 'keys found' : 'no keys'} · Mode: {data.credentials.mode}
        </p>
        <div className="field">
          <label htmlFor="ms-provider" className="field__label">Provider</label>
          <select id="ms-provider" className="select" value={data.sms.provider ?? ''} onChange={(e) => void run(() => saveSms({ ...data.sms, provider: (e.target.value || undefined) as MessagingOverview['sms']['provider'] }))}>
            <option value="">Automatic (Africa&rsquo;s Talking, then Twilio)</option>
            <option value="africastalking">Africa&rsquo;s Talking</option>
            <option value="twilio">Twilio</option>
            <option value="log">Log only (no messages sent)</option>
          </select>
        </div>
        <TextField label="Sender ID" tag="Optional" hint="Must be registered with the provider and the mobile networks." value={senderId} onChange={setSenderEdit} maxLength={32} />
        <div className="al-actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => void run(() => saveSms({ ...data.sms, senderId: senderId.trim() || undefined }))}>Save sender ID</button>
          {(['africastalking', 'twilio'] as const).map((p) => (
            <button key={p} type="button" className="btn btn--outline btn--sm" onClick={() => void testSms(p).then((r) => setNote(r.message))}>
              Test {p === 'twilio' ? 'Twilio' : 'Africa’s Talking'}
            </button>
          ))}
        </div>
        {note && <p role="status" className="al-hint">{note}</p>}
      </section>
    </div>
  )
}
