'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const C = require('../../lib/crypto');
const D = require('../../lib/db');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['POST'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const body = await H.readBody(req);
  const email = A.normalizeEmail(body.email);
  const password = body.password;
  if (!A.validEmail(email) || typeof password !== 'string') {
    return H.fail(res, 400, 'Enter your email and password.');
  }

  const db = await D.ready();
  const ipLimit = await H.rateLimit(db, 'login:ip:' + H.ip(req), 30, 15 * 60 * 1000);
  if (!ipLimit.ok) return H.fail(res, 429, 'Too many attempts. Wait a few minutes and try again.');
  const emailLimit = await H.rateLimit(db, 'login:email:' + email, 8, 15 * 60 * 1000);
  if (!emailLimit.ok) return H.fail(res, 429, 'Too many attempts. Wait a few minutes and try again.');

  const user = await A.findByEmail(db, email);
  if (!user) {
    // Spend the same scrypt time as a real check so timing does not reveal accounts.
    await C.hashPassword(password).catch(function () {});
    return H.fail(res, 401, 'Email or password is wrong.');
  }
  const ok = await A.verifyPassword(password, user.password);
  if (!ok) return H.fail(res, 401, 'Email or password is wrong.');

  const token = await A.createSession(db, user._id);
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } }
  );
  A.setSessionCookie(res, req, token);
  H.json(res, 200, { user: A.publicUser(user) });
});
