/** Journal de pratique ventouses (local) — suivi débutant / formation. */

export type ProtocolPracticeEntry = {
  id: string;
  protocolNumber: number;
  protocolTitle: string;
  createdAt: string;
  beforeFeeling: number;
  afterFeeling: number;
  durationMinutes: number;
  notes: string;
  materialChecked: string[];
  stepsDone: string[];
};

const KEY = "campus-protocol-practice-log-v1";

function readAll(): ProtocolPracticeEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: ProtocolPracticeEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 80)));
}

export function listProtocolPractice(protocolNumber?: number): ProtocolPracticeEntry[] {
  const all = readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (protocolNumber == null) return all;
  return all.filter((e) => e.protocolNumber === protocolNumber);
}

export function saveProtocolPractice(entry: Omit<ProtocolPracticeEntry, "id" | "createdAt"> & { id?: string }) {
  const all = readAll();
  const full: ProtocolPracticeEntry = {
    ...entry,
    id: entry.id || `pp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeAll([full, ...all]);
  return full;
}

export function deleteProtocolPractice(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}
