'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');

/**
 * GET /api/community
 *
 * The member directory shown on #/community. Any signed-in learner can read it;
 * emails are masked server-side (see A.maskEmail) so the list never exposes a
 * full address, and only the public fields leave the database.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;

  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  const rows = await db.collection('users').find({}).toArray();
  const users = rows.map(function (u) {
    return {
      id: String(u._id),
      name: u.name || 'Learner',
      email: A.maskEmail(u.email),
      joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null
    };
  }).sort(function (a, b) {
    // Newest members first, then alphabetical, so the order is stable.
    const byDate = String(b.joinedAt || '').localeCompare(String(a.joinedAt || ''));
    return byDate || a.name.localeCompare(b.name);
  });

  H.json(res, 200, { users: users, total: users.length });
});
