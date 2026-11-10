import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type WhatsAppEventType =
  | "INBOUND"
  | "OUTBOUND"
  | "COMMAND"
  | "LINK"
  | "UNLINK"
  | "SESSION"
  | "QUEUE"
  | "IGNORED"
  | "SETTINGS"
  | "OPT_OUT";

export type WhatsAppEventStatus =
  | "RECEIVED"
  | "REPLIED"
  | "FAILED"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING"
  | "AWAITING_SCAN"
  | "QR_REQUESTED"
  | "PAIRING_REQUESTED"
  | "ENQUEUED"
  | "SENT"
  | "RETRIED"
  | "IGNORED_GROUP"
  | "IGNORED_BROADCAST"
  | "IGNORED_SELF"
  | "IGNORED_DUPLICATE"
  | "IGNORED_DISABLED"
  | "ENABLED"
  | "DISABLED"
  | "STOP"
  | "START"
  | "PARTIAL_FAILED";

export interface LogWhatsAppEventParams {
  type: WhatsAppEventType;
  status: WhatsAppEventStatus | string;
  phone?: string | null;
  jid?: string | null;
  details?: string | null;
  metadata?: Record<string, unknown> | null;
  latencyMs?: number | null;
}

/**
 * Masks 6-character link codes and pairing codes from public log text
 */
function maskCodes(text?: string | null): string | null {
  if (!text) return null;
  // Mask 6-char alpha-numeric OTP link codes
  let sanitized = text.replace(/\b([A-Z0-9]{2})[A-Z0-9]{4}\b/g, "$1****");
  // Mask pairing codes like XXXX-XXXX
  sanitized = sanitized.replace(/\b([A-Z0-9]{2})[A-Z0-9]{2}-([A-Z0-9]{2})[A-Z0-9]{2}\b/g, "$1**-$2**");
  return sanitized;
}

/**
 * Sanitizes metadata so that no base64 image bytes, pairing codes, or secrets are persisted
 */
function sanitizeMetadata(meta?: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!meta) return null;
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(meta)) {
    if (k === "image" || k === "data" || (typeof v === "string" && v.length > 500 && /base64/i.test(v))) {
      out[k] = "[redacted_binary]";
    } else if (k === "pairingCode" || k === "code" || k === "linkCode") {
      out[k] = typeof v === "string" ? maskCodes(v) : "***";
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      out[k] = sanitizeMetadata(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }

  return out;
}

/**
 * Persists an event to the whatsapp_events table.
 * Log failures are safely caught and will NEVER throw or break caller execution.
 */
export async function logWhatsAppEvent(params: LogWhatsAppEventParams): Promise<void> {
  try {
    const details = maskCodes(params.details);
    const metadata = sanitizeMetadata(params.metadata);

    await prisma.whatsAppEvent.create({
      data: {
        type: params.type,
        status: params.status,
        phone: params.phone,
        jid: params.jid,
        details,
        metadata: metadata as Prisma.InputJsonValue,
        latencyMs: params.latencyMs !== undefined ? params.latencyMs : null,
      },
    });
  } catch (err) {
    // Failure to log an audit event must never fail the user request
    console.warn("[whatsapp/events] Failed to record event:", err instanceof Error ? err.message : err);
  }
}
