import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:migrate] CRITICAL: DATABASE_URL not set.");
    process.exit(1);
  }

  console.log("[db:migrate] Connecting to PostgreSQL...");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const db = drizzle(pool);
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");

  console.log("[db:migrate] Running migrations from:", migrationsFolder);

  try {
    await migrate(db, {
      migrationsFolder,
      migrationsSchema: "public",
    });
    console.log("[db:migrate] ✅ Migrations completed successfully.");
  } catch (error: any) {
    console.error("[db:migrate] ❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
