/** Protocoles attachés à un client pour la séance du jour. */

export type ClientDayProtocol = {
  clientId: number;
  clientName: string;
  protocolNumber: number;
  protocolTitle: string;
  date: string; // YYYY-MM-DD
  attachedAt: string;
};

const KEY = "campus-client-day-protocols-v1";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function loadAll(): ClientDayProtocol[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(list: ClientDayProtocol[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function attachProtocolToClient(input: {
  clientId: number;
  clientName: string;
  protocolNumber: number;
  protocolTitle: string;
  date?: string;
}): ClientDayProtocol {
  const date = input.date ?? todayIso();
  const entry: ClientDayProtocol = {
    ...input,
    date,
    attachedAt: new Date().toISOString(),
  };
  const rest = loadAll().filter(
    (e) => !(e.clientId === entry.clientId && e.date === entry.date && e.protocolNumber === entry.protocolNumber),
  );
  saveAll([entry, ...rest]);
  return entry;
}

export function listClientDayProtocols(clientId: number, date = todayIso()): ClientDayProtocol[] {
  return loadAll().filter((e) => e.clientId === clientId && e.date === date);
}

export function clearClientDayProtocol(clientId: number, protocolNumber: number, date = todayIso()) {
  saveAll(loadAll().filter((e) => !(e.clientId === clientId && e.date === date && e.protocolNumber === protocolNumber)));
}
