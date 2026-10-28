'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');
const Quests = require('../js/quests');

/**
 * GET /api/community
 *
 * The member directory shown on #/community. Any signed-in learner can read it;
 * emails are masked server-side (see A.maskEmail) so the list never exposes a
 * full address, and only the public fields leave the database.
 *
 * Progress is the number of days the member has finished at least one daily
 * quest (the same moment a streak advances), plus their current and best
 * streak. Vocabulary mastery lives only in the browser, so it cannot be shown
 * for other people.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;

  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  const rows = await db.collection('users').find({}).toArray();
  const finished = await db.collection('daily').find({ completedAt: { $ne: null } }).toArray();
  const days = Object.create(null);
  finished.forEach(function (doc) {
    const key = String(doc.userId);
    days[key] = (days[key] || 0) + 1;
  });

  const today = new Date().toISOString().slice(0, 10);
  const users = rows.map(function (u) {
    const streak = Quests.streakView(u.streak, today, false);
    return {
      id: String(u._id),
      name: u.name || 'Learner',
      email: A.maskEmail(u.email),
      joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      streak: { current: streak.current, best: streak.best },
      daysCompleted: days[String(u._id)] || 0
    };
  }).sort(function (a, b) {
    // Newest members first, then alphabetical, so the order is stable.
    const byDate = String(b.joinedAt || '').localeCompare(String(a.joinedAt || ''));
    return byDate || a.name.localeCompare(b.name);
  });

  H.json(res, 200, { users: users, total: users.length });
});
