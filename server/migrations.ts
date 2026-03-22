import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import nodePath from "node:path";

export async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== "true") {
    console.log("[Migrations] RUN_MIGRATIONS is not 'true'. Skipping migrations.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("[Migrations] CRITICAL: DATABASE_URL is not set. Cannot run migrations.");
    return;
  }

  console.log("[Migrations] USING INLINE SSL POOL FOR DO");
  console.log("[Migrations] NODE_ENV =", process.env.NODE_ENV);
  console.log("[Migrations] DATABASE_URL present =", !!process.env.DATABASE_URL);

  const migrationPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("[Migrations] Pool created with SSL rejectUnauthorized=false");

  const db = drizzle(migrationPool);

  try {
    const migrationsPath = nodePath.join(process.cwd(), "drizzle");
    console.log("[Migrations] migrationsFolder =", migrationsPath);
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("[Migrations] Migrations completed OK");
  } catch (error) {
    console.error("[Migrations] ERROR: Migration failed:", error);
    throw error;
  } finally {
    await migrationPool.end();
    console.log("[Migrations] Migration pool closed.");
  }
}
