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
    // Usually at the root in production container/zip
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

  // Version Endpoint (P0)
  app.get("/api/version", (req, res) => {
    res.json({
      version: getAppVersion(),
      timestamp: new Date().toISOString()
    });
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

  const rawPort = process.env.PORT;
  const preferredPort = rawPort && !isNaN(Number(rawPort)) ? parseInt(rawPort) : rawPort || 3000;
  let port: number | string = preferredPort;

  if (process.env.NODE_ENV !== "production" && typeof preferredPort === "number") {
    port = await findAvailablePort(preferredPort);
  }

  console.log(`[Server] Attempting to listen on port: ${port}`);

  const isPassenger = !!process.env.PASSENGER_APP_ENV ||
    !!process.env.PASSENGER_BASE_URI ||
    !!process.env.LSNODE_PORT ||
    (!!process.env.PORT && process.env.PORT.startsWith("/"));

  if (process.env.NODE_ENV === "production" || isPassenger) {
    console.log("--------------------------------------------------");
    console.log("[Server] Production / Passenger detected.");
    console.log("[Server] Skipping manual server.listen() to allow Passenger to handle the socket.");
    console.log("--------------------------------------------------");
  } else {
    if (!globalThis.__ods_listening) {
      globalThis.__ods_listening = true;
      server.listen(port, () => {
        console.log(`[Server] SUCCESS: Running on port ${port} (Env: ${process.env.NODE_ENV || 'production'})`);
      });
    } else {
      console.log("[Server] Already listening (idempotency check).");
    }
  }
}

// INLINE runMigrations - no external import to avoid esbuild --packages=external stripping it
import { drizzle as drizzleMigrate } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool as PgPool } from "pg";
import nodePath2 from "node:path";

async function runMigrations() {
  if (process.env.RUN_MIGRATIONS !== "true") {
    console.log("[MIGRATIONS-REAL-PATH-HIT] RUN_MIGRATIONS is not true. Skipping.");
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error("[MIGRATIONS-REAL-PATH-HIT] CRITICAL: DATABASE_URL not set.");
    return;
  }
  console.log("[MIGRATIONS-REAL-PATH-HIT] Starting migrations...");
  console.log("[MIGRATIONS-REAL-SSL-ENABLED] Creating pool with rejectUnauthorized=false");
  const migrationPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const migrationDb = drizzleMigrate(migrationPool);
  try {
    const migrationsPath = nodePath2.join(process.cwd(), "drizzle");
    console.log("[MIGRATIONS-REAL-PATH-HIT] migrationsFolder =", migrationsPath);
    await migrate(migrationDb, { migrationsFolder: migrationsPath });
    console.log("[MIGRATIONS-REAL-PATH-HIT] Migrations completed OK");
  } catch (error) {
    console.error("[MIGRATIONS-REAL-PATH-HIT] ERROR:", error);
    throw error;
  } finally {
    await migrationPool.end();
    console.log("[MIGRATIONS-REAL-PATH-HIT] Pool closed.");
  }
}

// Autonomous Startup

declare global {
  var __ods_initialized: boolean | undefined;
  var __ods_listening: boolean | undefined;
}

if (!globalThis.__ods_initialized) {
  console.log("[Server] Initializing startup sequence...");
  globalThis.__ods_initialized = true;

  runMigrations().then(() => {
    startServer().catch(err => {
      console.error("[Server] CRITICAL STARTUP ERROR:", err);
    });
  });
} else {
  console.log("[Server] Already initialized, skipping startup sequence.");
}
