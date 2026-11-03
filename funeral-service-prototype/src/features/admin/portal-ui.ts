import type { StatusTone } from '@/components/ui/StatusChip'
import type { AssignmentStatus, RequestStatus } from '@/features/account/data'
import { useAuth } from '@/features/auth'
import type { OrderStatus } from '@/features/marketplace/data'
import type { RequestAction } from './data'

export type PortalRole = 'admin' | 'provider'

/** Who is using the portal. The route guard guarantees it is one of the two. */
export function usePortalRole(): PortalRole {
  return useAuth().user?.role === 'provider' ? 'provider' : 'admin'
}

export const requestStatusDisplay: Record<RequestStatus, { label: string; tone: StatusTone }> = {
  received: { label: 'New', tone: 'warning' },
  assigned: { label: 'Assigned', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'info' },
  complete: { label: 'Complete', tone: 'success' },
}

export const assignmentDisplay: Record<AssignmentStatus, { label: string; tone: StatusTone }> = {
  assigned: { label: 'Waiting for an answer', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'info' },
  declined: { label: 'Declined', tone: 'danger' },
  completed: { label: 'Completed', tone: 'success' },
}

/** What an order action is called on a button. */
export const orderActionLabel: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_failed: 'Payment failed',
  paid: 'Paid',
  confirmed: 'Confirm order',
  in_progress: 'Start preparing',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
}

export const requestActionLabel: Record<Exclude<RequestAction, 'assign'>, string> = {
  accepted: 'Accept this request',
  declined: 'Decline',
  completed: 'Mark complete',
}
