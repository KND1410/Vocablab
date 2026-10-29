/* =========================================================
   VocabLab — lib/admin.js
   The rules behind the single-admin panel: who is an admin,
   what an admin may do to another account, and the shape of
   the data the panel shows. No HTTP, no I/O in the checks —
   they are plain functions so the logic tests can pin them.
   ========================================================= */
'use strict';

const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';

const ACTIVE = 'active';
const PENDING = 'pending';
const BANNED = 'banned';

/** Actions POST /api/admin/user accepts. */
const ACTIONS = ['approve', 'ban', 'unban'];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdmin(user) {
  return !!user && user.role === ROLE_ADMIN && !isBanned(user);
}

function isBanned(user) {
  return !!user && user.status === BANNED;
}

function isPending(user) {
  return !!user && user.status === PENDING;
}

function roleOf(user) {
  return user && user.role === ROLE_ADMIN ? ROLE_ADMIN : ROLE_USER;
}

/** Old accounts have no status field: missing means active. */
function statusOf(user) {
  if (!user) return ACTIVE;
  if (user.status === BANNED) return BANNED;
  if (user.status === PENDING) return PENDING;
  return ACTIVE;
}

/**
 * Decide the role for an account that is signing in.
 *
 *   1. accounts already marked admin stay admin;
 *   2. ADMIN_EMAIL in the environment always wins;
 *   3. while nobody is an admin, the oldest account claims the panel, so a
 *      database that predates this feature still gets one without a script.
 *
 * `ctx` = { adminEmail, adminsExist, oldestId }.
 */
function chooseRole(user, ctx) {
  if (!user) return ROLE_USER;
  if (user.role === ROLE_ADMIN) return ROLE_ADMIN;
  const c = ctx || {};
  const wanted = normalizeEmail(c.adminEmail);
  const mine = normalizeEmail(user.email);
  if (wanted && mine && wanted === mine) return ROLE_ADMIN;
  if (!c.adminsExist && c.oldestId != null && String(c.oldestId) === String(user._id)) {
    return ROLE_ADMIN;
  }
  return ROLE_USER;
}

/**
 * May `actor` apply `action` to `target`?
 * Returns { ok, status } on success or { ok: false, error } on refusal.
 * An admin can never lock themselves out, and a single admin cannot be
 * suspended by anyone — the panel would be unreachable.
 */
function canModerate(actor, target, action) {
  if (!isAdmin(actor)) return { ok: false, error: 'Admins only.' };
  if (!target) return { ok: false, error: 'Unknown account.' };
  if (ACTIONS.indexOf(action) === -1) return { ok: false, error: 'Unknown action.' };
  if (String(actor._id) === String(target._id)) {
    return { ok: false, error: 'You cannot change your own access.' };
  }
  if (isAdmin(target) && action === 'ban') {
    return { ok: false, error: 'Another admin cannot be suspended.' };
  }
  const status = statusOf(target);
  if (action === 'ban' && status === BANNED) {
    return { ok: false, error: 'That account is already suspended.' };
  }
  if (action === 'unban' && status !== BANNED) {
    return { ok: false, error: 'That account is not suspended.' };
  }
  if (action === 'approve' && status === ACTIVE) {
    return { ok: false, error: 'That account is already active.' };
  }
  return { ok: true, status: action === 'ban' ? BANNED : ACTIVE };
}

function normalizeSettings(doc) {
  return { signupApproval: !!(doc && doc.signupApproval) };
}

function timeOf(value) {
  if (!value) return 0;
  const at = new Date(value).getTime();
  return isFinite(at) ? at : 0;
}

/** The row the panel renders. Never includes the password or recovery hash. */
function publicAdminUser(user, extra) {
  const e = extra || {};
  const streak = user.streak || {};
  const lastSeen = Math.max(timeOf(user.lastSeenAt), timeOf(user.lastLoginAt));
  return {
    id: String(user._id),
    name: user.name || 'Learner',
    email: user.email || '',
    role: roleOf(user),
    status: statusOf(user),
    joinedAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    lastLoginAt: lastSeen ? new Date(lastSeen).toISOString() : null,
    streak: { current: Number(streak.current) || 0, best: Number(streak.best) || 0 },
    daysCompleted: Number(e.daysCompleted) || 0,
    online: Number(e.now || Date.now()) - lastSeen < 15 * 60 * 1000 && lastSeen > 0
  };
}

