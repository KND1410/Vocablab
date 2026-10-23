/* =========================================================
   VocabLab — scripts/init-db.mjs
   Create the Atlas indexes once: node scripts/init-db.mjs

   Reads .env.local (or .env) without an extra dependency.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

for (const name of ['.env.local', '.env']) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || process.env[m[1]] != null) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[m[1]] = value;
  }
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Put it in .env.local (never commit that file).');
  process.exit(1);
}

const { ready, close } = require('../lib/db.js');

try {
  const db = await ready();
  const collections = await db.listCollections().toArray();
  console.log('Connected to database "' + db.databaseName + '".');
  console.log('Collections: ' + (collections.map((c) => c.name).join(', ') || '(none yet)'));
  console.log('Indexes are ready: users.emailNorm, sessions.tokenHash, sessions.expiresAt, daily(userId+date), throttle.expiresAt.');
} catch (err) {
  console.error('Could not initialise the database:', err.message);
  console.error('Check the connection string, the database user, and Atlas network access.');
  process.exitCode = 1;
} finally {
  await close();
}
