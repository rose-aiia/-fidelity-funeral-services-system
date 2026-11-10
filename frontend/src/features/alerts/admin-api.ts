import { env } from '@/lib/env'
import { del, get, post } from '@/lib/http'

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'AWAITING_SCAN' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'

export interface WhatsAppConnection {
  status: ConnectionStatus
  phone: string | null
  qrCode: string | null
  pairingCode: string | null
  qrExpiresAt: string | null
  pairingExpiresAt: string | null
  connectedAt: string | null
  errorMessage: string | null
}

export interface MessagingOverview {
  bridgeReachable: boolean
  connection: WhatsAppConnection
  whatsappEnabled: boolean
  sms: { provider?: 'africastalking' | 'twilio' | 'log'; senderId?: string }
  credentials: { mode: 'live' | 'log'; africastalking: boolean; twilio: boolean }
}

const mockServer = () => import('./admin-mock')

interface LiveConnection { bridge: { reachable: boolean }; connection: WhatsAppConnection | null }

export async function getOverview(): Promise<MessagingOverview> {
  if (env.useMock) return (await mockServer()).overview()
  const [conn, settings, sms] = await Promise.all([
    get<LiveConnection>('/admin/whatsapp/connection'),
    get<{ settings: { enabled: boolean } }>('/admin/whatsapp/settings'),
    get<{ settings: MessagingOverview['sms']; credentials: MessagingOverview['credentials'] }>('/admin/sms'),
  ])
  const empty: WhatsAppConnection = { status: 'DISCONNECTED', phone: null, qrCode: null, pairingCode: null, qrExpiresAt: null, pairingExpiresAt: null, connectedAt: null, errorMessage: null }
  return {
    bridgeReachable: conn.bridge.reachable,
    connection: conn.connection ?? empty,
    whatsappEnabled: settings.settings.enabled,
    sms: sms.settings,
    credentials: sms.credentials,
  }
}

export async function startPairing(mode: 'qr' | 'pairing', phone?: string): Promise<void> {
  if (env.useMock) return (await mockServer()).start(mode, phone)
  await post('/admin/whatsapp/connection', mode === 'pairing' ? { mode, phone } : { mode })
}

export async function reconnect(): Promise<void> {
  if (env.useMock) return (await mockServer()).reconnect()
  await post('/admin/whatsapp/connection/reconnect', {})
}

export async function disconnect(): Promise<void> {
  if (env.useMock) return (await mockServer()).disconnect()
  await del('/admin/whatsapp/connection')
}

export async function setWhatsAppEnabled(enabled: boolean): Promise<void> {
  if (env.useMock) return (await mockServer()).setEnabled(enabled)
  await fetchPut('/admin/whatsapp/settings', { enabled })
}

export async function saveSms(settings: MessagingOverview['sms']): Promise<void> {
  if (env.useMock) return (await mockServer()).saveSms(settings)
  await fetchPut('/admin/sms', settings)
}

export async function testSms(provider: 'africastalking' | 'twilio'): Promise<{ ok: boolean; message: string }> {
  if (env.useMock) return (await mockServer()).testSms(provider)
  return post<{ ok: boolean; message: string }>('/admin/sms/test', { provider })
}

/** lib/http has no put(); settings endpoints are PUT. */
async function fetchPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
}
