/**
 * E.164 gate — "+" then 8-15 digits, first digit non-zero. Good enough to
 * reject an obviously-wrong paste before it ever reaches WhatsApp; WhatsApp
 * itself (via the send attempt) is the real validator of whether a number
 * exists and has an account.
 */
const E164 = /^\+[1-9]\d{7,14}$/;

export function isValidPhone(value: string): boolean {
  return E164.test(value.trim());
}

/**
 * Strips the separators people type into phone fields (spaces, dashes,
 * dots, parentheses) and returns the number only if what's left is a
 * valid E.164 value — i.e. a value that can be matched against
 * a stored phone number exactly. Returns null for anything else (local "0771…"
 * format, too short/long, empty), so callers can treat null as "not a
 * phone-shaped identifier" rather than re-validating.
 */
export function normalizePhoneInput(value: string): string | null {
  const cleaned = value.trim().replace(/[\s().-]/g, "");
  return cleaned && isValidPhone(cleaned) ? cleaned : null;
}

/**
 * Baileys/WhatsApp JIDs are the number without the leading "+", suffixed
 * with the personal-chat domain. Only call this after isValidPhone().
 */
export function phoneToWhatsAppJid(phone: string): string {
  return `${phone.trim().replace(/^\+/, "")}@s.whatsapp.net`;
}

/**
 * Cleans and canonicalizes a WhatsApp JID by stripping device specifiers
 * (e.g. `263771234567:12@s.whatsapp.net` -> `263771234567@s.whatsapp.net`).
 */
export function cleanWhatsAppJid(jid: string): string {
  const trimmed = jid.trim().toLowerCase();
  const atIdx = trimmed.indexOf("@");
  if (atIdx === -1) return trimmed;
  const userPart = trimmed.slice(0, atIdx).split(":")[0];
  const domainPart = trimmed.slice(atIdx);
  return `${userPart}${domainPart}`;
}

/**
 * Checks whether a given JID is an individual WhatsApp user chat (not a group,
 * status broadcast, channel, or newsletter). Supports standard @s.whatsapp.net,
 * multi-device @lid (Linked Identity), and legacy @c.us JIDs.
 */
export function isWhatsAppUserJid(jid: string): boolean {
  if (!jid) return false;
  const cleaned = cleanWhatsAppJid(jid);
  return (
    (cleaned.endsWith("@s.whatsapp.net") || cleaned.endsWith("@lid") || cleaned.endsWith("@c.us")) &&
    !cleaned.includes("@g.us") &&
    !cleaned.includes("@broadcast") &&
    !cleaned.includes("@newsletter")
  );
}

/**
 * Converts a WhatsApp JID back to a normalized E.164 phone string (e.g. `+263771234567`).
 * If the user portion does not form a valid phone, returns whatever digits are present prefixed with `+`.
 */
export function whatsappJidToPhone(jid: string): string {
  const cleaned = cleanWhatsAppJid(jid);
  const userPart = cleaned.split("@")[0].replace(/\D/g, "");
  const formatted = `+${userPart}`;
  return isValidPhone(formatted) ? formatted : formatted;
}
