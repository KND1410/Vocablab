/* =========================================================
   VocabLab — scripts/dev-server.mjs
   A zero-config local server: the static app plus the same
   api/ handlers Vercel runs. Sign-in works with plain Node —
   no Vercel login, no MongoDB (see lib/local-db.js).

     node scripts/dev-server.mjs        http://localhost:3000
     PORT=4000 node scripts/dev-server.mjs
   ========================================================= */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
/* PORT=0 would ask the OS for a random port, so only a positive PORT counts. */
const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 3000;

/* Same file vercel dev reads, so a MONGODB_URI added later is picked up. */
const envFile = path.join(root, '.env.local');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(function (line) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith('#')) return;
    if (process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  });
}

const HANDLERS = {
  '/api/health': 'api/health.js',
  '/api/home': 'api/home.js',
  '/api/profile': 'api/profile.js',
  '/api/auth/signup': 'api/auth/signup.js',
  '/api/auth/login': 'api/auth/login.js',
  '/api/auth/logout': 'api/auth/logout.js',
  '/api/auth/me': 'api/auth/me.js',
  '/api/auth/reset': 'api/auth/reset.js',
  '/api/daily/progress': 'api/daily/progress.js'
};
const loaded = Object.create(null);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

function send(res, status, body, type) {
  res.statusCode = status;
  if (type) res.setHeader('Content-Type', type);
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), 'application/json; charset=utf-8');
}

function serveApi(req, res, pathname) {
  const file = HANDLERS[pathname];
  if (!file) {
    sendJson(res, 404, { error: 'Not found.' });
    return;
  }
  if (!loaded[file]) loaded[file] = require(path.join(root, file));
  loaded[file](req, res);
}

/** Never serve secrets or local-only material: .env*, .data/, .git/, my-sheet*,
 *  the source PDFs, node_modules, and the local agent guidance file. */
export function isBlocked(rel) {
  return rel.split('/').some(function (part) { return part.startsWith('.'); }) ||
    /^node_modules(\/|$)/.test(rel) || /^my-sheet/.test(rel) || /\.pdf$/i.test(rel) ||
    rel === 'AGENTS.md';
}

function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = path.resolve(root, rel);
  // Never serve outside the project.
  if (file !== root && !file.startsWith(root + path.sep)) {
    sendJson(res, 403, { error: 'Forbidden.' });
    return;
  }
  if (isBlocked(rel)) {
    sendJson(res, 404, { error: 'Not found.' });
    return;
  }
  let target = file;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    // Hash routing keeps everything on one URL; unknown paths show the app.
    if (!path.extname(target)) target = path.join(root, 'index.html');
    else { sendJson(res, 404, { error: 'Not found.' }); return; }
  }
  send(res, 200, fs.readFileSync(target), TYPES[path.extname(target)] || 'application/octet-stream');
}

/* Only listen when executed directly, so tests can import isBlocked(). */
const startedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (startedDirectly) {
  const server = http.createServer(function (req, res) {
    const pathname = String(req.url || '/').split('?')[0];
    try {
      if (pathname.startsWith('/api/')) serveApi(req, res, pathname);
      else serveStatic(res, pathname);
    } catch (err) {
      console.error('[dev-server]', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Server error.' });
    }
  });

  server.listen(port, '127.0.0.1', function () {
    const local = process.env.MONGODB_URI && process.env.VOCABLAB_DB_MODE !== 'local'
      ? 'mongodb' : 'local file store';
    const bound = server.address().port;
    console.log('VocabLab on http://localhost:' + bound + '  (accounts: ' + local + ')');
  });
}

export { HANDLERS, TYPES, serveApi, serveStatic };