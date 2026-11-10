// Mock-server side triggers: called by the mock stores right where a request or order changes state,
// the same place a real backend would call deliverAlert(). Never throws.
import * as authStore from '@/features/auth/mock-store'
import type { AssistanceRequest } from '@/features/account/data'
import type { Order, OrderStatus } from '@/features/marketplace/data'
import { formatUsd } from "@/lib/format"
import { dispatch } from './mock-store'
import type { PlanInput } from './rules'
import type { AlertChannel, AlertEvent } from './types'

const ORDER_EVENTS: Partial<Record<OrderStatus, AlertEvent>> = {
  paid: 'order.paid',
  confirmed: 'order.confirmed',
  delivered: 'order.delivered',
  payment_failed: 'order.payment_failed',
}

/** Help-request contact preference `call` has no alert channel, so those families are not messaged. */
const channelOf = (pref: AssistanceRequest['contactPreference']): AlertChannel | undefined =>
  pref === 'sms' || pref === 'whatsapp' ? pref : undefined

function safely(inputs: PlanInput[]) {
  try { dispatch(inputs) } catch { /* alerts must never break the action */ }
}

export function notifyRequest(userId: string, request: AssistanceRequest, event: AlertEvent): void {
  const user = authStore.findUser(userId)
  const channel = channelOf(request.contactPreference)
  if (!user || !channel) return
  safely([{
    event,
    recipient: { phone: user.phone, language: user.language, preferredChannel: channel },
    payload: { name: user.name.split(' ')[0], ref: request.reference, provider: request.assignment?.providerName ?? request.assignedTo },
    ref: `${request.id}:${event}`,
  }])
}

export function notifyOrder(userId: string, order: Pick<Order, 'id' | 'reference' | 'status' | 'total'>): void {
  const event = ORDER_EVENTS[order.status]
  const user = authStore.findUser(userId)
  if (!event || !user) return
  safely([{
    event,
    recipient: { phone: user.phone, language: user.language },
    payload: { name: user.name.split(' ')[0], ref: order.reference, amount: formatUsd(order.total) },
    ref: `${order.id}:${order.status}`,
  }])
}
