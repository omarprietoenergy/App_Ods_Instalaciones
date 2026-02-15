
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "v15.3-hotfix.8";
const BUNDLE_NAME = `ods-energy-${VERSION}-compiled-deploy.zip`;
const OUTPUT_DIR = __dirname;

async function createCompiledHotfixZip() {
    console.log(`Creating Compiled Hotfix Deployment Zip: ${BUNDLE_NAME}...`);

    const output = fs.createWriteStream(path.join(OUTPUT_DIR, BUNDLE_NAME));
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log(`Compiled Hotfix zip created successfully at ${path.join(OUTPUT_DIR, BUNDLE_NAME)}`);
    });

    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            throw err;
        }
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(output);

    // --- COMPILED ARTIFACTS ---

    // 1. Backend (Compiled)
    if (fs.existsSync(path.join(__dirname, 'ods_backend', 'index.cjs'))) {
        archive.file(path.join(__dirname, 'ods_backend', 'index.cjs'), { name: 'ods_backend/index.cjs' });
    } else {
        throw new Error("Missing ods_backend/index.cjs. Did build fail?");
    }

    // 2. Frontend (Compiled Assets)
    // We want the contents of 'dist' to be inside 'public' in the zip (or just 'public' if that's how server expects it)
    // In production, express static serves from 'public'.
    // `npm run build:client` puts files in `dist`.
    // We should zip `dist` CONTENT into `public` folder in zip.
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
        archive.directory(path.join(__dirname, 'dist'), 'public');
    } else {
        throw new Error("Missing dist/ directory. Did build fail?");
    }

    // --- CONFIGURATION ---

    // Package.json - Use package.prod.json as the main package.json
    if (fs.existsSync(path.join(__dirname, 'package.prod.json'))) {
        archive.file(path.join(__dirname, 'package.prod.json'), { name: 'package.json' });
    } else {
        archive.file(path.join(__dirname, 'package.json'), { name: 'package.json' });
    }

    // --- STARTUP SCRIPTS ---
    if (fs.existsSync(path.join(__dirname, 'start.cjs'))) {
        archive.file(path.join(__dirname, 'start.cjs'), { name: 'start.cjs' });
    }
    if (fs.existsSync(path.join(__dirname, 'app.js'))) {
        archive.file(path.join(__dirname, 'app.js'), { name: 'app.js' });
    }

    // --- DATABASE MIGRATIONS ---
    const sqlFiles = [
        'init_database.sql',
        'migration_v15_3.sql',
        'migration_v15_3_expenses.sql'
    ];
    sqlFiles.forEach(f => {
        if (fs.existsSync(path.join(__dirname, f))) {
            archive.file(path.join(__dirname, f), { name: f });
        }
    });

    // --- Drizzle Schema ---
    // Sometimes needed for migration scripts running via node if they import schema directly, 
    // but usually compiled bundle has it. 
    // However, if the user runs manual migrations, having the SQL files is enough. dizzzle folder might be useful.
    archive.directory(path.join(__dirname, 'drizzle'), 'drizzle');

    // We do NOT need server/ or client/ source folders for execution.

    await archive.finalize();
}

createCompiledHotfixZip().catch(console.error);
