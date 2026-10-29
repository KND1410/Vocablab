'use strict';
const H = require('../lib/http');

/* The free (keyless) AI provider refuses browser pages opened as “localhost”:
   it answers 403 “Missing Turnstile token” — a Cloudflare check no fetch can
   solve — while the same anonymous request sent from a server is accepted.
   So the app retries a refused call here, and this function relays it: the
   browser talks to its own origin (no Origin header leaves the page), and the
   server calls the provider directly.

   Deliberately narrow: only this one provider, only its model list and its
   chat endpoint, no keys involved, and only for this site's own pages. */

const UPSTREAM = 'https://text.pollinations.ai';
const MODELS_URL = UPSTREAM + '/models';
const CHAT_URL = UPSTREAM + '/openai/chat/completions';
const TIMEOUT_MS = 75000;

async function relay(res, url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  let upstream;
  try {
    upstream = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
  } catch (e) {
    return H.fail(res, 502, 'The free AI service did not answer.');
  } finally {
    clearTimeout(timer);
  }

  const text = await upstream.text();
  res.statusCode = upstream.status;
  // The app reads this: without it the answer came from somewhere else (this
  // endpoint missing on a plain host), and the direct call stays the better one.
  res.setHeader('X-VocabLab-Relay', '1');
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(text);
}

module.exports = H.wrap(async function (req, res) {
  // Only this site's own pages may relay through us.
  if (!H.sameOrigin(req)) {
    H.fail(res, 403, 'Cross-origin request refused.');
    return;
  }

  const query = String(req.url || '').split('?')[1] || '';
  const what = /(?:^|&)what=([^&]*)/.exec(query);
  const target = what ? decodeURIComponent(what[1]) : 'chat';

  if (req.method === 'GET') {
    if (target !== 'models') { H.fail(res, 400, 'Unknown relay target.'); return; }
    await relay(res, MODELS_URL, { method: 'GET', headers: { accept: 'application/json' } });
    return;
  }

  if (!H.method(req, res, ['GET', 'POST'])) return;
  if (target !== 'chat') { H.fail(res, 400, 'Unknown relay target.'); return; }

  const body = await H.readBody(req);
  const raw = JSON.stringify(body);
  if (!raw || raw === '{}') { H.fail(res, 400, 'Missing request body.'); return; }

  await relay(res, CHAT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: raw
  });
});