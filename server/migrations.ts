import { getDb } from "./db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import nodePath from "node:path";

export async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== "true") {
    console.log("[Migrations] RUN_MIGRATIONS is not 'true'. Skipping migrations.");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Migrations] CRITICAL: Could not get database instance for migrations.");
    return;
  }

  try {
    console.log("[Migrations] Starting database migrations...");
    // migrations directory is usually at root or ./drizzle
    const migrationsPath = nodePath.join(process.cwd(), "drizzle");
    
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("[Migrations] SUCCESS: Database migrations applied successfully.");
  } catch (error) {
    console.error("[Migrations] ERROR: Migration failed:", error);
    // We don't exit process here to allow the server to potentially start 
    // and show errors in logs, though it might crash due to missing tables later.
    throw error;
  }
}
