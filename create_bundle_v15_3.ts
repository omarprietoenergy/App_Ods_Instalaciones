import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "v15.3-beta.0.4"; // Must match package.json and DashboardLayout
const BUNDLE_NAME = `ods-energy-${VERSION}.zip`;
const OUTPUT_DIR = __dirname; // Root

// ... (previous code)


async function createBundle() {
    console.log(`Creating deployment bundle: ${BUNDLE_NAME}...`);

    const output = fs.createWriteStream(path.join(OUTPUT_DIR, BUNDLE_NAME));
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log(`Bundle created successfully at ${path.join(OUTPUT_DIR, BUNDLE_NAME)}`);
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    // 1. Add Build Artifacts (Backend & Frontend)
    // Assumes 'npm run build' has been run already!

    // Backend Entry Point
    if (fs.existsSync(path.join(__dirname, 'ods_backend', 'index.cjs'))) {
        archive.file(path.join(__dirname, 'ods_backend', 'index.cjs'), { name: 'ods_backend/index.cjs' });
    } else {
        console.warn("WARNING: ods_backend/index.cjs not found. Did you run 'npm run build'?");
    }

    // Frontend: Move dist/public -> public (ROOT) to avoid ENOENT in production
    if (fs.existsSync(path.join(__dirname, 'dist', 'public'))) {
        archive.directory(path.join(__dirname, 'dist', 'public'), 'public');
    } else {
        // Fallback: zip 'dist' content into 'public' if dist/public doesn't exist
        archive.directory(path.join(__dirname, 'dist'), 'public');
    }

    // 2. Add Configuration & Environment
    // DO NOT include .env or .env.production
    if (fs.existsSync(path.join(__dirname, '.env.example'))) {
        archive.file(path.join(__dirname, '.env.example'), { name: '.env.example' });
    }
    archive.file(path.join(__dirname, 'package.prod.json'), { name: 'package.json' });

    // 3. Add Startup Wrappers (Passenger Compliance)
    // start.cjs
    archive.append(
        `const app = require("./ods_backend/index.cjs");\nmodule.exports = app;`,
        { name: 'start.cjs' }
    );
    // app.js (Fallback)
    archive.append(
        `module.exports = require("./start.cjs");`,
        { name: 'app.js' }
    );

    // 4. Add Documentation & Migration
    archive.file(path.join(__dirname, 'migration_v15_3.sql'), { name: 'migration_v15_3.sql' });

    // CRITICAL: Ensure the expenses migration is included
    if (fs.existsSync(path.join(__dirname, 'migration_v15_3_expenses.sql'))) {
        archive.file(path.join(__dirname, 'migration_v15_3_expenses.sql'), { name: 'migration_v15_3_expenses.sql' });
    } else {
        console.warn("WARNING: migration_v15_3_expenses.sql not found!");
    }

    // Optional: Read walkthrough and add it?
    // artifacts might not be in root.
    // Let's just focus on the essential app files.

    await archive.finalize();
}

createBundle().catch(console.error);
