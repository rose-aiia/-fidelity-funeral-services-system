export type WhatsAppSocketHealth = {
  activeSessions: number;
  connectedSessions: number;
  disconnectedSessions: number;
};

export function summarizeWhatsAppSockets(isOpen: readonly boolean[]): WhatsAppSocketHealth {
  const connectedSessions = isOpen.filter(Boolean).length;
  return {
    activeSessions: isOpen.length,
    connectedSessions,
    disconnectedSessions: isOpen.length - connectedSessions,
  };
}
