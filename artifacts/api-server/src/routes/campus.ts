import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  campusAnatomyStructures,
  campusAppointments,
  campusBodyZones,
  campusClients,
  campusExercises,
  campusInvoices,
  campusNotifications,
  campusPrograms,
  campusSessions,
} from "@workspace/db";
import {
  ArchiveClientParams,
  CreateAppointmentBody,
  CreateClientBody,
  CreateExerciseBody,
  CreateInvoiceBody,
  CreateProgramBody,
  CreateSessionBody,
  CreateAppointmentResponse,
  CreateClientResponse,
  CreateExerciseResponse,
  CreateInvoiceResponse,
  CreateProgramResponse,
  CreateSessionResponse,
  DeleteExerciseParams,
  GetClientParams,
  GetClientResponse,
  GetDashboardActivityResponse,
  GetDashboardSummaryResponse,
  GetSessionParams,
  GetSessionResponse,
  GetSubscriptionResponse,
  ListAnatomyStructuresQueryParams,
  ListAnatomyStructuresResponse,
  ListAppointmentsQueryParams,
  ListAppointmentsResponse,
  ListBodyZonesResponse,
  ListClientsQueryParams,
  ListClientsResponse,
  ListExercisesQueryParams,
  ListExercisesResponse,
  ListInvoicesResponse,
  ListNotificationsResponse,
  ListProgramsResponse,
  ListSessionsQueryParams,
  ListSessionsResponse,
  MarkNotificationReadParams,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  UpdateAppointmentResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  UpdateExerciseParams,
  UpdateExerciseBody,
  UpdateExerciseResponse,
  UpdateProgramParams,
  UpdateProgramBody,
  UpdateProgramResponse,
  UpdateSessionParams,
  UpdateSessionBody,
  UpdateSessionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let seeded = false;

const now = () => new Date();
const isoInDays = (days: number, hour: number) => {
  const date = now();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};
const today = () => now().toISOString().slice(0, 10);

async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: campusClients.id }).from(campusClients).limit(1);
  if (existing.length === 0) {
    const clients = await db
      .insert(campusClients)
      .values([
        { firstName: "Camille", lastName: "Martin", email: "camille.martin@example.com", phone: "06 12 34 56 78", notes: "Suivi mobilité cervicale.", avatarColor: "#B7C9B8" },
        { firstName: "Thomas", lastName: "Bernard", email: "thomas.bernard@example.com", phone: "06 22 47 18 91", notes: "Retour au mouvement après une période sédentaire.", avatarColor: "#D8B69C" },
        { firstName: "Sarah", lastName: "Roux", email: "sarah.roux@example.com", phone: "06 43 11 82 09", notes: "Travail respiratoire et récupération.", avatarColor: "#B5C5D8" },
        { firstName: "Nicolas", lastName: "Petit", email: "nicolas.petit@example.com", phone: "06 55 28 74 10", notes: "Programme de mobilité générale.", avatarColor: "#D5C6A8" },
      ])
      .returning();
    const [camille, thomas, sarah, nicolas] = clients;
    await db.insert(campusAppointments).values([
      { clientId: camille.id, title: "Suivi mobilité", serviceName: "Séance corps entier", startsAt: isoInDays(0, 10), endsAt: isoInDays(0, 11), price: "65", status: "confirmed" },
      { clientId: thomas.id, title: "Bilan mouvement", serviceName: "Bilan initial", startsAt: isoInDays(0, 14), endsAt: isoInDays(0, 15), price: "75", status: "pending" },
      { clientId: sarah.id, title: "Récupération", serviceName: "Massage & mobilité", startsAt: isoInDays(1, 9), endsAt: isoInDays(1, 10), price: "65", status: "confirmed" },
      { clientId: nicolas.id, title: "Séance de suivi", serviceName: "Mobilité ciblée", startsAt: isoInDays(2, 16), endsAt: isoInDays(2, 17), price: "65", status: "confirmed" },
    ]);
    await db.insert(campusSessions).values([
      { clientId: camille.id, occurredAt: isoInDays(-7, 10), durationMinutes: 60, beforeFeeling: 4, afterFeeling: 7, mobilityBefore: 5, mobilityAfter: 8, zones: [{ zoneId: 1, label: "Trapèze supérieur droit", technique: "Ventouses", intensity: 5, durationMinutes: 8, note: "Tension importante" }], techniques: ["Ventouses", "Mobilité active"], observations: "Bonne réponse au travail de la ceinture scapulaire.", practitionerRecommendations: "Respiration lente et mobilité douce au quotidien." },
      { clientId: thomas.id, occurredAt: isoInDays(-14, 14), durationMinutes: 75, beforeFeeling: 6, afterFeeling: 5, mobilityBefore: 4, mobilityAfter: 6, zones: [{ zoneId: 2, label: "Hanche gauche", technique: "Travail manuel", intensity: 4, durationMinutes: 12, note: "Amplitude à observer" }], techniques: ["Travail manuel", "Respiration"], observations: "Mobilité perçue en progression.", practitionerRecommendations: "Programme de mobilité sur 7 jours." },
      { clientId: sarah.id, occurredAt: isoInDays(-21, 9), durationMinutes: 50, beforeFeeling: 5, afterFeeling: 8, mobilityBefore: 6, mobilityAfter: 8, zones: [{ zoneId: 3, label: "Zone thoracique", technique: "Respiration guidée", intensity: 3, durationMinutes: 10, note: "Détente progressive" }], techniques: ["Respiration guidée", "Étirement"], observations: "Retour très positif après séance.", practitionerRecommendations: "Poursuivre les exercices respiratoires." },
    ]);
    await db.insert(campusExercises).values([
      { name: "Rotation thoracique au sol", category: "mobility", objective: "Redonner de la liberté au haut du dos.", instructions: "Respirer lentement et accompagner le mouvement sans forcer.", durationSeconds: 45, repetitions: "6 par côté", frequency: "1 fois / jour", precautions: "Rester dans une amplitude confortable." },
      { name: "Respiration 4–6", category: "breathing", objective: "Installer un rythme respiratoire calme.", instructions: "Inspirer 4 secondes, expirer 6 secondes.", durationSeconds: 300, repetitions: "5 minutes", frequency: "1 à 2 fois / jour", precautions: "Ne pas retenir sa respiration." },
      { name: "Ouverture de hanche", category: "stretching", objective: "Explorer une amplitude douce.", instructions: "Maintenir la position puis revenir lentement.", durationSeconds: 60, repetitions: "3 par côté", frequency: "3 fois / semaine", precautions: "Aucune douleur aiguë." },
      { name: "Pont fessier", category: "strengthening", objective: "Activer la chaîne postérieure.", instructions: "Pousser dans les pieds et contrôler la descente.", durationSeconds: 90, repetitions: "3 × 10", frequency: "3 fois / semaine", precautions: "Garder les côtes relâchées." },
    ]);
    await db.insert(campusPrograms).values([
      { clientId: camille.id, name: "Retour à la mobilité", durationDays: 14, status: "active", completionRate: "82", objective: "Bouger plus librement au quotidien.", message: "Un programme court pour garder le bénéfice de la séance.", startsOn: today(), endsOn: isoInDays(14, 0).toISOString().slice(0, 10), exercises: [{ exerciseId: 1, exerciseName: "Rotation thoracique au sol", dosage: "6 par côté", sortOrder: 1 }, { exerciseId: 2, exerciseName: "Respiration 4–6", dosage: "5 min / jour", sortOrder: 2 }] },
      { clientId: thomas.id, name: "7 jours de mouvement", durationDays: 7, status: "sent", completionRate: "0", objective: "Retrouver des repères de mouvement.", message: "On commence progressivement, sans chercher la performance.", startsOn: today(), endsOn: isoInDays(7, 0).toISOString().slice(0, 10), exercises: [{ exerciseId: 3, exerciseName: "Ouverture de hanche", dosage: "3 par côté", sortOrder: 1 }] },
    ]);
    await db.insert(campusNotifications).values([
      { type: "feedback", title: "Nouveau retour client", body: "Camille a partagé son ressenti après le programme.", read: false },
      { type: "appointment", title: "Rendez-vous à confirmer", body: "Thomas attend votre confirmation pour demain.", read: false },
      { type: "program", title: "Programme actif", body: "Le programme de Camille est réalisé à 82 %.", read: true },
    ]);
    await db.insert(campusInvoices).values([
      { number: "FAC-2026-024", clientId: camille.id, serviceName: "Séance corps entier", amount: "65", issuedOn: today(), status: "paid" },
      { number: "FAC-2026-023", clientId: thomas.id, serviceName: "Bilan initial", amount: "75", issuedOn: isoInDays(-3, 0).toISOString().slice(0, 10), status: "sent" },
      { number: "FAC-2026-022", clientId: sarah.id, serviceName: "Massage & mobilité", amount: "65", issuedOn: isoInDays(-7, 0).toISOString().slice(0, 10), status: "overdue" },
    ]);
  }
  if ((await db.select({ id: campusBodyZones.id }).from(campusBodyZones).limit(1)).length === 0) {
    await db.insert(campusBodyZones).values([
      { slug: "head", label: "Tête", region: "Tête", view: "front", x: "44", y: "6", width: "12", height: "11" },
      { slug: "neck", label: "Nuque", region: "Cou", view: "back", x: "45", y: "16", width: "10", height: "7" },
      { slug: "upper-back", label: "Haut du dos", region: "Dos", view: "back", x: "38", y: "25", width: "24", height: "14" },
      { slug: "right-shoulder", label: "Épaule droite", region: "Épaule", view: "front", x: "59", y: "25", width: "13", height: "11" },
      { slug: "left-shoulder", label: "Épaule gauche", region: "Épaule", view: "front", x: "28", y: "25", width: "13", height: "11" },
      { slug: "chest", label: "Pectoraux", region: "Thorax", view: "front", x: "40", y: "31", width: "20", height: "12" },
      { slug: "abdomen", label: "Abdomen", region: "Ventre", view: "front", x: "41", y: "43", width: "18", height: "15" },
      { slug: "lower-back", label: "Lombaires", region: "Lombaires", view: "back", x: "41", y: "44", width: "18", height: "13" },
      { slug: "right-hip", label: "Hanche droite", region: "Hanche", view: "front", x: "55", y: "56", width: "13", height: "10" },
      { slug: "left-hip", label: "Hanche gauche", region: "Hanche", view: "front", x: "32", y: "56", width: "13", height: "10" },
      { slug: "right-knee", label: "Genou droit", region: "Genou", view: "front", x: "53", y: "76", width: "10", height: "9" },
      { slug: "left-knee", label: "Genou gauche", region: "Genou", view: "front", x: "37", y: "76", width: "10", height: "9" },
    ]);
  }
  if ((await db.select({ id: campusAnatomyStructures.id }).from(campusAnatomyStructures).limit(1)).length === 0) {
    await db.insert(campusAnatomyStructures).values([
      { name: "Trapèze supérieur", region: "Ceinture scapulaire", type: "muscle", description: "Structure située entre la nuque et l’épaule, utile comme repère de travail.", view: "postérieure", tags: ["nuque", "épaule", "dos"] },
      { name: "Diaphragme", region: "Thorax", type: "muscle", description: "Repère anatomique associé à la respiration et à la mobilité thoracique.", view: "antérieure", tags: ["respiration", "thorax"] },
      { name: "Articulation coxo-fémorale", region: "Hanche", type: "joint", description: "Articulation profonde entre le bassin et le fémur.", view: "latérale", tags: ["hanche", "mobilité"] },
      { name: "Fascia thoraco-lombaire", region: "Dos", type: "fascia", description: "Réseau conjonctif postérieur servant de repère de lecture du dos.", view: "postérieure", tags: ["fascia", "lombaires"] },
    ]);
  }
  seeded = true;
}

