/**
 * Client for the WhatsApp bridge's localhost control server. The API uses it to proxy admin commands to the
 * long-running Baileys process. The secret never reaches the browser.
 */
import { env } from '../config/env'

const BASE_URL = `http://127.0.0.1:${env.alerts.whatsapp.bridgePort}`

async function callBridge(
  path: string, method: 'GET' | 'POST', body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.alerts.whatsapp.bridgeSecret}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    })
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) }
  } catch {
    return { ok: false, status: 503, data: { error: 'Bridge unavailable' } }
  }
}

export const bridgeStart = (mode: 'qr' | 'pairing', phone?: string) => callBridge('/session/start', 'POST', { mode, phone })
/** Reopen the socket on the saved credentials; does not unlink the phone. */
export const bridgeReconnect = () => callBridge('/session/reconnect', 'POST')
export const bridgeStop = (purge = true) => callBridge('/session/stop', 'POST', { purge })
export const bridgeStatus = () => callBridge('/session/status', 'GET')
export const bridgeHealth = () => callBridge('/health', 'GET')
export const isBridgeConfigured = () => Boolean(env.alerts.whatsapp.bridgeSecret)
