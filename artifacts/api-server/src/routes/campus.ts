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
import { REFERENCE_ANATOMY, REFERENCE_EXERCISES } from "../seed/campus-reference-content";
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

/** pg-mem ne gère pas `.returning()` de Drizzle — insert/update puis relecture. */
async function fetchById<T extends { id: typeof campusClients.id }>(
  table: T,
  id: number,
): Promise<T["$inferSelect"] | undefined> {
  const [row] = await db.select().from(table).where(eq(table.id, id));
  return row;
}

async function insertRow<T extends { id: typeof campusClients.id }>(
  table: T,
  values: T["$inferInsert"],
): Promise<T["$inferSelect"]> {
  await db.insert(table).values(values);
  const [row] = await db.select().from(table).orderBy(desc(table.id)).limit(1);
  if (!row) throw new Error("Échec de l'insertion");
  return row;
}

async function updateRow<T extends { id: typeof campusClients.id }>(
  table: T,
  id: number,
  values: Partial<T["$inferInsert"]>,
): Promise<T["$inferSelect"]> {
  await db.update(table).set(values).where(eq(table.id, id));
  const row = await fetchById(table, id);
  if (!row) throw new Error("Enregistrement introuvable");
  return row;
}

async function deleteRow<T extends { id: typeof campusClients.id }>(
  table: T,
  id: number,
): Promise<T["$inferSelect"]> {
  const row = await fetchById(table, id);
  if (!row) throw new Error("Enregistrement introuvable");
  await db.delete(table).where(eq(table.id, id));
  return row;
}

async function ensureSeeded(): Promise<void> {
  if (seeded) return;
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
  if ((await db.select({ id: campusAnatomyStructures.id }).from(campusAnatomyStructures).limit(1)).length === 0
    || (await db.select().from(campusAnatomyStructures)).length < REFERENCE_ANATOMY.length) {
    await db.delete(campusAnatomyStructures);
    await db.insert(campusAnatomyStructures).values(
      REFERENCE_ANATOMY.map((item) => ({
        name: item.name,
        region: item.region,
        type: item.type,
        description: item.description,
        view: item.view,
        tags: [...item.tags],
      })),
    );
  }
  if ((await db.select({ id: campusExercises.id }).from(campusExercises).limit(1)).length === 0
    || (await db.select().from(campusExercises)).length < REFERENCE_EXERCISES.length) {
    await db.delete(campusExercises);
    await db.insert(campusExercises).values(
      REFERENCE_EXERCISES.map((item) => ({
        name: item.name,
        category: item.category,
        objective: item.objective,
        instructions: item.instructions,
        durationSeconds: item.durationSeconds,
        repetitions: item.repetitions,
        frequency: item.frequency,
        precautions: item.precautions,
        isCustom: false,
      })),
    );
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
  const notifications = await db.select().from(campusNotifications).where(eq(campusNotifications.read, false));
  const invoices = await db.select().from(campusInvoices);
  const overdueInvoices = invoices.filter((item) => item.status === "overdue");
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const upcoming = appointments.filter((item) => item.status !== "cancelled" && item.startsAt >= now()).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  const completedAppointments = appointments.filter((item) => item.status === "completed" || item.status === "confirmed");
  const attended = completedAppointments.length;
  const cancelled = appointments.filter((item) => item.status === "cancelled").length;
  const attendanceRate = attended + cancelled > 0 ? Math.round((attended / (attended + cancelled)) * 1000) / 10 : 0;
  const summary = {
    todayAppointments: appointments.filter((item) => item.startsAt.toDateString() === now().toDateString() && item.status !== "cancelled").length,
    nextAppointment: upcoming?.startsAt ?? null,
    activeClients: clients.length,
    monthlySessions: sessions.filter((item) => item.occurredAt >= startOfMonth).length,
    monthlyRevenue: invoices.filter((item) => item.status === "paid" && new Date(item.issuedOn) >= startOfMonth).reduce((total, item) => total + Number(item.amount), 0),
    attendanceRate,
    activePrograms: programs.length,
    unreadNotifications: notifications.length,
    programsToSend: (await db.select().from(campusPrograms).where(eq(campusPrograms.status, "draft"))).length,
    invoicesDue: overdueInvoices.length,
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
  await ensureSeeded();
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { birthDate, ...rest } = parsed.data;
  const client = await insertRow(campusClients, {
    ...rest,
    ...(birthDate ? { birthDate: birthDate.toISOString().slice(0, 10) } : {}),
  });
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
  const client = await updateRow(campusClients, params.data.id, {
    ...clientUpdate,
    ...(birthDate ? { birthDate: birthDate.toISOString().slice(0, 10) } : {}),
  });
  res.json(UpdateClientResponse.parse(await clientStats(client)));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = ArchiveClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let client;
  try {
    client = await updateRow(campusClients, params.data.id, { status: "archived" });
  } catch {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
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
  const appointment = await insertRow(campusAppointments, { ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), price: String(parsed.data.price ?? 65) });
  res.status(201).json(CreateAppointmentResponse.parse(appointmentOutput(appointment, await allClientNames())));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  const body = UpdateAppointmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Rendez-vous invalide" }); return; }
  const { price, startsAt, endsAt, ...appointmentUpdate } = body.data;
  const update = { ...appointmentUpdate, ...(startsAt ? { startsAt: new Date(startsAt) } : {}), ...(endsAt ? { endsAt: new Date(endsAt) } : {}), ...(price !== undefined ? { price: String(price) } : {}) };
  let appointment;
  try {
    appointment = await updateRow(campusAppointments, params.data.id, update);
  } catch {
    res.status(404).json({ error: "Rendez-vous introuvable" });
    return;
  }
  res.json(UpdateAppointmentResponse.parse(appointmentOutput(appointment, await allClientNames())));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  try {
    await updateRow(campusAppointments, params.data.id, { status: "cancelled" });
  } catch {
    res.status(404).json({ error: "Rendez-vous introuvable" });
    return;
  }
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
  const session = await insertRow(campusSessions, { ...parsed.data, occurredAt: new Date(parsed.data.occurredAt), zones: parsed.data.zones, techniques: parsed.data.techniques });
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
  let session;
  try {
    session = await updateRow(campusSessions, params.data.id, { ...body.data, occurredAt: new Date(body.data.occurredAt) });
  } catch {
    res.status(404).json({ error: "Séance introuvable" });
    return;
  }
  res.json(UpdateSessionResponse.parse(sessionOutput(session, await allClientNames())));
});

router.delete("/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  try {
    await deleteRow(campusSessions, params.data.id);
  } catch {
    res.status(404).json({ error: "Séance introuvable" });
    return;
  }
  res.sendStatus(204);
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
  const exercise = await insertRow(campusExercises, { ...parsed.data, isCustom: true });
  res.status(201).json(CreateExerciseResponse.parse(exercise));
});

