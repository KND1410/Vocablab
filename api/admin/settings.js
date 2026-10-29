'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');
const Admin = require('../../lib/admin');

/**
 * GET  /api/admin/settings  → { signupApproval }
 * PATCH /api/admin/settings { signupApproval } → same shape
 *
 * With approval on, a new account is created as "pending": no session, and
 * requireUser refuses it until an admin approves it. The first account on an
 * empty database is always let in (see api/auth/signup.js).
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET', 'PATCH'])) return;

  const db = await D.ready();
  const actor = await A.requireAdmin(db, req, res);
  if (!actor) return;

  if (req.method === 'GET') {
    return H.json(res, 200, await Admin.loadSettings(db));
  }
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const body = await H.readBody(req);
  if (typeof body.signupApproval !== 'boolean') {
    return H.fail(res, 400, 'signupApproval must be true or false.');
  }
  const next = await Admin.saveSettings(db, { signupApproval: body.signupApproval });
  await Admin.recordAudit(db, actor, 'settings', null,
    'Signup approval ' + (next.signupApproval ? 'on' : 'off'));
  H.json(res, 200, next);
});
