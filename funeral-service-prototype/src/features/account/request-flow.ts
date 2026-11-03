// How a request moves once an administrator and a provider get involved. Pure: shared by the browser mock and
// scripts/mock-api.mjs. Only relative `.ts` imports (Node loads this file directly).
import type { AssignmentStatus, AssistanceRequest, RequestAssignment, RequestStatus } from './data.ts'

/** The progress a family sees, derived from what the provider has done. */
export function statusForAssignment(status: AssignmentStatus): RequestStatus {
  switch (status) {
    case 'assigned':
      return 'assigned'
    case 'accepted':
      return 'in_progress'
    case 'completed':
      return 'complete'
    case 'declined':
      return 'received'
  }
}

/** A family has lost someone and nobody has taken it on (never assigned, or the provider declined). */
export function isUrgent(request: Pick<AssistanceRequest, 'kind' | 'status'>): boolean {
  return request.kind === 'bereavement' && request.status === 'received'
}

export const isOpen = (request: Pick<AssistanceRequest, 'status'>): boolean => request.status !== 'complete'

/** Urgent first, then the rest of the open requests oldest first, then the finished ones. */
export function sortForTriage<T extends Pick<AssistanceRequest, 'kind' | 'status' | 'createdAt'>>(requests: T[]): T[] {
  const rank = (request: T) => (isUrgent(request) ? 0 : isOpen(request) ? 1 : 2)
  return [...requests].sort((a, b) => rank(a) - rank(b) || (rank(a) === 2 ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)))
}

export type FlowResult = { ok: true; request: AssistanceRequest } | { ok: false; code: 'invalid_transition' | 'already_complete' }

const iso = (time: number) => new Date(time).toISOString()

/** Hands a request to a provider (or to a different one). A finished request can't be reassigned. */
export function assignRequest(
  request: AssistanceRequest,
  provider: { id: string; name: string },
  note: string | undefined,
  now: number,
): FlowResult {
  if (request.status === 'complete') return { ok: false, code: 'already_complete' }
  const assignment: RequestAssignment = {
    providerId: provider.id,
    providerName: provider.name,
    status: 'assigned',
    assignedAt: iso(now),
    ...(note?.trim() && { note: note.trim() }),
  }
  return {
    ok: true,
    request: { ...request, status: statusForAssignment('assigned'), assignedTo: provider.name, assignment },
  }
}

const ALLOWED: Record<AssignmentStatus, AssignmentStatus[]> = {
  assigned: ['accepted', 'declined'],
  accepted: ['completed'],
  declined: [],
  completed: [],
}

/** A provider answers an assignment (accept or decline), or reports it done. */
export function respondToAssignment(
  request: AssistanceRequest,
  response: Exclude<AssignmentStatus, 'assigned'>,
  now: number,
): FlowResult {
  const assignment = request.assignment
  if (!assignment || !ALLOWED[assignment.status].includes(response)) return { ok: false, code: 'invalid_transition' }
  return {
    ok: true,
    request: {
      ...request,
      status: statusForAssignment(response),
      // A declined request is nobody's again, so the family isn't told someone is looking after it.
      assignedTo: response === 'declined' ? undefined : request.assignedTo,
      assignment: { ...assignment, status: response, respondedAt: iso(now) },
    },
  }
}

/** An administrator closes a request directly (for example one the family resolved by phone). */
export function completeRequest(request: AssistanceRequest, now: number): FlowResult {
  if (request.status === 'complete') return { ok: false, code: 'already_complete' }
  const assignment = request.assignment
  return {
    ok: true,
    request: {
      ...request,
      status: 'complete',
      ...(assignment && { assignment: { ...assignment, status: 'completed' as const, respondedAt: iso(now) } }),
    },
  }
}

/** The assignment decisions a provider can make right now, for showing the right buttons. */
export const providerActions = (request: Pick<AssistanceRequest, 'assignment'>): Exclude<AssignmentStatus, 'assigned'>[] =>
  request.assignment ? (ALLOWED[request.assignment.status] as Exclude<AssignmentStatus, 'assigned'>[]) : []
