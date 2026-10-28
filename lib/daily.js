/* =========================================================
   VocabLab — lib/daily.js
   Today's quest document and the streak transition.
   ========================================================= */
'use strict';
const Quests = require('../js/quests');
const Auth = require('./auth');

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The client sends its local date. Accept up to a day ahead (UTC+14) and a
 * few days behind, so a weekend offline still syncs instead of being lost.
 */
function checkDate(date) {
  if (!Quests.isDateKey(date)) return 'Invalid date.';
  const diff = Quests.daysBetween(utcToday(), date);
  if (!isFinite(diff) || diff > 1 || diff < -3) return 'Date is out of range.';
  return '';
}

function serializeDaily(doc) {
  if (!doc) return null;
  return {
    date: doc.date,
    quests: (doc.quests || []).map(function (q) {
      return { id: q.id, target: q.target, progress: q.progress, done: !!q.done };
    }),
    allDone: !!doc.allDone,
    completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : null
  };
}

async function getOrCreate(db, user, date) {
  const coll = db.collection('daily');
  let doc = await coll.findOne({ userId: user._id, date: date });
  if (doc) return doc;
  const fresh = Quests.newDaily(String(user._id), date);
  try {
    await coll.insertOne({
      userId: user._id,
      date: date,
      quests: fresh.quests,
      allDone: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (err) {
    // Another warm instance created it first; the unique index makes that safe.
    if (!err || err.code !== 11000) throw err;
  }
  return coll.findOne({ userId: user._id, date: date });
}

async function home(db, user, date) {
  const daily = await getOrCreate(db, user, date);
  return {
    user: Auth.publicUser(user),
    streak: Quests.streakView(user.streak, date, !!daily.completedAt),
    daily: serializeDaily(daily)
  };
}

/**
 * Absolute progress, merged monotonically. The first request that finishes
 * any quest claims `completedAt` and advances the streak exactly once.
 */
async function applyProgress(db, user, date, questId, value) {
  const daily = await getOrCreate(db, user, date);
  const quest = Quests.findQuest(daily, questId);
  if (!quest) return { error: 'Unknown quest.' };

  const wasComplete = !!daily.completedAt;
  Quests.setProgress(daily, questId, value);
  const now = new Date();
  await db.collection('daily').updateOne(
    { _id: daily._id },
    { $set: { quests: daily.quests, allDone: daily.allDone, updatedAt: now } }
  );

  let completedNow = false;
  if (Quests.isAnyDone(daily) && !wasComplete) {
    const claim = await db.collection('daily').updateOne(
      { _id: daily._id, completedAt: null },
      { $set: { completedAt: now, updatedAt: now } }
    );
    if (claim.modifiedCount) {
      completedNow = true;
      const freshUser = await db.collection('users').findOne({ _id: user._id });
      const next = Quests.nextStreak(freshUser && freshUser.streak, date);
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { streak: next, updatedAt: now } }
      );
      user.streak = next;
    }
  }

  const latest = await db.collection('daily').findOne({ _id: daily._id });
  const latestUser = await db.collection('users').findOne({ _id: user._id });
  return {
    daily: serializeDaily(latest),
    streak: Quests.streakView(latestUser && latestUser.streak, date, !!latest.completedAt),
    completedNow: completedNow
  };
}

module.exports = {
  utcToday: utcToday,
  checkDate: checkDate,
  serializeDaily: serializeDaily,
  getOrCreate: getOrCreate,
  home: home,
  applyProgress: applyProgress
};
