'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');
const Daily = require('../../lib/daily');
const Quests = require('../../js/quests');

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['POST'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  const body = await H.readBody(req);
  const date = String(body.date || '');
  const questId = String(body.questId || '');
  const progress = Number(body.progress);

  const badDate = Daily.checkDate(date);
  if (badDate) return H.fail(res, 400, badDate);
  if (!Quests.def(questId)) return H.fail(res, 400, 'Unknown quest.');
  if (!isFinite(progress)) return H.fail(res, 400, 'Invalid progress.');

  const result = await Daily.applyProgress(db, user, date, questId, progress);
  if (result.error) return H.fail(res, 400, result.error);
  H.json(res, 200, result);
});
