/* =========================================================
   VocabLab — lib/db.js
   One cached MongoDB client per warm serverless instance.
   ========================================================= */
'use strict';
const { MongoClient } = require('mongodb');
const local = require('./local-db');

const globalKey = '__vocablabMongo';
const cache = globalThis[globalKey] || (globalThis[globalKey] = { clientPromise: null, indexPromise: null });

/**
 * No connection string means no database. Rather than failing every request
 * (which leaves the app stuck on the sign-in screen), accounts and quest data
 * are kept in a local git-ignored file instead. Set MONGODB_URI to go back to
 * MongoDB; nothing is shared between the two. VOCABLAB_DB_MODE=local forces the
 * local store even when a URI is configured (for example when Atlas is
 * unreachable from this machine).
 */
function isLocal() {
  if (process.env.VOCABLAB_DB_MODE === 'local') return true;
  return !process.env.MONGODB_URI;
}

function uri() {
  const value = process.env.MONGODB_URI;
  if (!value) throw new Error('MONGODB_URI is not set. Add it in Vercel and in .env.local.');
  return value;
}

function client() {
  if (!cache.clientPromise) {
    const c = new MongoClient(uri(), {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000
    });
    cache.clientPromise = c.connect().then(function () { return c; }).catch(function (err) {
      cache.clientPromise = null;
      throw err;
    });
  }
  return cache.clientPromise;
}

async function getDb() {
  if (isLocal()) return local.db();
  const c = await client();
  return c.db(process.env.MONGODB_DB || 'vocablab');
}

/** Idempotent index setup, once per warm instance. */
async function ready() {
  if (isLocal()) return local.db();
  const db = await getDb();
  if (!cache.indexPromise) {
    cache.indexPromise = Promise.all([
      db.collection('users').createIndex({ emailNorm: 1 }, { unique: true }),
      db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('daily').createIndex({ userId: 1, date: 1 }, { unique: true }),
      db.collection('throttle').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    ]).catch(function (err) {
      cache.indexPromise = null;
      throw err;
    });
  }
  await cache.indexPromise;
  return db;
}

/** Used by scripts/init-db.mjs only. */
async function close() {
  if (isLocal()) return;
  if (!cache.clientPromise) return;
  try {
    const c = await cache.clientPromise;
    await c.close();
  } catch (e) { /* ignore */ }
  cache.clientPromise = null;
  cache.indexPromise = null;
}

module.exports = { getDb: getDb, ready: ready, close: close, isLocal: isLocal };
