import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (target !== root && !target.startsWith(root + sep)) throw new Error('Ruta no permitida');
    if (!(await stat(target)).isFile()) throw new Error('Archivo no encontrado');
    response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('No encontrado');
  }
}).listen(port, '127.0.0.1', () => console.log(`Sistema disponible en http://127.0.0.1:${port}`));
