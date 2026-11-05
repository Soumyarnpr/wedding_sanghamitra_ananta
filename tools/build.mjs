import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { syncMetadata } from './sync-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, 'dist');
const files = ['index.html', 'styles.css', 'content.js', 'calendar.js', 'render.js', 'script.js'];
// Confirm every input before replacing a previous build.
await Promise.all([...files, 'assets'].map(file => access(path.join(root, file))));
await syncMetadata();
// The only recursive removal is the explicitly verified build directory.
if (output === root || path.relative(root, output) !== 'dist') throw new Error('Unsafe build directory.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(path.join(root, file), path.join(output, file));
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Built static invitation in dist/.');