async function clientName(clientId: number): Promise<string> {
  const [client] = await db.select().from(campusClients).where(eq(campusClients.id, clientId));
  return client ? `${client.firstName} ${client.lastName}` : "Client";
}

async function clientStats(client: typeof campusClients.$inferSelect) {
  const sessions = await db.select().from(campusSessions).where(eq(campusSessions.clientId, client.id));
  const appointments = await db.select().from(campusAppointments).where(and(eq(campusAppointments.clientId, client.id), eq(campusAppointments.status, "confirmed")));
  const programs = await db.select().from(campusPrograms).where(and(eq(campusPrograms.clientId, client.id), eq(campusPrograms.status, "active")));
  return {
    ...client,
    sessionsCount: sessions.length,
    lastSessionAt: sessions.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0]?.occurredAt ?? null,
    nextAppointmentAt: appointments.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0]?.startsAt ?? null,
    activeProgramCount: programs.length,
  };
}

function appointmentOutput(item: typeof campusAppointments.$inferSelect, names: Map<number, string>) {
  return { ...item, clientName: names.get(item.clientId) ?? "Client", price: Number(item.price) };
}

function sessionOutput(item: typeof campusSessions.$inferSelect, names: Map<number, string>) {
  return { ...item, clientName: names.get(item.clientId) ?? "Client", zones: item.zones as unknown[], techniques: item.techniques as string[] };
}

