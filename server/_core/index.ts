import "./bootstrap";
import express from "express";
import { createServer } from "node:http";
import net from "node:net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerLocalAuthRoutes } from "./local-auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";
import * as nodePath from "node:path";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

// Helper to read version
function getAppVersion() {
  try {
    const pkgPath = nodePath.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch (e) {
    return 'dev';
  }
}
import * as fs from 'node:fs';

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort} `);
}

const app = express();
const server = createServer(app);

async function startServer() {
  const __dirname_resolved = typeof __dirname !== 'undefined'
    ? __dirname
    : process.cwd();
  console.log("[Server] Configuring middleware...");
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use('/uploads', express.static(nodePath.join(process.cwd(), 'uploads')));

  console.log("[Server] Setting up local authentication...");
  registerLocalAuthRoutes(app);

  // Version Endpoint
  app.get("/api/version", (req, res) => {
    res.json({
      version: getAppVersion(),
      timestamp: new Date().toISOString()
    });
  });

  // Health Endpoint
  app.get("/health", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (db) {
        res.json({ status: "ok", db: "connected" });
      } else {
        res.status(503).json({ status: "error", db: "not connected" });
      }
    } catch (e: any) {
      res.status(503).json({ status: "error", db: e.message });
    }
  });

  console.log("[Server] Setting up tRPC API...");
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  const uploadDir = process.env.UPLOAD_DIR || "uploads";
  const uploadPath = nodePath.isAbsolute(uploadDir)
    ? uploadDir
    : nodePath.resolve(process.cwd(), uploadDir);
  console.log(`[Server] Mapping /uploads to local path: ${uploadPath}`);
  app.use("/uploads", express.static(uploadPath));

  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Environment: development. Attempting Vite setup...");
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (err) {
      console.error("[Server] ERROR: Vite setup failed. Falling back to static serving...");
      const { serveStatic } = await import("./vite");
      serveStatic(app);
    }
  } else {
    console.log("[Server] Environment: production. Setting up static serving...");
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  // --- LISTEN LOGIC ---
  const isPassenger = !!process.env.PASSENGER_APP_ENV ||
    !!process.env.PASSENGER_BASE_URI ||
    !!process.env.LSNODE_PORT ||
    (!!process.env.PORT && process.env.PORT.startsWith("/"));

  const listenPort = Number(process.env.PORT || 3000);

  console.log("[Server] Listen decision:");
  console.log("  isPassenger =", isPassenger);
  console.log("  NODE_ENV =", process.env.NODE_ENV);
  console.log("  PORT =", process.env.PORT);
  console.log("  listenPort =", listenPort);

  if (isPassenger) {
    console.log("--------------------------------------------------");
    console.log("[Server] Passenger detected. Skipping server.listen().");
    console.log("--------------------------------------------------");
  } else {
    if (!globalThis.__ods_listening) {
      globalThis.__ods_listening = true;
      server.listen(listenPort, "0.0.0.0", () => {
        console.log(`[Server] SUCCESS: Listening on 0.0.0.0:${listenPort} (Env: ${process.env.NODE_ENV || 'not set'})`);
      });
    } else {
      console.log("[Server] Already listening (idempotency guard).");
    }
  }
}

// ==================== INLINE MODULES ====================
// These are inlined to prevent esbuild --packages=external from stripping them

// --- runMigrations ---
import { drizzle as drizzleMigrate } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool as PgPool } from "pg";
import nodePath2 from "node:path";

async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== "true") {
    console.log("[Migrations] RUN_MIGRATIONS is not true. Skipping.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("[Migrations] CRITICAL: DATABASE_URL not set.");
    return;
  }
  console.log("[Migrations] Starting migrations...");
  const migrationPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const migrationDb = drizzleMigrate(migrationPool);
  try {
    const migrationsPath = nodePath2.join(process.cwd(), "drizzle");
    console.log("[Migrations] migrationsFolder =", migrationsPath);
    await migrate(migrationDb, {
      migrationsFolder: migrationsPath,
      migrationsSchema: "public",
    });
    console.log("[Migrations] Migrations completed OK");
  } catch (error: any) {
    if (error.message && error.message.includes("migrationsSchema")) {
      console.log("[Migrations] migrationsSchema not supported, retrying without...");
      try {
        await migrationPool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
      } catch (schemaErr: any) {
        console.warn("[Migrations] Could not create schema drizzle:", schemaErr.message);
      }
      const migrationsPath2 = nodePath2.join(process.cwd(), "drizzle");
      await migrate(migrationDb, { migrationsFolder: migrationsPath2 });
      console.log("[Migrations] Migrations completed OK (fallback)");
    } else {
      console.error("[Migrations] ERROR:", error);
      throw error;
    }
  } finally {
    await migrationPool.end();
    console.log("[Migrations] Pool closed.");
  }
}

// --- seedAdmin ---
import bcrypt from "bcryptjs";

async function seedAdmin() {
  if (process.env.STAGING_BOOTSTRAP_ADMIN !== "true") {
    console.log("[Seed] STAGING_BOOTSTRAP_ADMIN is not true. Skipping.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("[Seed] CRITICAL: DATABASE_URL not set.");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) {
    console.error("[Seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set when STAGING_BOOTSTRAP_ADMIN=true");
    return;
  }

  console.log("[Seed] Checking for existing admin users...");

  const seedPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Check if any admin exists
    const result = await seedPool.query(
      `SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (result.rows.length > 0) {
      console.log(`[Seed] Admin already exists: ${result.rows[0].email} (id=${result.rows[0].id}). Skipping seed.`);
      return;
    }

    // No admin exists — create one
    console.log(`[Seed] No admin found. Creating admin: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await seedPool.query(
      `INSERT INTO users (email, password, name, role, "loginMethod", "createdAt", "updatedAt", "lastSignedIn")
       VALUES ($1, $2, $3, 'admin', 'local', now(), now(), now())
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $2, name = $3`,
      [adminEmail, hashedPassword, adminName]
    );

    console.log(`[Seed] SUCCESS: Admin user created — ${adminEmail}`);
  } catch (error: any) {
    console.error("[Seed] ERROR:", error.message);
    // Don't throw — seed failure should not prevent server from starting
  } finally {
    await seedPool.end();
    console.log("[Seed] Pool closed.");
  }
}

// ==================== STARTUP ====================

declare global {
  var __ods_initialized: boolean | undefined;
  var __ods_listening: boolean | undefined;
}

if (!globalThis.__ods_initialized) {
  console.log("[Server] Initializing startup sequence...");
  globalThis.__ods_initialized = true;

  runMigrations()
    .then(() => seedAdmin())
    .then(() => {
      startServer().catch(err => {
        console.error("[Server] CRITICAL STARTUP ERROR:", err);
      });
    })
    .catch(err => {
      console.error("[Server] CRITICAL STARTUP ERROR (pre-server):", err);
    });
} else {
  console.log("[Server] Already initialized, skipping startup sequence.");
}
