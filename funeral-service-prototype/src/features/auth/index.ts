// Public surface of the auth feature; other features import from here, not from its internals.
export { AuthProvider } from './AuthProvider'
export {
  PRIVATE_QUERY_ROOT,
  useDemoSignIn,
  useRequestOtp,
  useSignIn,
  useSignOut,
  useSignUp,
  useUpdateProfile,
} from './queries'
export { RequireAuth } from './RequireAuth'
export { useAuth } from './useAuth'
export { useSignOutAndLeave } from './useSignOutAndLeave'
export { demoPersonas, DEMO_OTP } from './demo'
export type { DemoPersona } from './demo'
export type { Language, ProfileUpdate, Role, User } from './types'
export { formatPhone, isEmail, normalisePhone, safeNextPath } from './validation'
// Mock mode only: lets the mock account server know who is signed in. Live mode uses the session cookie.
export { readSessionUser } from './session'
