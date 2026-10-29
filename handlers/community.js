'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');
const Quests = require('../js/quests');

/** Someone seen this recently is treated as online in the directory. */
const ONLINE_MS = 15 * 60 * 1000;

function timeOf(value) {
  if (!value) return 0;
  const at = new Date(value).getTime();
  return isFinite(at) ? at : 0;
}

/**
 * GET /api/community
 *
 * The member directory shown on #/community. Any signed-in learner can read it;
 * emails are masked server-side (see A.maskEmail) so the list never exposes a
 * full address, and only the public fields leave the database.
 *
 * Order: online members first, then by current streak (highest first) within
 * each group, so the most active learners surface at the top.
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

  // Accounts created before lastLoginAt existed fall back to their most recent
  // session, which is still a real sign-in date.
  const sessions = await db.collection('sessions').find({}).toArray();
  const lastSession = Object.create(null);
  sessions.forEach(function (s) {
    if (!s.createdAt) return;
    const at = new Date(s.createdAt).getTime();
    if (!isFinite(at)) return;
    const key = String(s.userId);
    if (!lastSession[key] || at > lastSession[key]) lastSession[key] = at;
  });

  const today = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();
  const users = rows.map(function (u) {
    const key = String(u._id);
    const streak = Quests.streakView(u.streak, today, false);
    const loginAt = timeOf(u.lastLoginAt) || lastSession[key] || 0;
    const seenAt = Math.max(timeOf(u.lastSeenAt), loginAt);
    return {
      id: key,
      name: u.name || 'Learner',
      email: A.maskEmail(u.email),
      joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
      lastLoginAt: loginAt ? new Date(loginAt).toISOString() : null,
      online: seenAt > nowMs - ONLINE_MS,
      streak: { current: streak.current, best: streak.best },
      daysCompleted: days[key] || 0
    };
  }).sort(function (a, b) {
    // Online first; inside each group the longest current streak leads, then
    // the name keeps the order stable for equal streaks.
    if (a.online !== b.online) return a.online ? -1 : 1;
    const byStreak = (b.streak.current || 0) - (a.streak.current || 0);
    if (byStreak) return byStreak;
    return a.name.localeCompare(b.name) ||
      String(b.joinedAt || '').localeCompare(String(a.joinedAt || ''));
  });

  H.json(res, 200, { users: users, total: users.length });
});
