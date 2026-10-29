'use strict';
const H = require('../../lib/http');
const A = require('../../lib/auth');
const D = require('../../lib/db');
const Admin = require('../../lib/admin');

/**
 * POST /api/admin/user  { id, action }
 *
 * action: approve | ban | unban
 *
 * A ban takes effect on the next request, not on the next sign-in: every
 * session for that account is destroyed and requireUser rejects the status.
 */
module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['POST'])) return;
  if (!H.sameOrigin(req)) return H.fail(res, 403, 'Cross-site request blocked.');

  const db = await D.ready();
  const actor = await A.requireAdmin(db, req, res);
  if (!actor) return;

  const body = await H.readBody(req);
  const id = String(body.id || '').trim();
  const action = String(body.action || '').trim();
  if (!id) return H.fail(res, 400, 'Choose an account.');

  // Ids arrive as JSON strings; MongoDB stores ObjectIds, the local store keeps
  // the same 24-hex form as a string, so String(ObjectId) matches both.
  let key = id;
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      const { ObjectId } = require('mongodb');
      if (ObjectId.isValid(id)) key = new ObjectId(id);
    } catch (e) { /* keep the string id */ }
  }

  const target = await db.collection('users').findOne({ _id: key });
  if (!target) return H.fail(res, 404, 'That account no longer exists.');

  const decision = Admin.canModerate(actor, target, action);
  if (!decision.ok) return H.fail(res, 400, decision.error);

  const now = new Date();
  await db.collection('users').updateOne(
    { _id: target._id },
    { $set: { status: decision.status, updatedAt: now } }
  );
  if (decision.status === Admin.BANNED) {
    await A.destroyAllSessions(db, target._id);
  }

  await Admin.recordAudit(db, actor, action, target,
    action === 'ban' ? 'Suspended' : action === 'unban' ? 'Suspension lifted' : 'Approved');

  const fresh = await db.collection('users').findOne({ _id: target._id });
  H.json(res, 200, {
    ok: true,
    user: Admin.publicAdminUser(fresh || Object.assign({}, target, { status: decision.status }))
  });
});
