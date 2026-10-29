'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');
const Admin = require('../../lib/admin');

/**
 * GET /api/admin/users
 *
 * Everything the panel draws in one call: the account list, the counters above
 * it, the signup-approval setting and the most recent admin actions. Admin only,
 * and passwords/recovery hashes never leave the database — only the fields in
 * Admin.publicAdminUser.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;

  const db = await D.ready();
  const actor = await A.requireAdmin(db, req, res);
  if (!actor) return;

  const rows = await db.collection('users').find({}).toArray();

  // How many days each learner finished at least one quest — the same moment a
  // streak advances, so this is a real practice count.
  const finished = await db.collection('daily').find({ completedAt: { $ne: null } }).toArray();
  const days = Object.create(null);
  finished.forEach(function (doc) {
    const key = String(doc.userId);
    days[key] = (days[key] || 0) + 1;
  });

  const now = Date.now();
  const enriched = rows.map(function (u) {
    return Object.assign({}, u, { daysCompleted: days[String(u._id)] || 0 });
  });

  const users = Admin.sortUsers(enriched.map(function (u) {
    return Admin.publicAdminUser(u, { daysCompleted: u.daysCompleted, now: now });
  }));

  const auditRows = await db.collection('audit').find({}).toArray();
  const audit = auditRows
    .slice()
    .sort(function (a, b) {
      return (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0);
    })
    .slice(0, 20)
    .map(Admin.publicAudit);

  H.json(res, 200, {
    users: users,
    stats: Admin.statsFrom(enriched, now),
    audit: audit,
    settings: await Admin.loadSettings(db),
    adminId: String(actor._id)
  });
});
