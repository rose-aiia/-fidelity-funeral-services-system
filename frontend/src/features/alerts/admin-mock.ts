// Simulated bridge for the staff Messaging page. Nothing here talks to WhatsApp: "pairing" produces a fake QR
// and a "Simulate scan" button flips the session to connected, so the flow can be shown without a phone.
import type { ConnectionStatus, MessagingOverview, WhatsAppConnection } from './admin-api'

const KEY = 'fidelity.mock.messaging'
const QR_MS = 60_000
const DEMO_PHONE = '+263770000000'

interface State {
  connection: WhatsAppConnection
  whatsappEnabled: boolean
  sms: MessagingOverview['sms']
}

const idle = (): WhatsAppConnection => ({
  status: 'DISCONNECTED', phone: null, qrCode: null, pairingCode: null, qrExpiresAt: null,
  pairingExpiresAt: null, connectedAt: null, errorMessage: null,
})

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* storage unavailable */ }
  return { connection: idle(), whatsappEnabled: true, sms: { provider: 'log' } }
}

function save(state: State) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
}

const code = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

export function overview(): MessagingOverview {
  const state = load()
  // A QR that was not scanned in time is replaced, as the real bridge does.
  const c = state.connection
  if (c.status === 'AWAITING_SCAN' && c.qrExpiresAt && new Date(c.qrExpiresAt) < new Date()) {
    state.connection = { ...c, qrCode: `https://example.invalid/demo-qr/${code(24)}`, qrExpiresAt: new Date(Date.now() + QR_MS).toISOString() }
    save(state)
  }
  return { bridgeReachable: true, connection: state.connection, whatsappEnabled: state.whatsappEnabled, sms: state.sms, credentials: { mode: 'log', africastalking: false, twilio: false } }
}

export function start(mode: 'qr' | 'pairing', phone?: string) {
  const state = load()
  const status: ConnectionStatus = 'AWAITING_SCAN'
  state.connection = mode === 'qr'
    ? { ...idle(), status, qrCode: `https://example.invalid/demo-qr/${code(24)}`, qrExpiresAt: new Date(Date.now() + QR_MS).toISOString() }
    : { ...idle(), status, pairingCode: `${code(4)}-${code(4)}`, pairingExpiresAt: new Date(Date.now() + QR_MS).toISOString(), phone: phone ?? null }
  save(state)
}

/** Stands in for the person scanning the QR or typing the pairing code on their phone. */
export function simulateScan() {
  const state = load()
  state.connection = { ...idle(), status: 'CONNECTED', phone: state.connection.phone ?? DEMO_PHONE, connectedAt: new Date().toISOString() }
  save(state)
}

export function reconnect() {
  const state = load()
  if (state.connection.status === 'CONNECTED') state.connection = { ...state.connection, status: 'CONNECTED', connectedAt: new Date().toISOString() }
  else state.connection = { ...idle(), status: 'AWAITING_SCAN', qrCode: `https://example.invalid/demo-qr/${code(24)}`, qrExpiresAt: new Date(Date.now() + QR_MS).toISOString() }
  save(state)
}

export function disconnect() {
  const state = load()
  state.connection = idle()
  save(state)
}

export function setEnabled(enabled: boolean) {
  const state = load()
  state.whatsappEnabled = enabled
  save(state)
}

export function saveSms(sms: MessagingOverview['sms']) {
  const state = load()
  state.sms = sms
  save(state)
}

export function testSms(provider: 'africastalking' | 'twilio') {
  return { ok: false, message: `Demonstration only: no ${provider === 'twilio' ? 'Twilio' : "Africa's Talking"} credentials are set, and nothing is contacted.` }
}
