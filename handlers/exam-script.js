'use strict';
const H = require('../lib/http');
const A = require('../lib/auth');
const D = require('../lib/db');
const S = require('../lib/script');

/**
 * GET /api/exam-script?exam=blanc-1
 *
 * The examiner's reference brief for one paper, for a signed-in learner. The
 * browser needs it because AI calls go straight from the browser to the
 * provider: the brief is part of the correction prompt, not of a server call.
 * It is not rendered in the interface.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;

  const examId = S.cleanExamId(new URL(req.url, 'http://localhost').searchParams.get('exam'));
  if (!examId) return H.fail(res, 400, 'Choose an exam.');

  const db = await D.ready();
  const user = await A.requireUser(db, req, res);
  if (!user) return;

  const doc = await db.collection('content').findOne({ _id: S.docId(examId) });
  const brief = S.publicScript(doc);
  H.json(res, 200, {
    examId: examId,
    text: brief ? brief.text : '',
    updatedAt: brief ? brief.updatedAt : null
  });
});
