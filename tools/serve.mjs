import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';

const root = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.ics': 'text/calendar; charset=utf-8'
};
function staysInside(filePath) {
  const relative = path.relative(root, filePath);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
function reply(response, code, text) {
  response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(text);
}
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    reply(response, 405, 'Method not allowed');
    return;
  }
  try {
    const pathname = decodeURIComponent((request.url || '/').split('?')[0].split('#')[0]);
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) {
      reply(response, 404, 'Not found');
      return;
    }
    let filename = path.resolve(root, `.${pathname.startsWith('/') ? pathname : `/${pathname}`}`);
    if (!staysInside(filename)) { reply(response, 404, 'Not found'); return; }
    let info = await stat(filename);
    if (info.isDirectory()) {
      filename = path.join(filename, 'index.html');
      info = await stat(filename);
    }
    // Resolve symlinks before serving so a link cannot expose files outside root.
    filename = await realpath(filename);
    if (!staysInside(filename) || !info.isFile()) { reply(response, 404, 'Not found'); return; }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size
    });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(filename).on('error', () => response.destroy()).pipe(response);
  } catch (error) {
    reply(response, error instanceof URIError ? 400 : 404, error instanceof URIError ? 'Invalid URL' : 'Not found');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to another number.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Wedding invitation preview: http://localhost:${port}`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
