/** Schéma minimal pour pg-mem en développement local (sans Docker). */
export const MEMORY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS campus_clients (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#7C8F82',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_appointments (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  client_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  service_name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 65
);

CREATE TABLE IF NOT EXISTS campus_sessions (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  client_id INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  before_feeling INTEGER NOT NULL DEFAULT 5,
  after_feeling INTEGER NOT NULL DEFAULT 7,
  mobility_before INTEGER,
  mobility_after INTEGER,
  zones JSONB NOT NULL DEFAULT '[]',
  techniques JSONB NOT NULL DEFAULT '[]',
  observations TEXT NOT NULL DEFAULT '',
  practitioner_recommendations TEXT NOT NULL DEFAULT '',
  program_id INTEGER
);

CREATE TABLE IF NOT EXISTS campus_body_zones (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  region TEXT NOT NULL,
  view TEXT NOT NULL,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS campus_exercises (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  objective TEXT NOT NULL,
  instructions TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  repetitions TEXT NOT NULL DEFAULT '3 séries',
  frequency TEXT NOT NULL DEFAULT '1 fois / jour',
  precautions TEXT NOT NULL DEFAULT 'Arrêter en cas de gêne.',
  media_path TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS campus_programs (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  client_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  objective TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS campus_notifications (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_invoices (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'demo-practitioner',
  number TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  issued_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS campus_anatomy_structures (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  view TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'
);
`;