router.patch("/exercises/:id", async (req, res): Promise<void> => {
  const params = UpdateExerciseParams.safeParse(req.params);
  const body = UpdateExerciseBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Exercice invalide" }); return; }
  let exercise;
  try {
    exercise = await updateRow(campusExercises, params.data.id, body.data);
  } catch {
    res.status(404).json({ error: "Exercice introuvable" });
    return;
  }
  res.json(UpdateExerciseResponse.parse(exercise));
});

router.delete("/exercises/:id", async (req, res): Promise<void> => {
  const params = DeleteExerciseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  try {
    await deleteRow(campusExercises, params.data.id);
  } catch {
    res.status(404).json({ error: "Exercice introuvable" });
    return;
  }
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
  const program = await insertRow(campusPrograms, { ...parsed.data, startsOn: parsed.data.startsOn.toISOString().slice(0, 10), endsOn: parsed.data.endsOn.toISOString().slice(0, 10) });
  res.status(201).json(CreateProgramResponse.parse({ ...program, clientName: await clientName(program.clientId), completionRate: Number(program.completionRate), exercises: program.exercises as unknown[] }));
});

router.patch("/programs/:id", async (req, res): Promise<void> => {
  const params = UpdateProgramParams.safeParse(req.params);
  const body = UpdateProgramBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Programme invalide" }); return; }
  const { startsOn, endsOn, ...programUpdate } = body.data;
  let program;
  try {
    program = await updateRow(campusPrograms, params.data.id, {
      ...programUpdate,
      ...(startsOn ? { startsOn: startsOn.toISOString().slice(0, 10) } : {}),
      ...(endsOn ? { endsOn: endsOn.toISOString().slice(0, 10) } : {}),
    });
  } catch {
    res.status(404).json({ error: "Programme introuvable" });
    return;
  }
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
  let notification;
  try {
    notification = await updateRow(campusNotifications, params.data.id, { read: true });
  } catch {
    res.status(404).json({ error: "Notification introuvable" });
    return;
  }
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
  const invoice = await insertRow(campusInvoices, { ...parsed.data, amount: String(parsed.data.amount), issuedOn: parsed.data.issuedOn.toISOString().slice(0, 10), number: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}` });
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

/** Dev / démo : vide clients, séances, RDV, factures, notifs, programmes (compte neuf). */
router.post("/dev/reset-practice", async (_req, res): Promise<void> => {
  await ensureSeeded();
  await db.delete(campusSessions);
  await db.delete(campusAppointments);
  await db.delete(campusInvoices);
  await db.delete(campusPrograms);
  await db.delete(campusNotifications);
  await db.delete(campusClients);
  res.json({ ok: true });
});

export default router;