/* =========================================================
   VocabLab — api/index.js
   The only Serverless Function in the deployment.

   The Hobby plan rejects a deployment with more than 12
   functions, so the 16 endpoints live in handlers/ and are
   dispatched from here (see handlers/routes.js).

   Why not api/[...path].js: Vercel did *not* route nested
   paths to that file — /api/admin/users and /api/auth/login
   came back with Vercel's own 404 page, and only one-segment
   paths like /api/health reached it. vercel.json now rewrites
   every /api/:path* here, and the captured segments arrive as
   the `path` query parameter ("admin/users"). The URL is the
   fallback, for the local dev server and the tests, which
   call this function directly.
   ========================================================= */
'use strict';

const H = require('../lib/http');
const { ROUTES } = require('../handlers/routes.js');

/**
 * A captured value, or ''. Placeholders such as ":path*" are refused: a
 * rewrite that failed to substitute must not look like a real route.
 */
function clean(value) {
  const text = String(value == null ? '' : value).trim();
  if (!text || text.indexOf(':') !== -1 || text.indexOf('$') !== -1) return '';
  return text;
}

/** "auth/login", ['auth', 'login'] and "/api/auth/login" all become "auth/login". */
function segments(value) {
  return [].concat(value || [])
    .map(clean)
    .filter(Boolean)
    .join('/')
    .replace(/^\/+|\/+$/g, '');
}

function pathnameOf(req) {
  const url = String((req && req.url) || '/');
  const cut = url.indexOf('?');
  return cut === -1 ? url : url.slice(0, cut);
}

/** The /api route a request is asking for, or '' when it cannot be read. */
function routeKeyFor(req) {
  const query = (req && req.query) || {};
  const rewritten = segments(query.path);
  const forwarded = segments(query.p);
  const called = segments(pathnameOf(req).replace(/^\/api(\/(index\.js)?)?(?=\/|$)/, ''));
  const key = rewritten || forwarded || called;
  return key ? '/api/' + key : '';
}

module.exports = function route(req, res) {
  const key = routeKeyFor(req);
  const handler = key && Object.prototype.hasOwnProperty.call(ROUTES, key) ? ROUTES[key] : null;
  if (!handler) return H.fail(res, 404, 'Unknown API route.');
  return handler(req, res);
};

module.exports.routeKeyFor = routeKeyFor;
