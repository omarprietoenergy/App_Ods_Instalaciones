import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createPgPool } from "./db/pool";
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

  // Use the centralized pool factory — same SSL config as queries
  const migrationPool = createPgPool();
  const db = drizzle(migrationPool);

  try {
    console.log("[Migrations] Starting database migrations...");
    const migrationsPath = nodePath.join(process.cwd(), "drizzle");
    
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("[Migrations] SUCCESS: Database migrations applied successfully.");
  } catch (error) {
    console.error("[Migrations] ERROR: Migration failed:", error);
    throw error;
  } finally {
    await migrationPool.end();
    console.log("[Migrations] Migration pool closed.");
  }
}
