/* =========================================================
   VocabLab — lib/crypto.js
   Password hashing (scrypt), session tokens and recovery codes.
   Node's own crypto only: no bcrypt/jwt dependency.
   ========================================================= */
'use strict';
const crypto = require('node:crypto');

const S = { N: 16384, r: 8, p: 1, keylen: 64 };
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function scryptAsync(password, salt, opts) {
  return new Promise(function (resolve, reject) {
    crypto.scrypt(password, salt, opts.keylen, {
      N: opts.N, r: opts.r, p: opts.p, maxmem: 64 * 1024 * 1024
    }, function (err, key) {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(String(password), salt, S);
  return 'scrypt$' + S.N + '$' + S.r + '$' + S.p + '$' +
    salt.toString('base64') + '$' + key.toString('base64');
}

async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  if (!N || !r || !p) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (!salt.length || !expected.length) return false;
  try {
    const actual = await scryptAsync(String(password), salt, { N: N, r: r, p: p, keylen: expected.length });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (e) {
    return false;
  }
}

function randomToken(bytes) {
  return crypto.randomBytes(bytes || 32).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/** Human-friendly, unambiguous 10-character code (no I/L/O/U/0/1). */
function recoveryCode() {
  const bytes = crypto.randomBytes(10);
  let out = '';
  for (let i = 0; i < 10; i++) out += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
  return out.slice(0, 5) + '-' + out.slice(5);
}

function normalizeRecovery(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

module.exports = {
  hashPassword: hashPassword,
  verifyPassword: verifyPassword,
  randomToken: randomToken,
  sha256: sha256,
  recoveryCode: recoveryCode,
  normalizeRecovery: normalizeRecovery
};
