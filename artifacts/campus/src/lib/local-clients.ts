/** Clients locaux — fallback si l’API est indisponible. */

const KEY = "campus-local-clients-v1";

export type LocalClient = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  status: "active" | "archived";
  avatarColor: string;
  sessionsCount: number;
  lastSessionAt: string | null;
  nextAppointmentAt: string | null;
  createdAt: string;
  localOnly?: boolean;
};

function readAll(): LocalClient[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: LocalClient[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

const COLORS = ["#D9A36A", "#79A9A2", "#8B9DC3", "#C4A484", "#9B8EA8"];

export function listLocalClients() {
  return readAll()
    .filter((c) => c.status !== "archived")
    .sort((a, b) => a.lastName.localeCompare(b.lastName, "fr"));
}

export function nextLocalClientId() {
  const ids = readAll().map((c) => c.id);
  const min = ids.length ? Math.min(...ids) : 0;
  return min < 0 ? min - 1 : -1;
}

export function upsertLocalClient(client: LocalClient) {
  const list = readAll().filter((c) => c.id !== client.id);
  list.push({ ...client, localOnly: true });
  writeAll(list);
  return client;
}

export function archiveLocalClient(id: number) {
  writeAll(readAll().map((c) => (c.id === id ? { ...c, status: "archived" as const } : c)));
}

export function mergeClientLists(api: any[], local: LocalClient[] = listLocalClients()) {
  const byId = new Map<number, any>();
  for (const c of api) byId.set(Number(c.id), c);
  for (const c of local) {
    if (!byId.has(c.id)) byId.set(c.id, c);
  }
  return Array.from(byId.values());
}

export function createLocalClient(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}): LocalClient {
  const client: LocalClient = {
    id: nextLocalClientId(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || "",
    notes: data.notes || "",
    status: "active",
    avatarColor: COLORS[Math.abs(data.firstName.length + data.lastName.length) % COLORS.length]!,
    sessionsCount: 0,
    lastSessionAt: null,
    nextAppointmentAt: null,
    createdAt: new Date().toISOString(),
    localOnly: true,
  };
  return upsertLocalClient(client);
}

export function updateLocalClientFields(
  id: number,
  patch: Partial<Pick<LocalClient, "firstName" | "lastName" | "email" | "phone" | "notes">>,
) {
  const list = readAll();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx]!, ...patch, localOnly: true as const };
  list[idx] = next;
  writeAll(list);
  return next;
}
