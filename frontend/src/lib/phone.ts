// Pure phone helpers shared by the app and scripts/mock-api.mjs (so no imports).

/** Normalises a Zimbabwean mobile number to E.164 (`+2637XXXXXXXX`), or returns null if it isn't one. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '')
  const match = /^(?:\+?263|0)?(7\d{8})$/.exec(digits)
  return match ? `+263${match[1]}` : null
}

/**
 * Normalises a number for alert delivery. Zimbabwean numbers may be entered locally (`0771234567`);
 * anything else must carry an explicit `+` country code (8-15 digits, E.164) so diaspora relatives work.
 */
export function normaliseInternationalPhone(raw: string): string | null {
  const local = normalisePhone(raw)
  if (local) return local
  const compact = raw.replace(/[\s\-().]/g, '')
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null
}

/** `+263771234567` -> `+263 77 123 4567`. Falls back to the input for anything unexpected. */
export function formatPhone(e164: string): string {
  const match = /^\+263(\d{2})(\d{3})(\d{4})$/.exec(e164)
  return match ? `+263 ${match[1]} ${match[2]} ${match[3]}` : e164
}

/** `+263771234567` -> `+263 77 ••• 4567`, for showing a number without exposing all of it. */
export function maskPhone(e164: string): string {
  const match = /^\+263(\d{2})(\d{3})(\d{4})$/.exec(e164)
  return match ? `+263 ${match[1]} ••• ${match[3]}` : e164
}
