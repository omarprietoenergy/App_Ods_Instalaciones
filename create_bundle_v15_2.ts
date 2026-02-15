
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const BUNDLE_DIR = path.join(__dirname, 'deployment_bundle_v15_2_5_2');
    const CLIENT_BUILD_DIR = path.join(__dirname, 'dist');

    if (fs.existsSync(BUNDLE_DIR)) {
        fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUNDLE_DIR);

    console.log('📦 Starting V15.2-beta.5.2 Release (Compliance Pre-check)...');

    // 1. Build Client
    console.log('🏗️ Building Client (Vite)...');
    execSync('npm run build:client', { stdio: 'inherit' });

    // 2. Prepare Server files
    console.log('📂 Preparing Server Files...');

    // esbuild
    console.log('🔨 Compiling Server with esbuild JS API...');
    const esbuild = await import('esbuild');

    // Copy package.json early to read dependencies
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));

    // BUNDLING
    // NOTE: mysql2 is INTENTIONALLY omitted from this list so it gets bundled.
    // This fixes the "cannot find module mysql2" error on cPanel.
    const externalList = [
        'node:*',
        'vite',
        '../../vite.config',
        'fsevents',
        'lightningcss',
        '@tailwindcss/*',
        'esbuild',
        'pnpm',
        'tsx',
        'vitest'
    ];

    const result = await esbuild.build({
        entryPoints: ['server/_core/index.ts'],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: path.join(BUNDLE_DIR, 'ods_backend', 'index.cjs'),
        external: externalList,
        metafile: true,
        loader: {
            '.node': 'copy',
            '.png': 'dataurl',
            '.jpg': 'dataurl',
        },
        logLevel: 'info',
        banner: {
            js: `/** ODS Energy V15.2-beta.5.2 - Compliance Pre-check (Epic A) **/`,
        },
    });

    if (result.metafile) {
        fs.writeFileSync('bundle_meta_v15_2_5_2.json', JSON.stringify(result.metafile, null, 2));
        console.log('📊 Metafile created: bundle_meta_v15_2_5_2.json');
    }

    console.log('📂 Preparing Folders...');
    // Folders
    fs.cpSync(path.join(__dirname, 'server'), path.join(BUNDLE_DIR, 'server'), { recursive: true });
    fs.cpSync(path.join(__dirname, 'drizzle'), path.join(BUNDLE_DIR, 'drizzle'), { recursive: true });
    // Include the idempotent migration script
    if (fs.existsSync('migration_v15_2.sql')) {
        fs.copyFileSync('migration_v15_2.sql', path.join(BUNDLE_DIR, 'migration_v15_2.sql'));
        console.log('✅ Included migration_v15_2.sql in bundle root');
    }

    // Update package.json contents for production
    pkg.version = "15.2.5-2-beta";
    pkg.main = "server.cjs";
    pkg.scripts.start = "NODE_ENV=production node server.cjs";
    delete pkg.scripts.dev;
    delete pkg.scripts['build:server'];

    fs.writeFileSync(path.join(BUNDLE_DIR, 'package.json'), JSON.stringify(pkg, null, 2));

    // 2.2 Create server.cjs proxy
    console.log('📝 Creating server.cjs proxy...');
    const serverCjsContent = `/**
 * ODS Energy - Entry Point for cPanel (V15.2-beta.5.2)
 * Technician Home & Activity Tracking
 */
const http = require("http");

// Passenger/lsnode Idempotency Patch
if (!http.Server.prototype.__odsPatched) {
  const originalListen = http.Server.prototype.listen;
  http.Server.prototype.listen = function (...args) {
    if (this.__odsAlreadyListening) return this;
    this.__odsAlreadyListening = true;
    return originalListen.apply(this, args);
  };
  http.Server.prototype.__odsPatched = true;
}

process.env.NODE_ENV = 'production';
console.log("--------------------------------------------------");
console.log("[ODS] ODS Energy V15.2-beta.5.2 - Startup");
console.log("[ODS] Time: " + new Date().toISOString());
console.log("[ODS] CWD: " + process.cwd());
console.log("[ODS] Version: 15.2.5-2-beta");
console.log("[ODS] Loading autonomous bundle...");

try {
    // Passenger needs the app export
    const backend = require('./ods_backend/index.cjs');
    module.exports = backend; 
    console.log("[ODS] Bundle loaded successfully.");
} catch (err) {
    console.error("[ODS] CRITICAL STARTUP ERROR:");
    console.error(err);
    process.exit(1);
}
console.log("--------------------------------------------------");
`;
    fs.writeFileSync(path.join(BUNDLE_DIR, 'server.cjs'), serverCjsContent);

    if (fs.existsSync('package-lock.json')) fs.cpSync('package-lock.json', path.join(BUNDLE_DIR, 'package-lock.json'));

    console.log('📂 Copying Static Files...');
    const sourcePublic = path.join(CLIENT_BUILD_DIR, 'public');
    const targetPublic = path.join(BUNDLE_DIR, 'public');

    // Logic: In recent Vite builds, 'dist' IS the root.
    // If 'dist/public' exists, it means we have a nested public folder (incorrect).
    // If 'dist/public' does NOT exist, we assume 'dist' contains index.html and assets directly.

    if (fs.existsSync(sourcePublic)) {
        // This usually happens if public dir was copied into public/public
        console.log('⚠️ found nested public/public structure, correcting...');
        fs.cpSync(sourcePublic, targetPublic, { recursive: true });
    } else {
        // Standard Vite output
        console.log('✅ Standard Vite build structure detected. Copying dist content to bundle/public');
        fs.cpSync(CLIENT_BUILD_DIR, targetPublic, { recursive: true });
    }

    // 3. Zip it
    console.log('🤐 Zipping Bundle...');
    const output = fs.createWriteStream(path.join(__dirname, 'ods-energy-v15.2-beta.5.2.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('✅ Bundle V15.2-beta.5.2 created successfully: ods-energy-v15.2-beta.5.2.zip');
    });

    archive.pipe(output);
    archive.directory(BUNDLE_DIR, false);
    archive.finalize();
} catch (error: any) {
    const errorMsg = `❌ CRITICAL ERROR IN BUNDLE SCRIPT:\n${error.stack || error}\n`;
    console.error(errorMsg);
    fs.writeFileSync('bundle_error_v15_2.log', errorMsg);
    process.exit(1);
}
