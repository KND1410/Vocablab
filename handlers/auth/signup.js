'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const C = require('../../lib/crypto');
const D = require('../../lib/db');
const Admin = require('../../lib/admin');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['POST'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const body = await H.readBody(req);
  const name = A.cleanName(body.name);
  const email = A.normalizeEmail(body.email);
  const password = body.password;

  if (!name) return H.fail(res, 400, 'Your name is required.');
  if (!A.validEmail(email)) return H.fail(res, 400, 'Enter a valid email address.');
  const pwError = A.checkPassword(password);
  if (pwError) return H.fail(res, 400, pwError);

  const db = await D.ready();
  const limit = await H.rateLimit(db, 'signup:ip:' + H.ip(req), 5, 60 * 60 * 1000);
  if (!limit.ok) return H.fail(res, 429, 'Too many accounts from this address. Try again later.');

  if (await A.findByEmail(db, email)) {
    return H.fail(res, 409, 'An account with that email already exists.');
  }

  // When the admin requires approval, a new account is created but gets no
  // session until it is approved. The very first account on an empty database
  // is never held back, so the panel can always be reached.
  const settings = await Admin.loadSettings(db);
  let needsApproval = !!settings.signupApproval;
  if (needsApproval) {
    const everyone = await db.collection('users').find({}).toArray();
    needsApproval = everyone.length > 0;
  }

  const recoveryCode = C.recoveryCode();
  let user;
  try {
    user = await A.createUser(db, {
      name: name,
      email: email,
      password: password,
      recoveryCode: recoveryCode,
      status: needsApproval ? Admin.PENDING : Admin.ACTIVE
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return H.fail(res, 409, 'An account with that email already exists.');
    }
    throw err;
  }

  await A.claimAdmin(db, user);
  if (needsApproval) {
    return H.json(res, 201, { user: A.publicUser(user), recoveryCode: recoveryCode, pending: true });
  }

  const token = await A.createSession(db, user._id);
  A.setSessionCookie(res, req, token);
  H.json(res, 201, { user: A.publicUser(user), recoveryCode: recoveryCode });
});
