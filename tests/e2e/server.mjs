/* Local-only E2E server: static app + in-memory account API.
   No Atlas connection, no real credentials. Start with:
     node tests/e2e/server.mjs
   or let Playwright start it through playwright.config.mjs. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const Quests = require('../../js/quests.js');
const port = Number(process.env.E2E_PORT || 4173);
const host = process.env.E2E_HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function today() { return Quests.dateKey(new Date()); }

const account = {
  signedIn: false,
  user: { id: 'e2e-user', name: 'E2E Learner', email: 'e2e@local.test' },
  password: 'local-test-password',
  streak: { current: 2, best: 3, lastCompletedDate: Quests.addDays(today(), -1) },
  daily: {
    date: today(),
    quests: [
      { id: 'mc30', target: 30, progress: 0, done: false },
      { id: 'paragraph1', target: 1, progress: 0, done: false },
      { id: 'grammar1', target: 1, progress: 0, done: false }
    ],
    allDone: false,
    completedAt: null
  }
};

function readBody(req) {
  return new Promise(function (resolve) {
    let raw = '';
    req.on('data', function (chunk) { raw += chunk; });
    req.on('end', function () {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { resolve({}); }
    });
  });
}

function send(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function resetDailyIfNeeded() {
  const date = today();
  if (account.daily.date === date) return;
  account.daily = {
    date: date,
    quests: [
      { id: 'mc30', target: 30, progress: 0, done: false },
      { id: 'paragraph1', target: 1, progress: 0, done: false },
      { id: 'grammar1', target: 1, progress: 0, done: false }
    ],
    allDone: false,
    completedAt: null
  };
}

async function apiHandler(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const route = url.pathname;

  if (route === '/api/auth/signup' || route === '/api/auth/login') {
    const body = await readBody(req);
    if (!body.email || !body.password) {
      return send(res, 400, { error: 'Enter your email and password.' });
    }
    if (route === '/api/auth/signup') {
      if (!body.name) return send(res, 400, { error: 'Enter your name.' });
      account.user = {
        id: 'e2e-user',
        name: String(body.name).slice(0, 60),
        email: String(body.email).slice(0, 160)
      };
      account.password = String(body.password);
    }
    if (String(body.email) !== account.user.email || String(body.password) !== account.password) {
      return send(res, 401, { error: 'Email or password is incorrect.' });
    }
    account.signedIn = true;
    const payload = { user: account.user };
    if (route === '/api/auth/signup') payload.recoveryCode = 'E2E-LOCAL-1';
    return send(res, route === '/api/auth/signup' ? 201 : 200, payload);
  }

  if (route === '/api/auth/me') {
    if (!account.signedIn) return send(res, 401, { error: 'Please sign in.' });
    return send(res, 200, { user: account.user });
  }

  if (route === '/api/auth/logout') {
    account.signedIn = false;
    return send(res, 200, { ok: true });
  }

  if (route === '/api/profile') {
    if (!account.signedIn) return send(res, 401, { error: 'Please sign in.' });
    const body = await readBody(req);
    if (body.name) account.user.name = String(body.name).slice(0, 60);
    return send(res, 200, { user: account.user });
  }

  if (route === '/api/home') {
    if (!account.signedIn) return send(res, 401, { error: 'Please sign in.' });
    resetDailyIfNeeded();
    return send(res, 200, {
      user: account.user,
      streak: Quests.streakView(account.streak, account.daily.date, !!account.daily.completedAt),
      daily: account.daily,
      serverToday: account.daily.date
    });
  }

  if (route === '/api/daily/progress') {
    if (!account.signedIn) return send(res, 401, { error: 'Please sign in.' });
    const body = await readBody(req);
    let completedNow = false;
    if (body.date === account.daily.date) {
      const quest = Quests.findQuest(account.daily, body.questId);
      if (quest) {
        Quests.setProgress(account.daily, body.questId, body.progress);
        if (Quests.isAnyDone(account.daily) && !account.daily.completedAt) {
          account.daily.completedAt = new Date().toISOString();
          account.streak = Quests.nextStreak(account.streak, body.date);
          completedNow = true;
        }
      }
    }
    return send(res, 200, {
      daily: account.daily,
      streak: Quests.streakView(account.streak, account.daily.date, !!account.daily.completedAt),
      completedNow: completedNow
    });
  }

  return send(res, 404, { error: 'Not found.' });
}

const server = http.createServer(function (req, res) {
  if (req.url === '/__e2e__/reset') {
    account.signedIn = false;
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (req.url.indexOf('/api/') === 0) {
    apiHandler(req, res).catch(function () { send(res, 500, { error: 'E2E server error.' }); });
    return;
  }
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  const stat = fs.statSync(file);
  const range = req.headers.range;
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(String(range));
  if (match && stat.size) {
    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
    if (!isFinite(start) || !isFinite(end) || start > end || start >= stat.size) {
      res.writeHead(416, { 'content-range': 'bytes */' + stat.size });
      res.end();
      return;
    }
    end = Math.min(end, stat.size - 1);
    res.writeHead(206, {
      'content-type': type,
      'accept-ranges': 'bytes',
      'content-range': 'bytes ' + start + '-' + end + '/' + stat.size,
      'content-length': String(end - start + 1),
      'cache-control': 'no-store'
    });
    fs.createReadStream(file, { start: start, end: end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'content-type': type,
    'accept-ranges': 'bytes',
    'content-length': String(stat.size),
    'cache-control': 'no-store'
  });
  res.end(fs.readFileSync(file));
});

server.listen(port, host, function () {
  console.log('E2E server listening on http://' + host + ':' + port);
});
