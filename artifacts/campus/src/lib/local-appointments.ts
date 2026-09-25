/** RDV locaux — l’API pg-mem perd les données au redémarrage. */

const KEY = "campus-local-appointments-v1";

export type LocalAppointment = {
  id: number;
  clientId: number;
  clientName: string;
  title: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
  localOnly?: boolean;
};

function readAll(): LocalAppointment[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: LocalAppointment[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function listLocalAppointments() {
  return readAll().sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function nextLocalAppointmentId() {
  const ids = readAll().map((a) => a.id);
  const min = ids.length ? Math.min(...ids) : 0;
  return min < 0 ? min - 1 : -1;
}

export function upsertLocalAppointment(appt: LocalAppointment) {
  const list = readAll().filter((a) => a.id !== appt.id);
  list.push({ ...appt, localOnly: true });
  writeAll(list);
  return appt;
}

export function cancelLocalAppointment(id: number) {
  writeAll(
    readAll().map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a)),
  );
}

export function rescheduleLocalAppointment(id: number, startsAt: string, endsAt: string) {
  writeAll(
    readAll().map((a) => (a.id === id ? { ...a, startsAt, endsAt, status: "confirmed" as const } : a)),
  );
}

export function removeLocalAppointment(id: number) {
  writeAll(readAll().filter((a) => a.id !== id));
}

export function mergeAppointmentLists(api: any[], local: LocalAppointment[] = listLocalAppointments()) {
  const byId = new Map<number, any>();
  for (const a of api) byId.set(a.id, a);
  for (const a of local) {
    // Évite le doublon API + local (même client / même créneau)
    const dup = [...byId.values()].some(
      (x) =>
        Number(x.clientId) === Number(a.clientId) &&
        String(x.startsAt) === String(a.startsAt) &&
        x.status !== "cancelled",
    );
    if (dup) continue;
    if (!byId.has(a.id)) byId.set(a.id, a);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

/** RDV à venir à partir du début de aujourd’hui (non annulés). */
export function upcomingAppointments(list: any[], limit = 5) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return list
    .filter((a) => a.status !== "cancelled" && new Date(a.startsAt).getTime() >= t0)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, limit);
}
