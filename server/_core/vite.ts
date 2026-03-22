import express, { type Express } from "express";
import fs from "node:fs";
import { type Server } from "node:http";
import { nanoid } from "nanoid";
import * as nodePath from "node:path";

const __dirname_resolved = typeof __dirname !== 'undefined'
  ? __dirname
  : process.cwd();

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const viteConfig = (await import("../../vite.config")).default;
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = nodePath.resolve(
        __dirname_resolved,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? nodePath.resolve(__dirname_resolved, "../..", "dist", "public")
      : nodePath.resolve(process.cwd(), "dist");

  console.log(`[Vite] Initializing static serving from: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(
      `[Vite] CRITICAL ERROR: Could not find the build directory: ${distPath}. Make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { index: false }));

  // SPA fallback: serve index.html for client-side routes
  // BUT never intercept API routes or health checks
  app.use("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return next();
    }
    console.log(`[Vite] SPA fallback for ${req.originalUrl} -> index.html`);
    const indexPath = nodePath.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found (Missing index.html)");
    }
  });
}
