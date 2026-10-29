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
const Auth = require('../../lib/auth.js');
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
  user: { id: 'e2e-user', name: 'E2E Learner', email: 'e2e@local.test', role: 'user', status: 'active' },
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

/* ---------- Admin panel fixture ----------
   Three seeded accounts so the table always has one of each status to act on,
   plus whichever account the test signed up as. */
const panel = { settings: { signupApproval: false }, audit: [], members: [] };

function resetPanel(role) {
  account.user.role = role === 'admin' ? 'admin' : 'user';
  account.user.status = 'active';
  panel.settings = { signupApproval: false };
  panel.audit = [];
  const day = 24 * 3600 * 1000;
  panel.members = [
    {
      id: 'e2e-pending', name: 'Pending Pat', email: 'pat@example.com', role: 'user', status: 'pending',
      joinedAt: new Date(Date.now() - 2 * day).toISOString(), lastLoginAt: null,
      streak: { current: 0, best: 0 }, daysCompleted: 0
    },
    {
      id: 'e2e-banned', name: 'Banned Bea', email: 'bea@example.com', role: 'user', status: 'banned',
      joinedAt: new Date(Date.now() - 9 * day).toISOString(),
      lastLoginAt: new Date(Date.now() - 8 * day).toISOString(),
      streak: { current: 0, best: 4 }, daysCompleted: 11
    },
    {
      id: 'e2e-learner', name: 'Luc Martin', email: 'luc@example.com', role: 'user', status: 'active',
      joinedAt: new Date(Date.now() - 30 * day).toISOString(),
      lastLoginAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      streak: { current: 9, best: 11 }, daysCompleted: 60
    }
  ];
}

function adminRows() {
  const self = {
    id: account.user.id, name: account.user.name, email: account.user.email,
    role: account.user.role, status: account.user.status,
    joinedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(), streak: { current: 2, best: 3 }, daysCompleted: 12
  };
  const rank = { pending: 0, banned: 1, active: 2 };
  return [self].concat(panel.members).sort(function (a, b) {
    return (rank[a.status] == null ? 9 : rank[a.status]) - (rank[b.status] == null ? 9 : rank[b.status]);
  });
}

function adminStats(rows) {
  return {
    learners: rows.length,
    admins: rows.filter(function (u) { return u.role === 'admin'; }).length,
    pending: rows.filter(function (u) { return u.status === 'pending'; }).length,
    banned: rows.filter(function (u) { return u.status === 'banned'; }).length,
    joinedThisWeek: 1,
    activeThisWeek: 2,
    daysCompleted: rows.reduce(function (n, u) { return n + (u.daysCompleted || 0); }, 0)
  };
}

function logAction(action, target, detail) {
  panel.audit.unshift({
    at: new Date().toISOString(),
    actorName: account.user.name,
    action: action,
    targetName: target ? target.name : '',
    targetEmail: target ? target.email : '',
    detail: detail || ''
  });
}

function adminGuard(res) {
  if (!account.signedIn) { send(res, 401, { error: 'Please sign in.' }); return false; }
  if (account.user.role !== 'admin') { send(res, 403, { error: 'Admins only.' }); return false; }
  return true;
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
        email: String(body.email).slice(0, 160),
        // The panel role belongs to the fixture, not to the signup form.
        role: account.user.role || 'user',
        status: 'active'
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

  if (route === '/api/admin/users' && (req.method === 'GET' || !req.method)) {
    if (!adminGuard(res)) return;
    const rows = adminRows();
    return send(res, 200, {
      users: rows,
      stats: adminStats(rows),
      audit: panel.audit,
      settings: panel.settings,
      adminId: account.user.id
    });
  }

  if (route === '/api/admin/user') {
    if (!adminGuard(res)) return;
    const body = await readBody(req);
    const target = adminRows().filter(function (u) { return String(u.id) === String(body.id); })[0];
    if (!target) return send(res, 404, { error: 'That account no longer exists.' });
    if (String(target.id) === String(account.user.id)) {
      return send(res, 400, { error: 'You cannot change your own access.' });
    }
    const next = body.action === 'ban' ? 'banned' : 'active';
    const member = panel.members.filter(function (u) { return String(u.id) === String(body.id); })[0];
    if (member) member.status = next;
    else account.user.status = next;
    logAction(body.action, target, '');
    return send(res, 200, { ok: true, user: Object.assign({}, target, { status: next }) });
  }

  if (route === '/api/admin/settings') {
    if (!adminGuard(res)) return;
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      if (typeof body.signupApproval !== 'boolean') {
        return send(res, 400, { error: 'signupApproval must be true or false.' });
      }
      panel.settings = { signupApproval: body.signupApproval };
      logAction('settings', null, 'Signup approval ' + (body.signupApproval ? 'on' : 'off'));
    }
    return send(res, 200, panel.settings);
  }

  if (route === '/api/community') {
    if (!account.signedIn) return send(res, 401, { error: 'Please sign in.' });
    const now = Date.now();
    const members = [
      { id: account.user.id, name: account.user.name, email: Auth.maskEmail(account.user.email), joinedAt: '2026-10-04T09:00:00.000Z', lastLoginAt: new Date(now - 2 * 3600 * 1000).toISOString(), online: true, streak: { current: 2, best: 3 }, daysCompleted: 12 },
      { id: 'e2e-luc', name: 'Luc Martin', email: 'l***n@example.com', joinedAt: '2026-10-03T09:00:00.000Z', lastLoginAt: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), online: false, streak: { current: 9, best: 11 }, daysCompleted: 60 },
      { id: 'e2e-mai', name: 'Mai Nguyen', email: 'm***i@example.com', joinedAt: '2026-10-02T09:00:00.000Z', lastLoginAt: new Date(now - 10 * 60 * 1000).toISOString(), online: true, streak: { current: 5, best: 9 }, daysCompleted: 40 }
    ].sort(function (a, b) {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return b.streak.current - a.streak.current || a.name.localeCompare(b.name);
    });
    return send(res, 200, { users: members, total: members.length });
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
  if (String(req.url).indexOf('/__e2e__/reset') === 0) {
    account.signedIn = false;
    resetPanel(new URL(req.url, 'http://127.0.0.1').searchParams.get('role'));
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
