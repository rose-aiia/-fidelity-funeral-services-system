import { ApiError } from '@/lib/api-error'
import { env } from '@/lib/env'
import { get, patch, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import { demoPersonas } from './demo'
import { readSessionUser, writeSessionUser } from './session'
import type { OtpReceipt, ProfileUpdate, SignInInput, SignUpInput, User } from './types'

const MOCK_LATENCY_MS = 450
const OTP_TTL_SECONDS = 300

// The mock "server" is loaded lazily; a live build never fetches it.
const mockServer = () => import('./mock-store')

export async function requestOtp(phone: string): Promise<OtpReceipt> {
  if (!env.useMock) return post<OtpReceipt>('/auth/otp', { phone })
  const server = await mockServer()
  server.requestOtp(phone)
  return mockResponse({ expiresInSeconds: OTP_TTL_SECONDS }, MOCK_LATENCY_MS)
}

export async function signIn(input: SignInInput): Promise<User> {
  if (!env.useMock) return post<User>('/auth/signin', input)
  const server = await mockServer()
  const user = server.signIn(input)
  writeSessionUser(user)
  return mockResponse(user, MOCK_LATENCY_MS)
}

export async function signUp(input: SignUpInput): Promise<User> {
  if (!env.useMock) return post<User>('/auth/signup', input)
  const server = await mockServer()
  const user = server.signUp(input)
  writeSessionUser(user)
  return mockResponse(user, MOCK_LATENCY_MS)
}

export async function signOut(): Promise<void> {
  if (!env.useMock) return post<void>('/auth/signout', undefined)
  writeSessionUser(null)
}

/** The signed-in user, or null when there is no session. A missing session is a normal answer, not an error. */
export async function getMe(signal?: AbortSignal): Promise<User | null> {
  if (env.useMock) return readSessionUser()
  try {
    return await get<User>('/me', { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function updateProfile(update: ProfileUpdate): Promise<User> {
  if (!env.useMock) return patch<User>('/me', update)
  const current = readSessionUser()
  if (!current) throw new ApiError(401, 'unauthenticated', 'Not signed in')
  const server = await mockServer()
  const user = server.updateProfile(current.id, update)
  writeSessionUser(user)
  return mockResponse(user, MOCK_LATENCY_MS)
}

/** Demo shortcut: skips the one-time code. Exists only in mock mode. */
export async function signInAsPersona(personaId: string): Promise<User> {
  const persona = demoPersonas.find((candidate) => candidate.user.id === personaId)
  if (!env.useMock || !persona) throw new ApiError(404, 'not_found', 'No such demo persona')
  writeSessionUser(persona.user)
  return mockResponse(persona.user, 350)
}
