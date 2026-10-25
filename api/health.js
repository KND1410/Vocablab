'use strict';
const H = require('../lib/http');
const D = require('../lib/db');

/** A safe category for setup problems; never return the URI or credentials. */
function classify(err) {
  const name = String((err && err.name) || '');
  const code = err && (err.code != null ? err.code : err.codeName);
  const message = String((err && err.message) || '');
  if (name === 'MongoParseError' || /invalid.*(uri|connection string)/i.test(message)) return 'uri';
  if (name === 'MongoServerSelectionError') {
    if (/ENOTFOUND|EAI_AGAIN/i.test(message)) return 'dns';
    if (/ETIMEDOUT|timed out|timeout/i.test(message)) return 'timeout';
    if (/certificate|SSL|TLS/i.test(message)) return 'tls';
    return 'network';
  }
  if (code === 18 || code === 8000 || /bad auth|authentication failed/i.test(message)) return 'auth';
  if (code === 13 || /not authorized|unauthorized/i.test(message)) return 'permissions';
  if (code === 11000) return 'index-conflict';
  if (name === 'MongoNetworkError' || /ECONNREFUSED|ENETUNREACH|EHOSTUNREACH/i.test(message)) return 'network';
  return 'unknown';
}

module.exports = H.wrap(async function (req, res) {
  if (!H.method(req, res, ['GET'])) return;

  const out = {
    configured: Boolean(process.env.MONGODB_URI),
    mode: process.env.MONGODB_URI ? 'mongodb' : 'local',
    database: process.env.MONGODB_DB || 'vocablab',
    connected: false
  };

  if (!out.configured) {
    // No connection string: accounts live in the local file store, so the
    // account service itself is working and sign-in is available.
    out.connected = true;
    out.local = true;
    out.reason = 'no-mongodb-uri';
    return H.json(res, 200, out);
  }

  try {
    const db = await D.ready();
    await db.command({ ping: 1 });
    out.connected = true;
    return H.json(res, 200, out);
  } catch (err) {
    out.reason = classify(err);
    out.error = (err && err.name) || 'Error';
    if (err && err.code != null) out.code = err.code;
    console.error('[vocablab] health check failed:', err);
    return H.json(res, 500, out);
  }
});
