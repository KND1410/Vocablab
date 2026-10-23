/* =========================================================
   VocabLab — lib/db.js
   One cached MongoDB client per warm serverless instance.
   ========================================================= */
'use strict';
const { MongoClient } = require('mongodb');

const globalKey = '__vocablabMongo';
const cache = globalThis[globalKey] || (globalThis[globalKey] = { clientPromise: null, indexPromise: null });

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
  const c = await client();
  return c.db(process.env.MONGODB_DB || 'vocablab');
}

/** Idempotent index setup, once per warm instance. */
async function ready() {
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
  if (!cache.clientPromise) return;
  try {
    const c = await cache.clientPromise;
    await c.close();
  } catch (e) { /* ignore */ }
  cache.clientPromise = null;
  cache.indexPromise = null;
}

module.exports = { getDb: getDb, ready: ready, close: close };
