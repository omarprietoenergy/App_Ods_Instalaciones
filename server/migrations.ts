import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
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

  // Create a dedicated pool for migrations with explicit SSL config
  const migrationPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(migrationPool);

  try {
    console.log("[Migrations] Starting database migrations...");
    // migrations directory is usually at root or ./drizzle
    const migrationsPath = nodePath.join(process.cwd(), "drizzle");
    
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("[Migrations] SUCCESS: Database migrations applied successfully.");
  } catch (error) {
    console.error("[Migrations] ERROR: Migration failed:", error);
    throw error;
  } finally {
    // Close the dedicated migration pool after use
    await migrationPool.end();
    console.log("[Migrations] Migration pool closed.");
  }
}