async function allClientNames(): Promise<Map<number, string>> {
  const clients = await db.select().from(campusClients);
  return new Map(clients.map((client) => [client.id, `${client.firstName} ${client.lastName}`]));
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const appointments = await db.select().from(campusAppointments);
  const clients = await db.select().from(campusClients).where(eq(campusClients.status, "active"));
  const sessions = await db.select().from(campusSessions);
  const programs = await db.select().from(campusPrograms).where(eq(campusPrograms.status, "active"));
  const invoices = await db.select().from(campusInvoices).where(eq(campusInvoices.status, "overdue"));
  const notifications = await db.select().from(campusNotifications).where(eq(campusNotifications.read, false));
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const upcoming = appointments.filter((item) => item.status !== "cancelled" && item.startsAt >= now()).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  const summary = {
    todayAppointments: appointments.filter((item) => item.startsAt.toDateString() === now().toDateString() && item.status !== "cancelled").length,
    nextAppointment: upcoming?.startsAt ?? null,
    activeClients: clients.length,
    monthlySessions: sessions.filter((item) => item.occurredAt >= startOfMonth).length,
    monthlyRevenue: appointments.filter((item) => item.status === "completed").reduce((total, item) => total + Number(item.price), 0),
    attendanceRate: 94,
    activePrograms: programs.length,
    unreadNotifications: notifications.length,
    programsToSend: (await db.select().from(campusPrograms).where(eq(campusPrograms.status, "draft"))).length,
    invoicesDue: invoices.length,
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const names = await allClientNames();
  const sessions = await db.select().from(campusSessions).orderBy(desc(campusSessions.occurredAt)).limit(3);
  const activity = sessions.map((item) => ({
    id: item.id,
    type: "session" as const,
    title: `Séance avec ${names.get(item.clientId) ?? "Client"}`,
    detail: item.observations || "Séance documentée",
    createdAt: item.occurredAt,
  }));
  res.json(GetDashboardActivityResponse.parse(activity));
});

