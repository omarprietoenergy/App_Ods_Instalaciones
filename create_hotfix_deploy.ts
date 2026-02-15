
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "v15.3-hotfix.1";
const BUNDLE_NAME = `ods-energy-${VERSION}-deploy.zip`;
const OUTPUT_DIR = __dirname;

async function createHotfixZip() {
    console.log(`Creating Hotfix Deployment Zip: ${BUNDLE_NAME}...`);

    const output = fs.createWriteStream(path.join(OUTPUT_DIR, BUNDLE_NAME));
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log(`Hotfix zip created successfully at ${path.join(OUTPUT_DIR, BUNDLE_NAME)}`);
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

    // --- SOURCE CODE FOR DEPLOYMENT ---

    // Core Directories
    archive.directory(path.join(__dirname, 'server'), 'server');
    archive.directory(path.join(__dirname, 'drizzle'), 'drizzle');
    if (fs.existsSync(path.join(__dirname, 'shared'))) {
        archive.directory(path.join(__dirname, 'shared'), 'shared');
    }

    // Client (Source)
    archive.glob('client/**/*', {
        cwd: __dirname,
        ignore: ['client/node_modules/**', 'client/dist/**', 'client/.vite/**']
    });

    // Configuration Files (Exclude .env)
    archive.file(path.join(__dirname, 'package.json'), { name: 'package.json' });
    archive.file(path.join(__dirname, 'tsconfig.json'), { name: 'tsconfig.json' });
    if (fs.existsSync(path.join(__dirname, 'vite.config.ts'))) {
        archive.file(path.join(__dirname, 'vite.config.ts'), { name: 'vite.config.ts' });
    }

    // Startup Files
    if (fs.existsSync(path.join(__dirname, 'start.cjs'))) {
        archive.file(path.join(__dirname, 'start.cjs'), { name: 'start.cjs' });
    }
    if (fs.existsSync(path.join(__dirname, 'app.js'))) {
        archive.file(path.join(__dirname, 'app.js'), { name: 'app.js' });
    }

    // Database Scripts
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

    // Verification Script (Optional, but good for reference)
    if (fs.existsSync(path.join(__dirname, 'verify_login_fix.ts'))) {
        archive.file(path.join(__dirname, 'verify_login_fix.ts'), { name: 'verify_login_fix.ts' });
    }

    await archive.finalize();
}

createHotfixZip().catch(console.error);
