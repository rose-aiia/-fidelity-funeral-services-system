import { notifyRequest } from '@/features/alerts/mock-triggers'
import { ApiError } from '@/lib/api-error'
import type { AssistanceRequest, NewRequest, Policy } from './data'
import { MESSAGE_MAX_LENGTH, REQUEST_KINDS } from './data'
import { demoPolicyLinks, findPolicyByNumber, findPolicyRecord, seedRequests } from './policy-records'

// The "server" behind account endpoints in mock mode. Per-user links and requests persist in localStorage.
// Loaded on demand (dynamic import) so it never ships in the path a live build runs.

const LINKS_KEY = 'fidelity.mock.policyLinks'
const REQUESTS_KEY = 'fidelity.mock.requestStore'
const MAX_LINK_ATTEMPTS = 5

const failedLinkAttempts = new Map<string, number>()

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the change only lasts for this page view.
  }
}

const links = (): Record<string, string> => ({ ...demoPolicyLinks, ...readJson<Record<string, string>>(LINKS_KEY, {}) })

export function getPolicy(userId: string): Policy | null {
  const number = links()[userId]
  return (number && findPolicyByNumber(number)) || null
}

export function linkPolicy(userId: string, policyNumber: string, idNumber: string): Policy {
  if ((failedLinkAttempts.get(userId) ?? 0) >= MAX_LINK_ATTEMPTS) {
    throw new ApiError(429, 'locked_out', 'Too many attempts')
  }

  const record = findPolicyRecord(policyNumber, idNumber)
  if (!record) {
    failedLinkAttempts.set(userId, (failedLinkAttempts.get(userId) ?? 0) + 1)
    throw new ApiError(422, 'policy_not_found', 'No policy matches those details')
  }

  failedLinkAttempts.delete(userId)
  writeJson(LINKS_KEY, { ...readJson<Record<string, string>>(LINKS_KEY, {}), [userId]: record.policy.number })
  return record.policy
}

/** Every request, by the user who made it. Seeded on first use; the staff portal changes them through here too. */
const readStore = (): Record<string, AssistanceRequest[]> =>
  readJson<Record<string, AssistanceRequest[]> | null>(REQUESTS_KEY, null) ?? seedRequests()

/** The internal note an administrator leaves for a provider is never shown to the family. */
function forFamily(request: AssistanceRequest): AssistanceRequest {
  if (!request.assignment) return request
  const { note: _note, ...assignment } = request.assignment
  return { ...request, assignment }
}

export function listRequests(userId: string): AssistanceRequest[] {
  return (readStore()[userId] ?? []).map(forFamily).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createRequest(userId: string, input: NewRequest): AssistanceRequest {
  const message = input.message.trim()
  const errors: Record<string, string> = {}
  if (!REQUEST_KINDS.some((kind) => kind.value === input.kind)) errors.kind = 'Choose what you need help with'
  if (message.length > MESSAGE_MAX_LENGTH) errors.message = `Keep your message under ${MESSAGE_MAX_LENGTH} characters`
  if (input.kind === 'general' && message.length < 10) errors.message = 'Tell us a little more so we can help'
  if (Object.keys(errors).length) throw new ApiError(422, 'validation_failed', 'The request is invalid', errors)

  const reference = `AR-${Math.floor(1100 + Math.random() * 8900)}`
  const request: AssistanceRequest = {
    id: reference.toLowerCase(),
    reference,
    kind: input.kind,
    message,
    contactPreference: input.contactPreference,
    status: 'received',
    createdAt: new Date().toISOString(),
  }

  const all = readStore()
  writeJson(REQUESTS_KEY, { ...all, [userId]: [request, ...(all[userId] ?? [])] })
  notifyRequest(userId, request, 'request.received')
  return request
}

// --- the staff portal reads and updates every family's requests (the mock server is one server) ---

export type OwnedRequest = { userId: string; request: AssistanceRequest }

export const listAllRequests = (): OwnedRequest[] =>
  Object.entries(readStore()).flatMap(([userId, requests]) => requests.map((request) => ({ userId, request })))

export function saveRequest(userId: string, request: AssistanceRequest): void {
  const all = readStore()
  writeJson(REQUESTS_KEY, {
    ...all,
    [userId]: (all[userId] ?? []).map((candidate) => (candidate.id === request.id ? request : candidate)),
  })
}
