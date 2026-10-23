/* =========================================================
   VocabLab — lib/http.js
   Small helpers shared by every serverless function.
   ========================================================= */
'use strict';

const MAX_BODY = 32 * 1024;

function json(res, status, payload) {
  const body = JSON.stringify(payload == null ? {} : payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function fail(res, status, message, extra) {
  const payload = { error: message || 'Something went wrong.' };
  if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
  json(res, status, payload);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    if (req.body != null) {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return resolve(req.body);
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
      return parse(raw);
    }
    let raw = '';
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', function () { parse(raw); });
    req.on('error', reject);
    function parse(text) {
      if (!text) return resolve({});
      try { resolve(JSON.parse(text)); }
      catch (e) { reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 })); }
    }
  });
}

function method(req, res, allowed) {
  if (allowed.indexOf(req.method) !== -1) return true;
  res.setHeader('Allow', allowed.join(', '));
  fail(res, 405, 'Method not allowed.');
  return false;
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i < 0) return;
    const key = part.slice(0, i).trim();
    if (!key) return;
    try { out[key] = decodeURIComponent(part.slice(i + 1).trim()); }
    catch (e) { out[key] = part.slice(i + 1).trim(); }
  });
  return out;
}

function cookie(name, value, opts) {
  const o = opts || {};
  let out = name + '=' + encodeURIComponent(value);
  out += '; Path=' + (o.path || '/');
  out += '; Max-Age=' + (o.maxAge == null ? 0 : Math.floor(o.maxAge));
  out += '; HttpOnly';
  out += '; SameSite=' + (o.sameSite || 'Lax');
  if (o.secure) out += '; Secure';
  return out;
}

/** HTTPS-only cookies in production/preview, plain HTTP on localhost. */
function isSecure(req) {
  return req.headers['x-forwarded-proto'] === 'https' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production';
}

/** Reject cross-site form posts. Same-origin fetches always send Origin. */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;
  try {
    const u = new URL(origin);
    return u.host === String(host).split(',')[0].trim();
  } catch (e) {
    return false;
  }
}

function ip(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/**
 * Fixed-window limiter stored in Mongo. `key` should include the action and
 * the identity (ip or email). Fails open: a limiter outage must not lock people out.
 */
async function rateLimit(db, key, limit, windowMs) {
  try {
    const now = Date.now();
    const bucket = Math.floor(now / windowMs);
    const id = key + ':' + bucket;
    const doc = await db.collection('throttle').findOneAndUpdate(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } },
      { upsert: true, includeResultMetadata: false }
    );
    const count = (doc && (doc.count != null ? doc.count : (doc.value && doc.value.count))) || 1;
    return { ok: count <= limit, count: count, limit: limit };
  } catch (e) {
    return { ok: true, count: 0, limit: limit };
  }
}

/** Wrap a handler so an unexpected error becomes a clean 500 + server log. */
function wrap(fn) {
  return async function (req, res) {
    try {
      await fn(req, res);
    } catch (err) {
      const status = err && err.status ? err.status : 500;
      if (status >= 500) console.error('[vocablab]', err);
      if (!res.headersSent) fail(res, status, status >= 500 ? 'Server error.' : (err.message || 'Bad request.'));
    }
  };
}

module.exports = {
  json: json,
  fail: fail,
  readBody: readBody,
  method: method,
  parseCookies: parseCookies,
  cookie: cookie,
  isSecure: isSecure,
  sameOrigin: sameOrigin,
  ip: ip,
  rateLimit: rateLimit,
  wrap: wrap
};