router.get("/clients", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListClientsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  let clients = await db.select().from(campusClients);
  if (query.data.status !== "all") clients = clients.filter((client) => client.status === query.data.status);
  if (query.data.search) {
    const search = query.data.search.toLowerCase();
    clients = clients.filter((client) => `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase().includes(search));
  }
  res.json(ListClientsResponse.parse(await Promise.all(clients.map(clientStats))));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [client] = await db.insert(campusClients).values({ ...parsed.data, birthDate: parsed.data.birthDate?.toISOString().slice(0, 10) }).returning();
  res.status(201).json(CreateClientResponse.parse(await clientStats(client)));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await ensureSeeded();
  const [client] = await db.select().from(campusClients).where(eq(campusClients.id, params.data.id));
  if (!client) { res.status(404).json({ error: "Client introuvable" }); return; }
  const names = new Map([[client.id, `${client.firstName} ${client.lastName}`]]);
  const sessions = await db.select().from(campusSessions).where(eq(campusSessions.clientId, client.id)).orderBy(desc(campusSessions.occurredAt));
  const detail = { ...(await clientStats(client)), notes: client.notes, firstSessionAt: sessions[sessions.length - 1]?.occurredAt ?? null, sessions: sessions.map((item) => sessionOutput(item, names)) };
  res.json(GetClientResponse.parse(detail));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  const body = UpdateClientBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Données client invalides" }); return; }
  const { birthDate, ...clientUpdate } = body.data;
  const [client] = await db.update(campusClients).set({ ...clientUpdate, ...(birthDate ? { birthDate: birthDate.toISOString().slice(0, 10) } : {}) }).where(eq(campusClients.id, params.data.id)).returning();
  if (!client) { res.status(404).json({ error: "Client introuvable" }); return; }
  res.json(UpdateClientResponse.parse(await clientStats(client)));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = ArchiveClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [client] = await db.update(campusClients).set({ status: "archived" }).where(eq(campusClients.id, params.data.id)).returning();
  if (!client) { res.status(404).json({ error: "Client introuvable" }); return; }
  res.sendStatus(204);
});

router.get("/appointments", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListAppointmentsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const names = await allClientNames();
  let appointments = await db.select().from(campusAppointments).orderBy(campusAppointments.startsAt);
  if (query.data.from) appointments = appointments.filter((item) => item.startsAt >= new Date(query.data.from!));
  if (query.data.to) appointments = appointments.filter((item) => item.startsAt <= new Date(`${query.data.to}T23:59:59`));
  res.json(ListAppointmentsResponse.parse(appointments.map((item) => appointmentOutput(item, names))));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [appointment] = await db.insert(campusAppointments).values({ ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), price: String(parsed.data.price ?? 65) }).returning();
  res.status(201).json(CreateAppointmentResponse.parse(appointmentOutput(appointment, await allClientNames())));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  const body = UpdateAppointmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Rendez-vous invalide" }); return; }
  const { price, startsAt, endsAt, ...appointmentUpdate } = body.data;
  const update = { ...appointmentUpdate, ...(startsAt ? { startsAt: new Date(startsAt) } : {}), ...(endsAt ? { endsAt: new Date(endsAt) } : {}), ...(price !== undefined ? { price: String(price) } : {}) };
  const [appointment] = await db.update(campusAppointments).set(update).where(eq(campusAppointments.id, params.data.id)).returning();
  if (!appointment) { res.status(404).json({ error: "Rendez-vous introuvable" }); return; }
  res.json(UpdateAppointmentResponse.parse(appointmentOutput(appointment, await allClientNames())));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [appointment] = await db.update(campusAppointments).set({ status: "cancelled" }).where(eq(campusAppointments.id, params.data.id)).returning();
  if (!appointment) { res.status(404).json({ error: "Rendez-vous introuvable" }); return; }
  res.sendStatus(204);
});

router.get("/sessions", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListSessionsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const names = await allClientNames();
  const sessions = await db.select().from(campusSessions).orderBy(desc(campusSessions.occurredAt));
  const filtered = query.data.clientId ? sessions.filter((item) => item.clientId === query.data.clientId) : sessions;
  res.json(ListSessionsResponse.parse(filtered.map((item) => sessionOutput(item, names))));
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [session] = await db.insert(campusSessions).values({ ...parsed.data, occurredAt: new Date(parsed.data.occurredAt), zones: parsed.data.zones, techniques: parsed.data.techniques }).returning();
  res.status(201).json(CreateSessionResponse.parse(sessionOutput(session, await allClientNames())));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [session] = await db.select().from(campusSessions).where(eq(campusSessions.id, params.data.id));
  if (!session) { res.status(404).json({ error: "Séance introuvable" }); return; }
  res.json(GetSessionResponse.parse(sessionOutput(session, await allClientNames())));
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateSessionParams.safeParse(req.params);
  const body = UpdateSessionBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Séance invalide" }); return; }
  const [session] = await db.update(campusSessions).set({ ...body.data, occurredAt: new Date(body.data.occurredAt) }).where(eq(campusSessions.id, params.data.id)).returning();
  if (!session) { res.status(404).json({ error: "Séance introuvable" }); return; }
  res.json(UpdateSessionResponse.parse(sessionOutput(session, await allClientNames())));
});

router.get("/body-zones", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const zones = await db.select().from(campusBodyZones);
  res.json(ListBodyZonesResponse.parse(zones.map((zone) => ({ ...zone, x: Number(zone.x), y: Number(zone.y), width: Number(zone.width), height: Number(zone.height) }))));
});

router.get("/exercises", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListExercisesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  let exercises = await db.select().from(campusExercises);
  if (query.data.category) exercises = exercises.filter((item) => item.category === query.data.category);
  if (query.data.search) exercises = exercises.filter((item) => item.name.toLowerCase().includes(query.data.search!.toLowerCase()));
  res.json(ListExercisesResponse.parse(exercises));
});

router.post("/exercises", async (req, res): Promise<void> => {
  const parsed = CreateExerciseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [exercise] = await db.insert(campusExercises).values({ ...parsed.data, isCustom: true }).returning();
  res.status(201).json(CreateExerciseResponse.parse(exercise));
});

router.patch("/exercises/:id", async (req, res): Promise<void> => {
  const params = UpdateExerciseParams.safeParse(req.params);
  const body = UpdateExerciseBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Exercice invalide" }); return; }
  const [exercise] = await db.update(campusExercises).set(body.data).where(eq(campusExercises.id, params.data.id)).returning();
  if (!exercise) { res.status(404).json({ error: "Exercice introuvable" }); return; }
  res.json(UpdateExerciseResponse.parse(exercise));
});

router.delete("/exercises/:id", async (req, res): Promise<void> => {
  const params = DeleteExerciseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [exercise] = await db.delete(campusExercises).where(eq(campusExercises.id, params.data.id)).returning();
  if (!exercise) { res.status(404).json({ error: "Exercice introuvable" }); return; }
  res.sendStatus(204);
});

router.get("/programs", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const names = await allClientNames();
  const programs = await db.select().from(campusPrograms).orderBy(desc(campusPrograms.id));
  res.json(ListProgramsResponse.parse(programs.map((program) => ({ ...program, clientName: names.get(program.clientId) ?? "Client", completionRate: Number(program.completionRate), exercises: program.exercises as unknown[] }))));
});

router.post("/programs", async (req, res): Promise<void> => {
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [program] = await db.insert(campusPrograms).values({ ...parsed.data, startsOn: parsed.data.startsOn.toISOString().slice(0, 10), endsOn: parsed.data.endsOn.toISOString().slice(0, 10) }).returning();
  res.status(201).json(CreateProgramResponse.parse({ ...program, clientName: await clientName(program.clientId), completionRate: Number(program.completionRate), exercises: program.exercises as unknown[] }));
});

router.patch("/programs/:id", async (req, res): Promise<void> => {
  const params = UpdateProgramParams.safeParse(req.params);
  const body = UpdateProgramBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Programme invalide" }); return; }
  const { startsOn, endsOn, ...programUpdate } = body.data;
  const [program] = await db.update(campusPrograms).set({ ...programUpdate, ...(startsOn ? { startsOn: startsOn.toISOString().slice(0, 10) } : {}), ...(endsOn ? { endsOn: endsOn.toISOString().slice(0, 10) } : {}) }).where(eq(campusPrograms.id, params.data.id)).returning();
  if (!program) { res.status(404).json({ error: "Programme introuvable" }); return; }
  res.json(UpdateProgramResponse.parse({ ...program, clientName: await clientName(program.clientId), completionRate: Number(program.completionRate), exercises: program.exercises as unknown[] }));
});

router.get("/notifications", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const notifications = await db.select().from(campusNotifications).orderBy(desc(campusNotifications.createdAt));
  res.json(ListNotificationsResponse.parse(notifications));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [notification] = await db.update(campusNotifications).set({ read: true }).where(eq(campusNotifications.id, params.data.id)).returning();
  if (!notification) { res.status(404).json({ error: "Notification introuvable" }); return; }
  res.json(notification);
});

router.get("/invoices", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const names = await allClientNames();
  const invoices = await db.select().from(campusInvoices).orderBy(desc(campusInvoices.issuedOn));
  res.json(ListInvoicesResponse.parse(invoices.map((invoice) => ({ ...invoice, clientName: names.get(invoice.clientId) ?? "Client", amount: Number(invoice.amount) }))));
});

router.post("/invoices", async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [invoice] = await db.insert(campusInvoices).values({ ...parsed.data, amount: String(parsed.data.amount), issuedOn: parsed.data.issuedOn.toISOString().slice(0, 10), number: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}` }).returning();
  res.status(201).json(CreateInvoiceResponse.parse({ ...invoice, clientName: await clientName(invoice.clientId), amount: Number(invoice.amount) }));
});

router.get("/subscription", async (_req, res): Promise<void> => {
  res.json(GetSubscriptionResponse.parse({ plan: "pro", price: 59, interval: "month", status: "active", renewsOn: isoInDays(19, 0).toISOString().slice(0, 10) }));
});

router.get("/anatomy/structures", async (req, res): Promise<void> => {
  await ensureSeeded();
  const query = ListAnatomyStructuresQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  let structures = await db.select().from(campusAnatomyStructures);
  if (query.data.search) structures = structures.filter((item) => `${item.name} ${item.region} ${item.type}`.toLowerCase().includes(query.data.search!.toLowerCase()));
  res.json(ListAnatomyStructuresResponse.parse(structures.map((item) => ({ ...item, tags: item.tags as string[] }))));
});

export default router;