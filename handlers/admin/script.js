'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');
const Admin = require('../../lib/admin');
const S = require('../../lib/script');

/**
 * GET  /api/admin/script              → { scripts: [{ examId, text, chars }] }
 * POST /api/admin/script { examId, text }
 *
 * The reference brief the AI reads before correcting one exam paper (a
 * transcript, a model answer, the expected arguments). Empty text removes it.
 * Admin only: this is the examiner's material, not student content.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET', 'POST'])) return;

  const db = await D.ready();
  const actor = await A.requireAdmin(db, req, res);
  if (!actor) return;

  if (req.method === 'GET') {
    const rows = await db.collection('content').find({}).toArray();
    const scripts = rows
      .map(S.publicScript)
      .filter(Boolean)
      .sort(function (a, b) { return a.examId.localeCompare(b.examId); });
    return H.json(res, 200, { scripts: scripts, maxChars: S.MAX_CHARS });
  }

  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const body = await H.readBody(req);
  const examId = S.cleanExamId(body.examId);
  if (!examId) return H.fail(res, 400, 'Choose an exam.');
  if (body.text != null && typeof body.text !== 'string') {
    return H.fail(res, 400, 'The brief must be text.');
  }

  const text = S.normalize(body.text);
  const id = S.docId(examId);
  const now = new Date();

  if (!text) {
    await db.collection('content').deleteOne({ _id: id });
    await Admin.recordAudit(db, actor, 'script', null, 'Brief cleared: ' + examId);
    return H.json(res, 200, { examId: examId, text: '', chars: 0, updatedAt: null });
  }

  await db.collection('content').updateOne(
    { _id: id },
    { $set: { examId: examId, text: text, updatedAt: now } },
    { upsert: true }
  );
  await Admin.recordAudit(db, actor, 'script', null,
    'Brief saved: ' + examId + ' (' + text.length + ' characters)');
  H.json(res, 200, {
    examId: examId,
    text: text,
    chars: text.length,
    updatedAt: now.toISOString()
  });
});
