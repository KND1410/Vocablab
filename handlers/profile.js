'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['PATCH'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  const body = await H.readBody(req);
  const name = A.cleanName(body.name);
  if (!name) return H.fail(res, 400, 'Your name is required.');

  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { name: name, updatedAt: new Date() } }
  );
  user.name = name;
  H.json(res, 200, { user: A.publicUser(user) });
});
