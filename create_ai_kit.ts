import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUNDLE_NAME = 'Archivo para asistente IA.zip';
const OUTPUT_DIR = __dirname;

async function createKit() {
    console.log(`Creating AI Assistant Kit: ${BUNDLE_NAME}...`);

    const output = fs.createWriteStream(path.join(OUTPUT_DIR, BUNDLE_NAME));
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log(`Kit created successfully at ${path.join(OUTPUT_DIR, BUNDLE_NAME)}`);
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

    // --- ROOT DOCUMENTATION ---
    const docs = [
        'AI_CONTEXT.md',
        'README-DEPLOY-PRODUCTION.md',
        'ROLES_AND_PERMISSIONS.md',
        'DATABASE_STRUCTURE.md',
        'DEPLOYMENT_LUCUSHOST.md'
    ];

    docs.forEach(doc => {
        if (fs.existsSync(path.join(__dirname, doc))) {
            archive.file(path.join(__dirname, doc), { name: doc });
        }
    });

    // --- CONFIGURATION ---
    if (fs.existsSync(path.join(__dirname, '.env.example'))) {
        archive.file(path.join(__dirname, '.env.example'), { name: '.env.example' });
    }
    archive.file(path.join(__dirname, 'package.json'), { name: 'package.json' });
    if (fs.existsSync(path.join(__dirname, 'package.prod.json'))) {
        archive.file(path.join(__dirname, 'package.prod.json'), { name: 'package.prod.json' });
    }

    // --- ENTRY POINTS ---
    if (fs.existsSync(path.join(__dirname, 'start.cjs'))) {
        archive.file(path.join(__dirname, 'start.cjs'), { name: 'start.cjs' });
    }
    if (fs.existsSync(path.join(__dirname, 'app.js'))) {
        archive.file(path.join(__dirname, 'app.js'), { name: 'app.js' });
    }

    // --- DATABASE SCRIPTS ---
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

    // --- SOURCE CODE ---

    // Server
    archive.directory(path.join(__dirname, 'server'), 'server');

    // Drizzle
    archive.directory(path.join(__dirname, 'drizzle'), 'drizzle');

    // Shared
    if (fs.existsSync(path.join(__dirname, 'shared'))) {
        archive.directory(path.join(__dirname, 'shared'), 'shared');
    }

    // Client (Source only, exclude node_modules and dist)
    // Using glob to be precise
    archive.glob('client/**/*', {
        cwd: __dirname,
        ignore: ['client/node_modules/**', 'client/dist/**', 'client/.vite/**']
    });

    // --- ARTIFACTS / DOCS ---
    // Task.md and Walkthrough.md are in the artifact directory, not root.
    // I need to locate them. They are usually at c:\Users\Omar\.gemini\antigravity\brain\...
    // But since I can't easily rely on that path in this script (it runs in user space),
    // I will try to read them from the exact path I know via tools, OR
    // write them to a temporary location first directly in the tool chain.
    // Wait, the user said "Tus DOCX...". I can just read them and write them to the zip using archive.append if I had the content.
    // But this script runs on the machine. 
    // I need to copy the artifacts to the root first or pass their paths.

    // BETTER STRATEGY: I will assume the user has these files or I will copy them to a 'docs' folder before running this script.
    // Oh wait, I am the agent. I can use `write_to_file` to create `docs/task.md` and `docs/walkthrough.md` 
    // with the content I have access to, right before running this script.

    if (fs.existsSync(path.join(__dirname, 'docs'))) {
        archive.directory(path.join(__dirname, 'docs'), 'docs');
    }

    await archive.finalize();
}

createKit().catch(console.error);
