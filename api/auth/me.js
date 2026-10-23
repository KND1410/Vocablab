'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;
  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;
  H.json(res, 200, { user: A.publicUser(user) });
});
