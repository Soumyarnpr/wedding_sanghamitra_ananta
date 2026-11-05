import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['content.js', 'calendar.js', 'render.js', 'script.js', 'tools/serve.mjs', 'tools/sync-metadata.mjs', 'tools/build.mjs', 'tools/check.mjs', 'tools/test-calendar.mjs'];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checks passed for ${files.length} JavaScript files.`);