/** Accounts needing attention first: pending, then suspended, then everyone. */
const STATUS_RANK = { pending: 0, banned: 1, active: 2 };

function sortUsers(rows) {
  return rows.slice().sort(function (a, b) {
    const byStatus = (STATUS_RANK[a.status] == null ? 9 : STATUS_RANK[a.status]) -
      (STATUS_RANK[b.status] == null ? 9 : STATUS_RANK[b.status]);
    if (byStatus) return byStatus;
    const byJoin = String(a.joinedAt || '').localeCompare(String(b.joinedAt || ''));
    if (byJoin) return byJoin;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function statsFrom(users, nowMs) {
  const now = nowMs || Date.now();
  const stats = {
    learners: 0, admins: 0, pending: 0, banned: 0,
    joinedThisWeek: 0, activeThisWeek: 0, daysCompleted: 0
  };
  users.forEach(function (u) {
    stats.learners += 1;
    if (u.role === ROLE_ADMIN) stats.admins += 1;
    if (u.status === PENDING) stats.pending += 1;
    if (u.status === BANNED) stats.banned += 1;
    const joined = timeOf(u.createdAt);
    if (joined && now - joined < WEEK_MS) stats.joinedThisWeek += 1;
    const seen = Math.max(timeOf(u.lastSeenAt), timeOf(u.lastLoginAt));
    if (seen && now - seen < WEEK_MS) stats.activeThisWeek += 1;
    stats.daysCompleted += Number(u.daysCompleted) || 0;
  });
  return stats;
}

/** One row per admin action, so changes can be explained months later. */
function auditDoc(actor, action, target, detail) {
  return {
    at: new Date(),
    actorId: actor ? String(actor._id) : '',
    actorName: (actor && actor.name) || 'Admin',
    action: String(action || ''),
    targetId: target ? String(target._id) : '',
    targetName: (target && target.name) || '',
    targetEmail: (target && target.email) || '',
    detail: detail == null ? '' : String(detail).slice(0, 400)
  };
}

function publicAudit(row) {
  return {
    at: row.at ? new Date(row.at).toISOString() : null,
    actorName: row.actorName || 'Admin',
    action: row.action || '',
    targetName: row.targetName || '',
    targetEmail: row.targetEmail || '',
    detail: row.detail || ''
  };
}

async function recordAudit(db, actor, action, target, detail) {
  try {
    await db.collection('audit').insertOne(auditDoc(actor, action, target, detail));
  } catch (e) {
    // An audit write must never turn a successful action into an error.
    if (typeof console !== 'undefined') console.warn('[admin] audit write failed:', e && e.message);
  }
}

async function loadSettings(db) {
  try {
    const doc = await db.collection('settings').findOne({ _id: 'app' });
    return normalizeSettings(doc);
  } catch (e) {
    return normalizeSettings(null);
  }
}

async function saveSettings(db, patch) {
  const current = await loadSettings(db);
  const next = normalizeSettings(Object.assign({}, current, patch || {}));
  await db.collection('settings').updateOne(
    { _id: 'app' },
    { $set: { signupApproval: next.signupApproval, updatedAt: new Date() } },
    { upsert: true }
  );
  return next;
}

module.exports = {
  ROLE_ADMIN: ROLE_ADMIN,
  ROLE_USER: ROLE_USER,
  ACTIVE: ACTIVE,
  PENDING: PENDING,
  BANNED: BANNED,
  ACTIONS: ACTIONS,
  isAdmin: isAdmin,
  isBanned: isBanned,
  isPending: isPending,
  roleOf: roleOf,
  statusOf: statusOf,
  chooseRole: chooseRole,
  canModerate: canModerate,
  normalizeSettings: normalizeSettings,
  publicAdminUser: publicAdminUser,
  sortUsers: sortUsers,
  statsFrom: statsFrom,
  auditDoc: auditDoc,
  publicAudit: publicAudit,
  recordAudit: recordAudit,
  loadSettings: loadSettings,
  saveSettings: saveSettings,
  normalizeEmail: normalizeEmail
};
