import { env } from '@/lib/env'
import { get, post } from '@/lib/http'
import type { PlanInput } from './rules'
import type { AlertChannel, AlertEvent, AlertRecord, AlertState } from './types'

const mockServer = () => import('./mock-store')

/** Sends (or, in mock mode, simulates) alerts. Never throws: an alert failure must not break the action that triggered it. */
export async function sendAlerts(inputs: PlanInput[]): Promise<AlertRecord[]> {
  if (inputs.length === 0) return []
  try {
    if (!env.useMock) return await post<AlertRecord[]>('/alerts/dispatch', { alerts: inputs })
    return (await mockServer()).dispatch(inputs)
  } catch {
    return []
  }
}

export async function getAlertState(): Promise<AlertState> {
  if (!env.useMock) return get<AlertState>('/alerts/state')
  const server = await mockServer()
  server.releaseDue()
  return server.getState()
}

export async function setAlertPref(event: AlertEvent, channel: AlertChannel, enabled: boolean): Promise<AlertState> {
  if (!env.useMock) return post<AlertState>('/alerts/preferences', { event, channel, enabled })
  return (await mockServer()).updatePref(event, channel, enabled)
}

export async function simulateStopReply(channel: AlertChannel, phone: string): Promise<AlertState> {
  return (await mockServer()).simulateStop(channel, phone)
}

export async function clearAlertOutbox(): Promise<AlertState> {
  return (await mockServer()).clearOutbox()
}
