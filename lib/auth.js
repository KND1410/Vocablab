/* =========================================================
   VocabLab — lib/auth.js
   Accounts, sessions and validation. No external services.
   ========================================================= */
'use strict';
const C = require('./crypto');
const H = require('./http');

const COOKIE = 'vl_session';
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validEmail(email) {
  const value = normalizeEmail(email);
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function cleanName(name) {
  return String(name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60);
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 200) return 'That password is too long.';
  return '';
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name || 'Learner',
    email: user.email || '',
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null
  };
}

/**
 * Community-safe email: keep the first letter, the last letter (when there is
 * one) and the domain, so members can recognise each other without the whole
 * address list being readable. "khoind1410@gmail.com" -> "k***0@gmail.com".
 */
function maskEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return '';
  const at = value.lastIndexOf('@');
  if (at < 1) return value.charAt(0) + '***';
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.charAt(0);
  const tail = local.length > 1 ? local.charAt(local.length - 1) : '';
  return head + '***' + tail + (domain ? '@' + domain : '');
}

async function findByEmail(db, email) {
  return db.collection('users').findOne({ emailNorm: normalizeEmail(email) });
}

async function createUser(db, data) {
  const now = new Date();
  const doc = {
    name: cleanName(data.name) || 'Learner',
    email: normalizeEmail(data.email),
    emailNorm: normalizeEmail(data.email),
    password: await C.hashPassword(data.password),
    recovery: await C.hashPassword(C.normalizeRecovery(data.recoveryCode)),
    streak: { current: 0, best: 0, lastCompletedDate: '' },
    createdAt: now,
    updatedAt: now
  };
  const result = await db.collection('users').insertOne(doc);
  doc._id = result.insertedId;
  return doc;
}

async function createSession(db, userId) {
  const token = C.randomToken(32);
  const now = new Date();
  await db.collection('sessions').insertOne({
    tokenHash: C.sha256(token),
    userId: userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MS)
  });
  return token;
}

function setSessionCookie(res, req, token) {
  res.setHeader('Set-Cookie', H.cookie(COOKIE, token, {
    maxAge: SESSION_MS / 1000,
    secure: H.isSecure(req)
  }));
}

function clearSessionCookie(res, req) {
  res.setHeader('Set-Cookie', H.cookie(COOKIE, '', {
    maxAge: 0,
    secure: H.isSecure(req)
  }));
}

function sessionToken(req) {
  return H.parseCookies(req)[COOKIE] || '';
}

async function userFromRequest(db, req) {
  const token = sessionToken(req);
  if (!token) return null;
  const sessions = db.collection('sessions');
  const session = await sessions.findOne({ tokenHash: C.sha256(token) });
  if (!session) return null;
  if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    await sessions.deleteOne({ _id: session._id }).catch(function () {});
    return null;
  }
  const user = await db.collection('users').findOne({ _id: session.userId });
  if (!user) {
    await sessions.deleteOne({ _id: session._id }).catch(function () {});
    return null;
  }
  return user;
}

async function requireUser(db, req, res) {
  const user = await userFromRequest(db, req);
  if (!user) {
    H.fail(res, 401, 'Please sign in.');
    return null;
  }
  return user;
}

async function destroySession(db, req) {
  const token = sessionToken(req);
  if (!token) return;
  await db.collection('sessions').deleteOne({ tokenHash: C.sha256(token) });
}

async function destroyAllSessions(db, userId) {
  await db.collection('sessions').deleteMany({ userId: userId });
}

module.exports = {
  COOKIE: COOKIE,
  SESSION_DAYS: SESSION_DAYS,
  normalizeEmail: normalizeEmail,
  validEmail: validEmail,
  cleanName: cleanName,
  checkPassword: checkPassword,
  verifyPassword: C.verifyPassword,
  publicUser: publicUser,
  maskEmail: maskEmail,
  findByEmail: findByEmail,
  createUser: createUser,
  createSession: createSession,
  setSessionCookie: setSessionCookie,
  clearSessionCookie: clearSessionCookie,
  sessionToken: sessionToken,
  userFromRequest: userFromRequest,
  requireUser: requireUser,
  destroySession: destroySession,
  destroyAllSessions: destroyAllSessions
};
