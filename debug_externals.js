
import fs from 'fs';
const meta = JSON.parse(fs.readFileSync('bundle_meta.json', 'utf8'));
const output = meta.outputs['deployment_bundle_v12_4/ods_backend/index.cjs'];
if (output) {
    const externals = new Set();
    output.imports.forEach(imp => {
        if (imp.external) {
            externals.add(imp.path);
        }
    });
    console.log('EXTERNALS:');
    Array.from(externals).sort().forEach(ext => console.log(' - ' + ext));
} else {
    console.log('Output not found in metafile');
}
