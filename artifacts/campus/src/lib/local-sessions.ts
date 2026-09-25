/** Persistance locale des sessions — l’API utilise pg-mem (perdu au redémarrage). */

const KEY = "campus-local-sessions-v1";

export type LocalSession = {
  id: number;
  clientId: number;
  clientName: string;
  occurredAt: string;
  durationMinutes: number;
  beforeFeeling: number;
  afterFeeling: number;
  mobilityBefore?: number;
  mobilityAfter?: number;
  zones: Array<{
    zoneId: number;
    label: string;
    technique: string;
    intensity: number;
    durationMinutes: number;
    note: string;
  }>;
  techniques: string[];
  observations: string;
  practitionerRecommendations: string;
  /** Tarif séance (€) — alimente le CA du mois */
  price?: number;
  localOnly?: boolean;
};

function readAll(): LocalSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: LocalSession[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
}

export function listLocalSessions(): LocalSession[] {
  return readAll().sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function getLocalSession(id: number): LocalSession | undefined {
  return readAll().find((s) => s.id === id);
}

export function upsertLocalSession(session: LocalSession) {
  const list = readAll().filter((s) => s.id !== session.id);
  list.unshift(session);
  writeAll(list);
}

export function deleteLocalSession(id: number) {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function nextLocalSessionId(): number {
  const ids = readAll().map((s) => s.id);
  const min = ids.length ? Math.min(...ids) : 0;
  return min < 0 ? min - 1 : -1;
}

/** Fusionne API + local (priorité API si même id). */
export function mergeSessionLists(apiSessions: any[], localSessions: LocalSession[] = listLocalSessions()) {
  const byId = new Map<number, any>();
  for (const s of localSessions) byId.set(s.id, s);
  for (const s of apiSessions) byId.set(s.id, s);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}
