/* =========================================================
   VocabLab — lib/local-db.js
   A tiny file-backed store used when MONGODB_URI is not set,
   so sign-in, accounts, quests and streaks keep working on a
   machine with no database.

   It implements only the collection surface the app actually
   uses (findOne, insertOne, updateOne, findOneAndUpdate,
   deleteOne, deleteMany, createIndex, command). Data lives in
   .data/local-db.json, which is git-ignored: accounts here are
   local to this machine and are never synced to MongoDB.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = process.env.VOCABLAB_LOCAL_DB ||
  path.join(process.cwd(), '.data', 'local-db.json');

/* The same unique indexes scripts/init-db.mjs creates in MongoDB. */
const UNIQUE = {
  users: ['emailNorm'],
  sessions: ['tokenHash'],
  daily: ['userId|date']
};

function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function writeStore(store) {
  const dir = path.dirname(FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, FILE);
}

function newId() {
  return crypto.randomBytes(12).toString('hex');
}

function dupKeyError(name, keys) {
  const err = new Error('E11000 duplicate key error collection: ' + name +
    ' index: ' + keys.join('+') + ' dup key');
  err.code = 11000;
  return err;
}

/** Equality only, plus the `null matches null-or-missing` behaviour the app relies on. */
function matches(doc, filter) {
  return Object.keys(filter || {}).every(function (key) {
    const want = filter[key];
    if (want === null || want === undefined) return doc[key] == null;
    if (key === '_id') return String(doc[key]) === String(want);
    const got = doc[key];
    if (got === want) return true;
    if (got instanceof Date || want instanceof Date) {
      return new Date(got).getTime() === new Date(want).getTime();
    }
    return false;
  });
}

function applyUpdate(doc, update) {
  const set = (update && update.$set) || {};
  const inc = (update && update.$inc) || {};
  const onInsert = (update && update.$setOnInsert) || {};
  let changed = false;
  Object.keys(onInsert).forEach(function (key) {
    if (doc[key] === undefined) { doc[key] = onInsert[key]; changed = true; }
  });
  Object.keys(set).forEach(function (key) {
    if (JSON.stringify(doc[key]) !== JSON.stringify(set[key])) changed = true;
    doc[key] = set[key];
  });
  Object.keys(inc).forEach(function (key) {
    doc[key] = Number(doc[key] || 0) + Number(inc[key] || 0);
    changed = true;
  });
  return changed;
}

/** Only simple equality filters are supported, which is all the app uses. */
function seedFromFilter(filter) {
  const doc = {};
  Object.keys(filter || {}).forEach(function (key) {
    if (filter[key] === null || filter[key] === undefined) return;
    if (key === '_id') doc._id = String(filter[key]);
    else doc[key] = filter[key];
  });
  return doc;
}

function collection(name) {
  function rows(store) {
    if (!Array.isArray(store[name])) store[name] = [];
    return store[name];
  }
  function find(store, filter) {
    return rows(store).find(function (doc) { return matches(doc, filter); }) || null;
  }
  function checkUnique(store, doc, ignore) {
    const rules = UNIQUE[name] || [];
    for (const rule of rules) {
      const keys = rule.split('|');
      const clash = store[name].find(function (other) {
        if (other === ignore) return false;
        return keys.every(function (key) { return String(other[key]) === String(doc[key]); });
      });
      if (clash) throw dupKeyError(name, keys);
    }
  }

  return {
    /* Indexes are enforced on write instead, so this only has to succeed. */
    createIndex: async function () { return 'ok'; },

    findOne: async function (filter) {
      return find(readStore(), filter);
    },

    insertOne: async function (doc) {
      const store = readStore();
      if (doc._id == null) doc._id = newId();
      const bucket = rows(store);
      if (bucket.some(function (d) { return String(d._id) === String(doc._id); })) {
        throw dupKeyError(name, ['_id']);
      }
      checkUnique(store, doc, null);
      bucket.push(doc);
      writeStore(store);
      return { insertedId: doc._id, acknowledged: true };
    },

    updateOne: async function (filter, update, options) {
      const store = readStore();
      const doc = find(store, filter);
      if (!doc) {
        if (!options || !options.upsert) return { matchedCount: 0, modifiedCount: 0 };
        const fresh = Object.assign(seedFromFilter(filter), (update && update.$set) || {});
        if (fresh._id == null) fresh._id = newId();
        checkUnique(store, fresh, null);
        rows(store).push(fresh);
        applyUpdate(fresh, update);
        writeStore(store);
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: fresh._id };
      }
      const changed = applyUpdate(doc, update);
      writeStore(store);
      return { matchedCount: 1, modifiedCount: changed ? 1 : 0 };
    },

    /* Returns the document itself, matching `includeResultMetadata: false`. */
    findOneAndUpdate: async function (filter, update, options) {
      const store = readStore();
      let doc = find(store, filter);
      if (!doc) {
        if (!options || !options.upsert) return null;
        doc = seedFromFilter(filter);
        if (doc._id == null) doc._id = newId();
        checkUnique(store, doc, null);
        rows(store).push(doc);
      }
      applyUpdate(doc, update);
      writeStore(store);
      return doc;
    },

    deleteOne: async function (filter) {
      const store = readStore();
      const bucket = rows(store);
      const index = bucket.findIndex(function (doc) { return matches(doc, filter); });
      if (index < 0) return { deletedCount: 0 };
      bucket.splice(index, 1);
      writeStore(store);
      return { deletedCount: 1 };
    },

    deleteMany: async function (filter) {
      const store = readStore();
      const bucket = rows(store);
      let deleted = 0;
      for (let i = bucket.length - 1; i >= 0; i--) {
        if (matches(bucket[i], filter)) { bucket.splice(i, 1); deleted += 1; }
      }
      if (deleted) writeStore(store);
      return { deletedCount: deleted };
    }
  };
}

const collections = Object.create(null);

module.exports = {
  mode: 'local',
  file: FILE,
  db: function () {
    return {
      databaseName: 'local',
      collection: function (name) {
        if (!collections[name]) collections[name] = collection(name);
        return collections[name];
      },
      command: async function (cmd) {
        if (cmd && cmd.ping) return { ok: 1 };
        return { ok: 1 };
      }
    };
  }
};