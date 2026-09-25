import { newDb, type IMemoryDb } from "pg-mem";
import { drizzle } from "drizzle-orm/node-postgres";
import { applyIntegrationsToPool } from "drizzle-pgmem";
import pg from "pg";
import * as schema from "./schema";
import { MEMORY_SCHEMA_SQL } from "./memory-schema";

let memoryDb: IMemoryDb | null = null;

/** Compatibilité Drizzle ORM + pg-mem (requêtes préparées mixtes text/values). */
function applyPgMemQueryShim(pool: InstanceType<typeof pg.Pool>) {
  const originalQuery = pool.query.bind(pool);
  pool.query = ((text: unknown, params?: unknown) => {
    if (typeof text === "object" && text !== null && "text" in text) {
      const config = text as { text: string; values?: unknown[] };
      return originalQuery(config.text, config.values ?? params);
    }
    return originalQuery(text as string, params as unknown[] | undefined);
  }) as typeof pool.query;
}

export function createMemoryDatabase() {
  memoryDb = newDb({ autoCreateForeignKeyIndices: true });

  memoryDb.public.registerFunction({
    name: "current_database",
    implementation: () => "campus",
  });
  memoryDb.public.registerFunction({
    name: "version",
    implementation: () => "PostgreSQL 16.0 (pg-mem)",
  });
  memoryDb.public.registerFunction({
    name: "now",
    implementation: () => new Date(),
  });

  const statements = MEMORY_SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) {
    memoryDb.public.none(sql);
  }

  const { Pool } = memoryDb.adapters.createPg();
  const pool = new Pool() as InstanceType<typeof pg.Pool>;
  applyPgMemQueryShim(pool);
  applyIntegrationsToPool(pool);
  const db = drizzle(pool, { schema });

  return { pool, db, memoryDb };
}

export function getMemoryDb() {
  return memoryDb;
}
