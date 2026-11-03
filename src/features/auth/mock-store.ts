import { ApiError } from '@/lib/api-error'
import { demoUsers, DEMO_OTP } from './demo'
import type { ProfileUpdate, SignInInput, SignUpInput, User } from './types'
import { isEmail, isOtpCode, normalisePhone } from './validation'

// The "server" behind mock mode: registered users live in localStorage next to the built-in demo users.
// Loaded on demand (dynamic import) so it never ships in the path a live build runs.

const USERS_KEY = 'fidelity.mock.users'
const MAX_OTP_ATTEMPTS = 5

const failedAttempts = new Map<string, number>()

function readRegistered(): User[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as User[]) : []
  } catch {
    return []
  }
}

function writeRegistered(users: User[]): void {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // Storage unavailable: the new account only lasts for this page view.
  }
}

const allUsers = (): User[] => [...demoUsers, ...readRegistered()]

const invalid = (details: Record<string, string>) =>
  new ApiError(422, 'validation_failed', 'The request is invalid', details)

function requirePhone(raw: string): string {
  const phone = normalisePhone(raw)
  if (!phone) throw invalid({ phone: 'Enter a Zimbabwean mobile number' })
  return phone
}

function checkOtp(phone: string, code: string): void {
  if ((failedAttempts.get(phone) ?? 0) >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, 'locked_out', 'Too many attempts')
  }
  if (!isOtpCode(code) || code !== DEMO_OTP) {
    failedAttempts.set(phone, (failedAttempts.get(phone) ?? 0) + 1)
    throw new ApiError(401, 'otp_invalid', 'The code is not valid')
  }
  failedAttempts.delete(phone)
}

export function requestOtp(rawPhone: string): void {
  const phone = requirePhone(rawPhone)
  if ((failedAttempts.get(phone) ?? 0) >= MAX_OTP_ATTEMPTS) {
    throw new ApiError(429, 'locked_out', 'Too many attempts')
  }
}

export function signIn({ phone: rawPhone, code }: SignInInput): User {
  const phone = requirePhone(rawPhone)
  const user = allUsers().find((candidate) => candidate.phone === phone)
  checkOtp(phone, code)
  if (!user) throw new ApiError(404, 'account_not_found', 'No account for that number')
  return user
}

export function signUp({ name, phone: rawPhone, code, email }: SignUpInput): User {
  const phone = requirePhone(rawPhone)
  const errors: Record<string, string> = {}
  if (name.trim().length < 2) errors.name = 'Enter your full name'
  if (email && !isEmail(email)) errors.email = 'Enter a valid email address'
  if (Object.keys(errors).length) throw invalid(errors)

  checkOtp(phone, code)
  if (allUsers().some((candidate) => candidate.phone === phone)) {
    throw new ApiError(409, 'account_exists', 'An account already exists')
  }

  const user: User = {
    id: `u-${Date.now().toString(36)}`,
    name: name.trim(),
    phone,
    ...(email && { email: email.trim() }),
    role: 'customer',
    language: 'en',
  }
  writeRegistered([...readRegistered(), user])
  return user
}

export function findUser(id: string): User | undefined {
  return allUsers().find((candidate) => candidate.id === id)
}

export function updateProfile(userId: string, update: ProfileUpdate): User {
  const errors: Record<string, string> = {}
  if (update.name.trim().length < 2) errors.name = 'Enter your full name'
  if (update.email && !isEmail(update.email)) errors.email = 'Enter a valid email address'
  if (Object.keys(errors).length) throw invalid(errors)

  const existing = findUser(userId)
  if (!existing) throw new ApiError(401, 'unauthenticated', 'Not signed in')

  const next: User = {
    ...existing,
    name: update.name.trim(),
    language: update.language,
    email: update.email?.trim() || undefined,
  }
  // Demo users are built in, so only registered users persist profile edits.
  writeRegistered(readRegistered().map((candidate) => (candidate.id === userId ? next : candidate)))
  return next
}
