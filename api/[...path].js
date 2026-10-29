/* =========================================================
   VocabLab — api/[...path].js
   The only Serverless Function in the deployment.

   Vercel counts one function per file under api/, and the Hobby
   plan caps a deployment at 12 — this repo has 16 endpoints, so
   they live in handlers/ instead and are dispatched from here.
   URLs are unchanged: /api/auth/login still runs
   handlers/auth/login.js.

   Vercel passes the matched segments in req.query.path, e.g.
   ['auth', 'login']; the raw URL is kept for the local server and
   for the tests, which call this function directly.
   ========================================================= */
'use strict';

const H = require('../lib/http');
const { ROUTES } = require('../handlers/routes.js');

function pathnameOf(req) {
  const url = String((req && req.url) || '/');
  const cut = url.indexOf('?');
  return cut === -1 ? url : url.slice(0, cut);
}

module.exports = function route(req, res) {
  const segments = [].concat((req.query && req.query.path) || []).filter(Boolean);
  const key = (segments.length ? '/api/' + segments.join('/') : pathnameOf(req))
    .replace(/\/+$/, '');
  const handler = Object.prototype.hasOwnProperty.call(ROUTES, key) ? ROUTES[key] : null;
  if (!handler) return H.fail(res, 404, 'Unknown API route.');
  return handler(req, res);
};
