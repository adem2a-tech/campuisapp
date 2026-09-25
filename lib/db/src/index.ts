import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { createMemoryDatabase } from "./memory";

const { Pool } = pg;

function isMemoryUrl(url: string | undefined) {
  return !url || url.startsWith("memory://");
}

function createDatabase() {
  if (isMemoryUrl(process.env.DATABASE_URL)) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[db] Mode développement : base PostgreSQL en mémoire (pg-mem)");
    }
    return createMemoryDatabase();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  return { pool, db };
}

const { pool, db } = createDatabase();

export { pool, db };
export * from "./schema";
