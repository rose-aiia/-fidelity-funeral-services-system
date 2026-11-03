// Pure helpers shared by the app, its tests and scripts/mock-api.mjs (so no imports).

/** Normalises a Zimbabwean mobile number to E.164 (`+2637XXXXXXXX`), or returns null if it isn't one. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '')
  const match = /^(?:\+?263|0)?(7\d{8})$/.exec(digits)
  return match ? `+263${match[1]}` : null
}

export function isOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

/** `+263771234567` -> `+263 77 123 4567`. Falls back to the input for anything unexpected. */
export function formatPhone(e164: string): string {
  const match = /^\+263(\d{2})(\d{3})(\d{4})$/.exec(e164)
  return match ? `+263 ${match[1]} ${match[2]} ${match[3]}` : e164
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Only same-site paths may be used as a post-login destination (blocks `//evil.example` redirects). */
export function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  return raw
}
