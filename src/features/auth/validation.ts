// Pure helpers shared by the app, its tests and scripts/mock-api.mjs (so only relative `.ts` imports).

export { formatPhone, normalisePhone } from '../../lib/phone.ts'

export function isOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Only same-site paths may be used as a post-login destination (blocks `//evil.example` redirects). */
export function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  return raw
}
