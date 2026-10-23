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
  const code = C.normalizeRecovery(body.code);
  const password = body.password;
  if (!A.validEmail(email) || !code) {
    return H.fail(res, 400, 'Enter your email and recovery code.');
  }
  const pwError = A.checkPassword(password);
  if (pwError) return H.fail(res, 400, pwError);

  const db = await D.ready();
  const ipLimit = await H.rateLimit(db, 'reset:ip:' + H.ip(req), 10, 15 * 60 * 1000);
  if (!ipLimit.ok) return H.fail(res, 429, 'Too many attempts. Wait a few minutes and try again.');
  const emailLimit = await H.rateLimit(db, 'reset:email:' + email, 6, 15 * 60 * 1000);
  if (!emailLimit.ok) return H.fail(res, 429, 'Too many attempts. Wait a few minutes and try again.');

  const user = await A.findByEmail(db, email);
  if (!user) {
    await C.hashPassword(code).catch(function () {});
    return H.fail(res, 400, 'Email or recovery code is wrong.');
  }
  const ok = await C.verifyPassword(code, user.recovery);
  if (!ok) return H.fail(res, 400, 'Email or recovery code is wrong.');

  const newRecovery = C.recoveryCode();
  const now = new Date();
  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: {
        password: await C.hashPassword(password),
        recovery: await C.hashPassword(C.normalizeRecovery(newRecovery)),
        updatedAt: now
      }
    }
  );
  await A.destroyAllSessions(db, user._id);

  const token = await A.createSession(db, user._id);
  A.setSessionCookie(res, req, token);
  user.recovery = null;
  H.json(res, 200, {
    user: A.publicUser(user),
    recoveryCode: newRecovery,
    message: 'Password changed. Save your new recovery code.'
  });
});
