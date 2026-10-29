/* =========================================================
   VocabLab — scripts/make-admin.mjs
   Promote (or demote) an existing account, without needing to
   sign in or open the panel:

     node scripts/make-admin.mjs khoind1410@gmail.com
     node scripts/make-admin.mjs khoind1410@gmail.com --remove

   Reads .env.local (or .env) like scripts/init-db.mjs, so the
   same connection string the app uses is enough. Passwords are
   never read, printed or changed: this only flips `role`, and
   clears a `pending` status so the panel is usable straight
   away.
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

const args = process.argv.slice(2);
const remove = args.includes('--remove');
const email = (args.find((a) => !a.startsWith('--')) || '').trim().toLowerCase();

if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email> [--remove]');
  process.exit(1);
}
if (!process.env.MONGODB_URI && process.env.VOCABLAB_DB_MODE !== 'local') {
  console.error('MONGODB_URI is missing. Put it in .env.local (never commit that file).');
  process.exit(1);
}

const Admin = require('../lib/admin.js');
const { ready, close, isLocal } = require('../lib/db.js');

try {
  const db = await ready();
  const users = db.collection('users');
  const user = await users.findOne({ emailNorm: email });

  if (!user) {
    console.error('No account uses ' + email + '.');
    const all = await users.find({}).toArray();
    if (all.length) {
      console.error('Accounts in this database (' + all.length + '):');
      all.slice(0, 25).forEach((u) => {
        console.error('  ' + (u.email || '(no email)') + '  — ' + Admin.roleOf(u) + ', ' + Admin.statusOf(u));
      });
      console.error('Sign up with the address you want first, then run this again.');
    } else {
      console.error('The database has no accounts yet: sign up in the app, then run this again.');
    }
    process.exitCode = 1;
  } else if (remove) {
    await users.updateOne(
      { _id: user._id },
      { $set: { role: Admin.ROLE_USER, updatedAt: new Date() } }
    );
    console.log('Done: ' + email + ' is a normal learner now.');
  } else {
    await users.updateOne(
      { _id: user._id },
      { $set: { role: Admin.ROLE_ADMIN, status: Admin.ACTIVE, updatedAt: new Date() } }
    );
    console.log('Done: ' + email + ' is now an admin (' + (isLocal() ? 'local file store' : 'MongoDB') + ').');
    console.log('Reload the app (or sign in again) and #/admin opens the panel.');
  }
} catch (err) {
  console.error('Could not update the account:', err.message);
  console.error('Check the connection string, the database user, and Atlas network access.');
  process.exitCode = 1;
} finally {
  await close();
}
