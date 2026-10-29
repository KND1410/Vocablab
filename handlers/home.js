'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');
const Daily = require('../lib/daily');

function query(req, name) {
  try { return new URL(req.url, 'http://localhost').searchParams.get(name) || ''; }
  catch (e) { return ''; }
}

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;
  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  // Presence for the community directory: opening the app is the signal, so
  // the write lives here rather than on every request. A failed stamp must
  // never stop the home page from loading.
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { lastSeenAt: new Date() } }
  ).catch(function () {});

  const date = query(req, 'date') || Daily.utcToday();
  const badDate = Daily.checkDate(date);
  if (badDate) return H.fail(res, 400, badDate);

  const data = await Daily.home(db, user, date);
  data.serverToday = Daily.utcToday();
  H.json(res, 200, data);
});
