import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../routes";
import { setupAuth } from "./local-auth";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { runMigrations } from "../migrations";
import { seedAdminUser } from "../bootstrap-seed";
import { getDb, sql } from "../db";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let resBody: any;

  const originalResJson = res.json;
  res.json = function (body) {
    resBody = body;
    return originalResJson.apply(res, arguments as any);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (res.statusCode >= 400) {
        logLine += ` (body: ${JSON.stringify(resBody)})`;
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[Bootstrap] Starting application sequence...");

  // 1. Run migrations if enabled
  try {
    await runMigrations();
  } catch (e) {
    console.error("[Bootstrap] Migration failed, but attempting to continue...", e);
  }

  // 2. Run seed if enabled
  try {
    await seedAdminUser();
  } catch (e) {
    console.error("[Bootstrap] Seed failed, but attempting to continue...", e);
  }

  // 3. Setup Auth and Routes
  setupAuth(app);
  const server = createServer(app);
  
  // Health check endpoint
  app.get("/health", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not initialized");
      await db.execute(sql`SELECT 1`);
      res.status(200).json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Health] Database ping failed:", error.message);
      res.status(503).json({ status: "error", database: "disconnected", error: error.message });
    }
  });

  // Version endpoint
  const pkgPath = resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const versionInfo = {
    version: pkg.version,
    env: process.env.NODE_ENV || "development",
    buildTime: new Date().toISOString()
  };

  app.get("/api/__version", (_req, res) => res.json(versionInfo));
  app.get("/api/version", (_req, res) => res.json(versionInfo));

  await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[Error] Unhandled error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    const { setupVite, serveStatic, logStorageInfo } = await import("./vite");
    await setupVite(app, server);
    logStorageInfo();
  } else {
    // Production/Staging static files setup
    const { serveStatic, logStorageInfo } = await import("./vite");
    serveStatic(app);
    logStorageInfo();

    const PORT = Number(process.env.PORT) || 8080;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
    });
    return;
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Development server running on 0.0.0.0:${PORT}`);
  });
})();
