/**
 * Lien séances → factures (style Milo : facturer depuis le planning / les séances).
 */

const BILLED_KEY = "campus-billed-sessions-v1";

export type BillableSession = {
  id: number;
  clientId: number;
  clientName: string;
  occurredAt: string;
  durationMinutes: number;
  zones?: Array<{ label?: string; technique?: string }>;
  observations?: string;
};

function readBilled(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BILLED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeBilled(map: Record<string, string>) {
  localStorage.setItem(BILLED_KEY, JSON.stringify(map));
}

export function isSessionBilled(sessionId: number) {
  return Boolean(readBilled()[String(sessionId)]);
}

export function markSessionBilled(sessionId: number, invoiceId: string) {
  const map = readBilled();
  map[String(sessionId)] = invoiceId;
  writeBilled(map);
}

export function markSessionsBilled(sessionIds: number[], invoiceId: string) {
  const map = readBilled();
  for (const id of sessionIds) map[String(id)] = invoiceId;
  writeBilled(map);
}

export function listUnbilledSessions(sessions: BillableSession[]) {
  return sessions.filter((s) => !isSessionBilled(s.id));
}

/** Libellé prestation à partir des zones (équivalent Bodymap → cotation Milo). */
export function serviceLabelFromSession(session: BillableSession, fallback = "Séance de thérapie par ventouses") {
  const zones = (session.zones || []).map((z) => z.label).filter(Boolean);
  if (zones.length === 0) return fallback;
  if (zones.length === 1) return `${fallback} — ${zones[0]}`;
  return `${fallback} — ${zones.slice(0, 3).join(", ")}${zones.length > 3 ? "…" : ""}`;
}
