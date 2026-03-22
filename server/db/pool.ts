import pg from "pg";
import type { PoolConfig } from "pg";

/**
 * Single source of truth for Postgres pool configuration.
 * Used by both db.ts (queries) and migrations.ts (migrator).
 */
export function getPgPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("[PgPool] CRITICAL: DATABASE_URL is not set.");
  }

  return {
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("digitalocean")
        ? { rejectUnauthorized: false }
        : process.env.DATABASE_URL?.includes("localhost")
          ? false
          : { rejectUnauthorized: false },
  };
}

export function createPgPool(): pg.Pool {
  const config = getPgPoolConfig();
  console.log(`[PgPool] Creating pool (SSL: ${JSON.stringify(config.ssl)})`);
  return new pg.Pool(config);
}
