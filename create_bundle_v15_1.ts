
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const BUNDLE_DIR = path.join(__dirname, 'deployment_bundle_v15_1');
    const CLIENT_BUILD_DIR = path.join(__dirname, 'dist');

    if (fs.existsSync(BUNDLE_DIR)) {
        fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BUNDLE_DIR);

    console.log('📦 Starting V15.1 Bundle Creation (Button Ref Fix)...');

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
            js: `/** ODS Energy V15.1 - Button Ref Forwarding Fix **/`,
        },
    });

    if (result.metafile) {
        fs.writeFileSync('bundle_meta_v15_1.json', JSON.stringify(result.metafile, null, 2));
        console.log('📊 Metafile created: bundle_meta_v15_1.json');
    }

    console.log('📂 Preparing Folders...');
    // Folders
    fs.cpSync(path.join(__dirname, 'server'), path.join(BUNDLE_DIR, 'server'), { recursive: true });
    fs.cpSync(path.join(__dirname, 'drizzle'), path.join(BUNDLE_DIR, 'drizzle'), { recursive: true });

    // Update package.json contents for production
    pkg.version = "15.1.0";
    pkg.main = "server.cjs";
    pkg.scripts.start = "NODE_ENV=production node server.cjs";
    delete pkg.scripts.dev;
    delete pkg.scripts['build:server'];

    fs.writeFileSync(path.join(BUNDLE_DIR, 'package.json'), JSON.stringify(pkg, null, 2));

    // 2.2 Create server.cjs proxy
    console.log('📝 Creating server.cjs proxy...');
    const serverCjsContent = `/**
 * ODS Energy - Entry Point for cPanel (V15.1)
 * Button Ref Forwarding Fix
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
console.log("[ODS] ODS Energy V15.1 - Startup");
console.log("[ODS] Time: " + new Date().toISOString());
console.log("[ODS] CWD: " + process.cwd());
console.log("[ODS] Version: 15.1.0");
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

    if (fs.existsSync(sourcePublic)) {
        fs.cpSync(sourcePublic, targetPublic, { recursive: true });
        console.log('✅ Static files copied to /public');
    } else {
        console.log('⚠️ Source not found at: ' + sourcePublic + '. Copying /dist as /public');
        fs.cpSync(CLIENT_BUILD_DIR, targetPublic, { recursive: true });
    }

    // 3. Zip it
    console.log('🤐 Zipping Bundle...');
    const output = fs.createWriteStream(path.join(__dirname, 'ods-energy-v15.1.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('✅ Bundle V15.1 created successfully: ods-energy-v15.1.zip');
    });

    archive.pipe(output);
    archive.directory(BUNDLE_DIR, false);
    archive.finalize();
} catch (error: any) {
    const errorMsg = `❌ CRITICAL ERROR IN BUNDLE SCRIPT:\n${error.stack || error}\n`;
    console.error(errorMsg);
    fs.writeFileSync('bundle_error_v15_1.log', errorMsg);
    process.exit(1);
}
