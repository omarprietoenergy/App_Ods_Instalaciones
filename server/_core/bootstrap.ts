import * as nodePath from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import dotenv from "dotenv";

console.log("[Bootstrap] Starting initialization...");

// Compatibilidad para CJS y ESM - Detección segura de directorio
let _dirname = "";
try {
    // En CJS, __dirname está definido globalmente
    // @ts-ignore
    if (typeof __dirname !== 'undefined') {
        _dirname = __dirname;
    } else {
        // Fallback para ESM si no hay bundling
        _dirname = nodePath.dirname(fileURLToPath(import.meta.url));
    }
} catch (e) {
    _dirname = process.cwd();
}


const __dirname_resolved = _dirname;
console.log(`[Bootstrap] Resolved directory: ${__dirname_resolved}`);
console.log(`[Bootstrap] Current Working Directory: ${process.cwd()}`);

// Try multiple locations for .env
const envPaths = [
    nodePath.resolve(process.cwd(), ".env"),
    nodePath.resolve(__dirname_resolved, ".env"),
    nodePath.resolve(__dirname_resolved, "..", ".env"),
    nodePath.resolve(__dirname_resolved, "../../.env"),
];

console.log("[Bootstrap] Searching for .env in potential paths...");
let loadedEnv = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        console.log(`[Bootstrap] Found .env at: ${envPath}`);
        dotenv.config({ path: envPath });
        loadedEnv = true;
        break;
    }
}

if (loadedEnv) {
    console.log("[Bootstrap] Environment variables loaded successfully.");
} else {
    console.warn("[Bootstrap] WARNING: No .env file found in searched locations.");
}

if (!process.env.DATABASE_URL) {
    console.warn("[Bootstrap] WARNING: DATABASE_URL not found in environment.");
}
