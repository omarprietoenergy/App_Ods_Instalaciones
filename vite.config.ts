import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import * as nodePath from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": nodePath.resolve(import.meta.dirname, "client", "src"),
      "@shared": nodePath.resolve(import.meta.dirname, "shared"),
      "@assets": nodePath.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: nodePath.resolve(import.meta.dirname),
  root: nodePath.resolve(import.meta.dirname, "client"),
  publicDir: nodePath.resolve(import.meta.dirname, "client", "public"),
  base: "/",
  build: {
    outDir: nodePath.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".odsenergy.net",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
