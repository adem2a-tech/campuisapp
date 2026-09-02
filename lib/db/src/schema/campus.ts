import {
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const tenant = text("tenant_id").notNull().default("demo-practitioner");

export const campusClients = pgTable("campus_clients", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  birthDate: date("birth_date", { mode: "string" }),
  status: text("status").notNull().default("active"),
  notes: text("notes").notNull().default(""),
  avatarColor: text("avatar_color").notNull().default("#7C8F82"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campusAppointments = pgTable("campus_appointments", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  clientId: integer("client_id").notNull(),
  title: text("title").notNull(),
  serviceName: text("service_name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("confirmed"),
  notes: text("notes"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("65"),
});

export const campusSessions = pgTable("campus_sessions", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  clientId: integer("client_id").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  beforeFeeling: integer("before_feeling").notNull().default(5),
  afterFeeling: integer("after_feeling").notNull().default(7),
  mobilityBefore: integer("mobility_before"),
  mobilityAfter: integer("mobility_after"),
  zones: jsonb("zones").notNull().default([]),
  techniques: jsonb("techniques").notNull().default([]),
  observations: text("observations").notNull().default(""),
  practitionerRecommendations: text("practitioner_recommendations").notNull().default(""),
  programId: integer("program_id"),
});

export const campusBodyZones = pgTable("campus_body_zones", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  region: text("region").notNull(),
  view: text("view").notNull(),
  x: numeric("x").notNull(),
  y: numeric("y").notNull(),
  width: numeric("width").notNull(),
  height: numeric("height").notNull(),
});

export const campusExercises = pgTable("campus_exercises", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  name: text("name").notNull(),
  category: text("category").notNull(),
  objective: text("objective").notNull(),
  instructions: text("instructions").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(60),
  repetitions: text("repetitions").notNull().default("3 séries"),
  frequency: text("frequency").notNull().default("1 fois / jour"),
  precautions: text("precautions").notNull().default("Arrêter en cas de gêne."),
  mediaPath: text("media_path"),
  isCustom: boolean("is_custom").notNull().default(false),
});

export const campusPrograms = pgTable("campus_programs", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  clientId: integer("client_id").notNull(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  status: text("status").notNull().default("draft"),
  completionRate: numeric("completion_rate").notNull().default("0"),
  objective: text("objective").notNull().default(""),
  message: text("message").notNull().default(""),
  startsOn: date("starts_on", { mode: "string" }).notNull(),
  endsOn: date("ends_on", { mode: "string" }).notNull(),
  exercises: jsonb("exercises").notNull().default([]),
});

export const campusNotifications = pgTable("campus_notifications", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campusInvoices = pgTable("campus_invoices", {
  id: serial("id").primaryKey(),
  tenantId: tenant,
  number: text("number").notNull(),
  clientId: integer("client_id").notNull(),
  serviceName: text("service_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  issuedOn: date("issued_on", { mode: "string" }).notNull(),
  status: text("status").notNull().default("draft"),
});

export const campusAnatomyStructures = pgTable("campus_anatomy_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  view: text("view").notNull(),
  tags: jsonb("tags").notNull().default([]),
});

export const insertCampusClientSchema = createInsertSchema(campusClients).omit({ id: true, createdAt: true });
export type CampusClient = typeof campusClients.$inferSelect;
export type InsertCampusClient = z.infer<typeof insertCampusClientSchema>;