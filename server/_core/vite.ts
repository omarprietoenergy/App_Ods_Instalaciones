import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import vite from "vite";
import { ENV } from "./env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const viteConfig = (await import("../../vite.config")).default;
  const viteServer = await vite.createServer({
    ...viteConfig,
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(viteServer.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientIndexHtmlPath = path.resolve(__dirname, "..", "..", "index.html");
      let template = fs.readFileSync(clientIndexHtmlPath, "utf-8");
      template = await viteServer.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try to find the dist folder relative to the current file
  // In production, index.cjs is in ods_backend/
  // The structure is usually:
  // /workspace/dist/
  // /workspace/ods_backend/index.cjs
  
  const distPath = path.resolve(process.cwd(), "dist");
  const indexPath = path.resolve(distPath, "index.html");

  console.log(`[Vite] Serving static files from: ${distPath}`);

  if (!fs.existsSync(indexPath)) {
    console.warn(`[Vite] WARNING: index.html not found at ${indexPath}. Frontend may fail to load.`);
  }

  app.use(express.static(distPath));

  // Fallback to index.html for SPA routing
  app.use("*", (_req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found. Please run 'npm run build'.");
    }
  });
}

export function logStorageInfo() {
  const s3Enabled = !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET);
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (s3Enabled) {
    console.log(`[Storage] Mode: S3/Spaces (Endpoint: ${process.env.S3_ENDPOINT}, Bucket: ${process.env.S3_BUCKET})`);
  } else {
    if (nodeEnv === 'development') {
      console.log(`[Storage] Mode: Local Fallback (Allowed in development)`);
    } else {
      console.error(`[Storage] Mode: DISABLED (S3 variables missing and local fallback disabled in ${nodeEnv})`);
    }
  }
}
