'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['POST'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const db = await D.ready();
  await A.destroySession(db, req);
  A.clearSessionCookie(res, req);
  H.json(res, 200, { ok: true });
});
