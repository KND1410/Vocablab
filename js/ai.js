/* =========================================================
   VocabLab — ai.js
   Google Gemini client (free tier friendly).
     · lists available models for a key
     · generates quiz items in JSON mode (schema → plain → loose parse)
     · counts requests per day so users can watch free-tier quota
   ========================================================= */
(function (global) {
  'use strict';

  const BASE = 'https://generativelanguage.googleapis.com/v1beta';

  /**
   * The providers Settings → AI offers. Google speaks its own API; every other
   * entry is OpenAI-compatible, so a provider is just a base URL, one default
   * model and somewhere to get a key — they all work the same way.
   * Model names change often: “Test & load models” asks the provider what it
   * really serves and picks the best of that list, so these are only starting
   * points. `cost` is what the provider's offer really is, not marketing.
   */
  const PROVIDERS = [
    {
      id: 'pollinations', label: 'Free AI — no key, no account', short: 'Free AI', transport: 'openai',
      base: 'https://text.pollinations.ai/openai', modelsUrl: 'https://text.pollinations.ai/models',
      model: 'openai-fast', keyUrl: 'https://pollinations.ai', keyPrefix: '', cost: 'free', keyless: true
    },
    {
      id: 'gemini', label: 'Google Gemini — free tier', short: 'Google Gemini', transport: 'gemini',
      base: '', model: 'gemini-flash-latest', keyUrl: 'https://aistudio.google.com/apikey',
      keyPrefix: 'AIza', cost: 'free'
    },
    {
      id: 'groq', label: 'Groq — free tier, very fast (not Grok)', short: 'Groq', transport: 'openai',
      base: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b',
      keyUrl: 'https://console.groq.com/keys', keyPrefix: 'gsk_', keyLen: 56, cost: 'free'
    },
    {
      id: 'cerebras', label: 'Cerebras — very fast, trial credit', short: 'Cerebras', transport: 'openai',
      base: 'https://api.cerebras.ai/v1', model: 'gpt-oss-120b',
      keyUrl: 'https://cloud.cerebras.ai', keyPrefix: '', cost: 'trial'
    },
    {
      id: 'openrouter', label: 'OpenRouter — many free models', short: 'OpenRouter', transport: 'openai',
      base: 'https://openrouter.ai/api/v1', model: 'openrouter/free',
      keyUrl: 'https://openrouter.ai/keys', keyPrefix: 'sk-or-', cost: 'free'
    },
    {
      id: 'mistral', label: 'Mistral — free tier', short: 'Mistral', transport: 'openai',
      base: 'https://api.mistral.ai/v1', model: 'mistral-small-latest',
      keyUrl: 'https://console.mistral.ai/api-keys', keyPrefix: '', cost: 'free'
    },
    {
      id: 'deepseek', label: 'DeepSeek — paid, very cheap', short: 'DeepSeek', transport: 'openai',
      base: 'https://api.deepseek.com/v1', model: 'deepseek-flash',
      keyUrl: 'https://platform.deepseek.com/api_keys', keyPrefix: 'sk-', cost: 'paid'
    },
    {
      id: 'xai', label: 'xAI Grok — the other “Grok”, paid', short: 'xAI Grok', transport: 'openai',
      base: 'https://api.x.ai/v1', model: 'grok-4.7',
      keyUrl: 'https://console.x.ai', keyPrefix: 'xai-', keyLen: 84, cost: 'trial'
    },
    {
      id: 'cloudflare', label: 'Cloudflare Workers AI', short: 'Cloudflare Workers AI', transport: 'openai',
      base: 'https://api.cloudflare.com/client/v4/accounts/REPLACE_WITH_ACCOUNT_ID/ai/v1',
      model: '@cf/openai/gpt-oss-20b', keyUrl: 'https://dash.cloudflare.com/profile/api-tokens',
      keyPrefix: '', cost: 'free', needsAccountId: true
    },
    {
      id: 'ollama', label: 'Ollama — local app, no key', short: 'Ollama', transport: 'openai',
      base: 'http://localhost:11434/v1', model: 'llama3.2',
      keyUrl: 'https://ollama.com', keyPrefix: '', cost: 'local'
    },
    {
      id: 'openai', label: 'Other OpenAI-compatible…', short: 'the AI provider', transport: 'openai',
      base: '', model: '', keyUrl: '', keyPrefix: '', cost: ''
    }
  ];

  function providerById(id) {
    for (const p of PROVIDERS) if (p.id === id) return p;
    return null;
  }

  /**
   * Keys are copied by hand, so they arrive with things attached: a leading
   * “Bearer ”, quotes from a web page, a line break at the end. Anything the
   * provider did not issue makes it answer 401, so drop it before sending —
   * always send the normalised key, never the raw field.
   */
  function normalizeKey(raw) {
    let k = String(raw == null ? '' : raw)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')   // invisible characters copied from a page
      .replace(/\u00A0/g, ' ');                // a non-breaking space is just a space
    // “Bearer …” and quotes can wrap each other, so peel until it settles.
    for (let i = 0; i < 3; i++) {
      const before = k;
      k = k.replace(/^[\s"'`]+/, '').replace(/[\s"'`]+$/, '');
      k = k.replace(/^Bearer[\s:]+/i, '');
      if (k === before) break;
    }
    return k.trim();
  }

  /** The provider that owns a base URL, or null for a custom/unknown one. */
  function providerForBase(baseUrl) {
    const b = normalizeBaseUrl(baseUrl).toLowerCase();
    for (const p of PROVIDERS) {
      if (p.base && normalizeBaseUrl(p.base).toLowerCase() === b) return p;
    }
    // localhost and 127.0.0.1 are the same machine: both mean the local app.
    if (isLocalBaseUrl(b)) return providerById('ollama');
    return null;
  }

  /** What a key looks like, e.g. “gsk_…” — '' when the format is not known. */
  function keyFormat(id) {
    const p = providerById(id);
    return (p && p.keyPrefix) ? p.keyPrefix + '…' : '';
  }

  /**
   * A key that plainly belongs to a different provider — or still carries a
   * space from the copy — is the reason behind almost every 401, and a bare
   * “provider rejected the key” tells the learner nothing. Returns a sentence
   * to show, or '' when there is nothing to say.
   *
   * The mismatch test only runs for providers whose key format we know, so a
   * custom OpenAI-compatible endpoint (any key allowed) is never second-guessed.
   */
  function keyShapeWarning(id, raw) {
    const key = normalizeKey(raw);
    const def = providerById(id);
    if (!key || !def) return '';
    if (def.keyPrefix) {
      const lower = key.toLowerCase();
      // A key can match several prefixes (OpenRouter's “sk-or-” also starts with
      // DeepSeek's “sk-”), so the longest match is the one that issued it.
      const matches = PROVIDERS
        .filter(function (p) { return p.keyPrefix && lower.indexOf(p.keyPrefix.toLowerCase()) === 0; })
        .sort(function (a, b) { return b.keyPrefix.length - a.keyPrefix.length; });
      const owner = matches[0];
      if (owner && owner.id !== id) {
        return 'That key starts with “' + owner.keyPrefix + '”, so it was issued by ' + owner.short +
          ' — but ' + def.short + ' is selected. Providers never share keys: make one for ' +
          def.short + (def.keyUrl ? ' at ' + def.keyUrl : '') + ' and paste that instead.';
      }
      if (!owner) {
        // Nothing we know issues keys like this — the usual cause is a key from
        // a similarly named site, which is why Groq/Grok gets confused.
        return def.short + ' keys start with “' + def.keyPrefix + '”' +
          (def.keyLen ? ' and are ' + def.keyLen + ' characters' : '') +
          ', but this one starts with “' + key.slice(0, 6) + '…' + '” and has ' + key.length +
          '. It came from a different service — copy a key from ' + (def.keyUrl || 'the provider console') +
          ' instead.';
      }
    }
    if (/\s/.test(key)) {
      return 'That key has a space or line break inside it, so it is not the key itself — copy it again from ' +
        (def.keyUrl || 'the provider dashboard') + ' and paste it on its own.';
    }
    return '';
  }

  const RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['mc', 'blank', 'translate'] },
            direction: { type: 'string', enum: ['term2meaning', 'meaning2term', 'blank'] },
            term: { type: 'string' },
            prompt: { type: 'string' },
            hint: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            answer: { type: 'string' },
            explanation: { type: 'string' }
          },
          required: ['type', 'term', 'prompt', 'answer'],
          propertyOrdering: ['type', 'direction', 'term', 'prompt', 'hint', 'options', 'answer', 'explanation']
        }
      }
    },
    required: ['questions'],
    propertyOrdering: ['questions']
  };

  function abortError() { const e = new Error('Aborted'); e.name = 'AbortError'; return e; }

  /** A wait the learner can cancel: the overlay's Cancel aborts the signal and
      the sleep rejects instead of holding the dialog until the timer runs out. */
  function sleep(ms, signal) {
    return new Promise(function (resolve, reject) {
      if (signal && signal.aborted) { reject(abortError()); return; }
      function onAbort() { clearTimeout(timer); reject(abortError()); }
      const timer = setTimeout(function () {
        if (signal && signal.removeEventListener) signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      if (signal && signal.addEventListener) signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  /* ---------- Request deadlines ---------- */
  /* Every request needs a deadline of its own. Without one, a provider that
     accepts the connection and then stalls leaves the quiz overlay counting
     seconds forever — the exact “stuck on Generating” symptom. */
  const KEYED_TIMEOUT_MS = 90000;   // own key: generous, but finite
  const FREE_TIMEOUT_MS = 45000;    // keyless: one quiz reply, then built-in
  const GEMINI_TIMEOUT_MS = 50000;  // Gemini can think, but not forever
  const FREE_TOTAL_MS = 50000;      // all retries/waits of one keyless call

  /** A signal that also aborts on a timer, without losing the caller's cancel. */
  function requestGuard(externalSignal, ms) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timedOut = false;
    let timer = null;
    function relayAbort() { try { if (ctrl) ctrl.abort(); } catch (e) { /* ignore */ } }
    if (ctrl && externalSignal && externalSignal.addEventListener) {
      if (externalSignal.aborted) relayAbort();
      else externalSignal.addEventListener('abort', relayAbort, { once: true });
    }
    if (ctrl && ms > 0) timer = setTimeout(function () { timedOut = true; relayAbort(); }, ms);
    return {
      signal: ctrl ? ctrl.signal : (externalSignal || undefined),
      timedOut: function () { return timedOut; },
      cleanup: function () {
        if (timer) { clearTimeout(timer); timer = null; }
        if (ctrl && externalSignal && externalSignal.removeEventListener) {
          externalSignal.removeEventListener('abort', relayAbort);
        }
      }
    };
  }

  /* ---------- Free-slot pacing (keyless provider) ---------- */
  /* The keyless service allows ONE reply per IP every 30 seconds and answers
     402 FREE_LIMIT outside that window — and its own “Retry after Ns” cannot
     be trusted: it has answered “1s” while the real remaining wait was about
     25 s. Retrying on that header burns every retry in a couple of seconds, the
     quiz falls back to built-in questions and the paragraph never comes.
     So timing is tracked here instead: when a keyless reply lands, the next
     call holds until the window reopens (counting down in the progress text
     the UI already shows), and a 402 waits out the rest of the window rather
     than believing a too-small claim. */
  const FREE_WINDOW_MS = 30000;
  // When this session has no reply of its own to measure from, a small claim
  // is distrusted this hard: first guess half a window, then the full window.
  const FREE_WAIT_FLOORS = [15000, 30000, 30000];
  let freeTiming = { windowMs: FREE_WINDOW_MS, floors: FREE_WAIT_FLOORS };
  let freeNextAt = 0;   // earliest send time for the next keyless call

  /** How long a 402 is worth waiting: the rest of this session's window when
      we know it (our own accounting is exact), otherwise the larger of the
      provider's claim and a distrust floor. Always 1–45 s. */
  function freeWaitMs(claimMs, attempt) {
    const now = Date.now();
    const remain = freeNextAt > now ? freeNextAt - now : 0;
    const floors = (freeTiming && freeTiming.floors) || [];
    const floor = floors[Math.min(attempt || 0, Math.max(0, floors.length - 1))] || 0;
    const ms = remain > 0
      ? Math.max(remain, claimMs || 0)
      : Math.max(claimMs || 0, floor);
    return Math.min(45000, Math.max(1000, Math.round(ms)));
  }

  function configureFreeSlot(opts) {
    opts = opts || {};
    if (opts.windowMs != null) freeTiming.windowMs = Math.max(0, Number(opts.windowMs) || 0);
    if (Array.isArray(opts.floors)) {
      freeTiming.floors = opts.floors.map(Number).filter(function (n) { return isFinite(n); });
    }
  }

  function resetFreeSlot() { freeNextAt = 0; }

  /** Hold a keyless call until the free window reopens, counting the wait. */
  async function waitFreeSlot(cfg) {
    const wait = freeNextAt - Date.now();
    if (wait <= 0) return;
    // Below one second the countdown would read “waiting 0 s” — just go.
    if (wait >= 1000 && typeof cfg.onWait === 'function') cfg.onWait(wait);
    await sleep(wait, cfg.signal);
  }

  /* ---------- Model repair ---------- */
  /* A provider that stops serving a model — the free service drops them often —
     leaves the saved id behind, and from then on *every* request answers 404.
     One “model not found” is enough to ask what the provider serves now and
     continue with that, so the app keeps working instead of asking the learner
     to poke around in Settings. */
  let modelRepairHandler = null;

  function setModelRepairHandler(fn) {
    modelRepairHandler = typeof fn === 'function' ? fn : null;
  }

  function modelMissingError(err) {
    if (!err) return false;
    if (err.status === 404) return true;
    if (err.status !== 400) return false;
    return /model .*(not found|does not exist|isn't on|is not on)|unknown model|no such model/i.test(String(err.message || ''));
  }

  /** Gemini drops model ids too (a key created today cannot call a retired
      model). Ask what the key can use and continue with the best of that list. */
  async function repairGeminiModel(cfg) {
    if (!cfg || !cfg.key) return null;
    let models = [];
    try { models = await listGeminiModels(cfg.key, cfg.signal); } catch (e) { return null; }
    if (!models.length) return null;
    const current = String(cfg.model || '');
    if (models.some(function (m) { return m.id === current; })) return null;
    const next = pickDefaultModel(models, 'gemini');
    if (!next || next === current) return null;
    if (modelRepairHandler) {
      try {
        modelRepairHandler({ provider: 'gemini', previous: current, model: next, models: models });
      } catch (e) { /* keeping the settings in step must not break the call */ }
    }
    return next;
  }

  /** The model to use instead of the one that is gone, or null when the
      provider still lists it (or cannot be asked). */
  async function repairModel(cfg) {
    // A local server has no “retired” model: one that is missing was simply
    // never pulled, and that message already says which pull to run.
    if (isLocalBaseUrl(cfg.baseUrl)) return null;
    let models = [];
    try {
      models = await oaiListModels({
        baseUrl: cfg.baseUrl, key: cfg.key, keyless: cfg.keyless, signal: cfg.signal
      });
    } catch (e) {
      return null;
    }
    if (!models.length) return null;
    const current = String(cfg.model || '');
    if (models.some(function (m) { return m.id === current; })) return null;
    const next = pickDefaultModel(models, 'openai') || models[0].id;
    if (!next || next === current) return null;
    if (modelRepairHandler) {
      try {
        modelRepairHandler({ baseUrl: cfg.baseUrl, previous: current, model: next, models: models });
      } catch (e) { /* keeping the settings in step must not break the call */ }
    }
    return next;
  }

  /* ---------- Free-provider relay ---------- */
  /* The free service refuses some *pages* — a page opened as “localhost” gets
     403 “Missing Turnstile token”, which no fetch can solve — while the very
     same anonymous request sent by this site's own server is accepted. So a
     refusal is retried through api/ai-free.js; after that first success every
     free call goes there directly instead of making a doomed round trip. */
  let freeRelayWanted = false;

  function relayUrl(kind) {
    try {
      if (typeof location === 'undefined') return '';
      if (location.protocol !== 'http:' && location.protocol !== 'https:') return '';
      const origin = location.origin;
      if (!origin || origin === 'null') return '';
      return origin + '/api/ai-free?what=' + (kind === 'models' ? 'models' : 'chat');
    } catch (e) {
      return '';
    }
  }

  /** null = this host has no working relay (a plain file host, or a server
      error), so the caller keeps the original answer. */
  async function viaRelay(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (!res || !res.headers || res.headers.get('x-vocablab-relay') !== '1') return null;
      freeRelayWanted = true;
      return res;
    } catch (e) {
      return null;
    }
  }

  function refused(res, keyless) {
    return !!(keyless && res && (res.status === 401 || res.status === 403));
  }

  async function freeChat(directUrl, opts, keyless) {
    const relay = keyless ? relayUrl('chat') : '';
    if (relay && freeRelayWanted) {
      const back = await viaRelay(relay, opts);
      if (back) return back;
      freeRelayWanted = false;
    }
    const res = await fetch(directUrl, opts);
    if (!relay || !refused(res, keyless)) return res;
    return (await viaRelay(relay, opts)) || res;
  }

  async function freeModels(directUrl, opts) {
    const relay = relayUrl('models');
    if (relay && freeRelayWanted) {
      const back = await viaRelay(relay, opts);
      if (back) return back;
      freeRelayWanted = false;
    }
    const res = await fetch(directUrl, opts);
    if (!relay || !refused(res, true)) return res;
    return (await viaRelay(relay, opts)) || res;
  }

  /* ---------- Models ---------- */
  function prettifyModel(id) {
    return id.replace(/^models\//, '')
      .split('-').map(function (part) {
        if (/^\d+(\.\d+)?$/.test(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join(' ');
  }

  function modelVersion(id) {
    const m = String(id).match(/gemini-(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function modelRank(id) {
    const s = String(id);
    if (/embedding|aqa|imagen|veo|image|tts|audio|live|robotics|learnlm|gemma|thinking/.test(s)) return -1;
    const lite = /flash-lite/.test(s);
    const flash = /flash/.test(s) && !lite;
    const preview = /preview|exp/.test(s);
    let rank = 1;
    if (flash) rank = preview ? 3 : 6;
    else if (lite) rank = preview ? 2 : 5;
    else if (/pro/.test(s)) rank = 4;
    return rank;
  }

  function sortModels(models) {
    return models.slice().sort(function (a, b) {
      const ra = modelRank(a.id), rb = modelRank(b.id);
      if (ra !== rb) return rb - ra;
      const va = modelVersion(a.id), vb = modelVersion(b.id);
      if (va !== vb) return vb - va;
      return a.id.length - b.id.length;
    });
  }

  function pickDefaultModel(models, provider) {
    if (provider === 'openai') {
      if (!models.length) return 'openrouter/free';
      return sortOaiModels(models)[0].id;
    }
    const usable = models.filter(function (m) { return modelRank(m.id) > 0; });
    if (!usable.length) return (models[0] && models[0].id) || 'gemini-flash-latest';
    return sortModels(usable)[0].id;
  }

  function normalizeModelPath(model) {
    const id = String(model || '').trim().replace(/^models\//, '');
    return 'models/' + id;
  }

  async function listGeminiModels(key, signal) {
    const apiKey = normalizeKey(key);
    if (!apiKey) {
      const err = new Error('No API key');
      err.friendly = 'Add your free Gemini API key first (aistudio.google.com/apikey).';
      throw err;
    }
    let res;
    const guard = requestGuard(signal, 20000);
    try {
      res = await fetch(BASE + '/models?pageSize=200', { headers: { 'x-goog-api-key': apiKey }, signal: guard.signal });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        if (guard.timedOut()) throw keylessTimeout('the model check within 20 seconds', true);
        throw e;
      }
      const err = new Error('Network error while contacting Gemini');
      err.friendly = 'Could not reach the Gemini API. Check your internet connection.';
      throw err;
    } finally {
      guard.cleanup();
    }
    if (!res.ok) throw await httpError(res, 'Gemini (list models)');
    const data = await res.json();
    const models = (data.models || [])
      .filter(function (m) { return (m.supportedGenerationMethods || []).indexOf('generateContent') !== -1; })
      .map(function (m) {
        const id = String(m.name || '').replace(/^models\//, '');
        return { id: id, label: prettifyModel(id), description: m.description || '' };
      })
      .filter(function (m) { return modelRank(m.id) > 0; });
    return sortModels(models);
  }

  async function httpError(res, context) {
    let detail = '';
    try {
      const body = await res.json();
      detail = (body && body.error && body.error.message) || '';
    } catch (e) { /* ignore */ }
    const err = new Error(context + ' failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
    err.status = res.status;
    if (res.status === 400 && /API key not valid/i.test(detail)) {
      err.friendly = 'That Gemini API key is not valid. Create/copy one at aistudio.google.com/apikey.';
    } else if (res.status === 401 || res.status === 403) {
      err.friendly = 'Gemini denied the request (403). The key may be restricted or the API not enabled for its project.';
    } else if (res.status === 404) {
      err.friendly = 'Model not found (404) — pick a different model in Settings → AI.';
    } else if (res.status === 429) {
      err.friendly = 'Gemini free-tier limit reached (429). Wait a minute, or pick another provider in Settings → AI — ' +
        'Groq, Cerebras and OpenRouter all have free tiers. Built-in questions cover the rest meanwhile.';
    } else if (res.status >= 500) {
      err.friendly = 'Gemini had a server error (' + res.status + '). Try again shortly.';
    } else {
      err.friendly = err.message;
    }
    return err;
  }

  /* =========================================================
     OpenAI-compatible providers
     Groq · OpenRouter · Mistral · Cloudflare Workers AI ·
     local Ollama / LM Studio / llama.cpp — all use
     POST {base}/chat/completions and GET {base}/models.
     ========================================================= */

  const OAI_NON_CHAT = /(whisper|tts|embed|rerank|guard|moderation|dall|stable-diffusion|image|video|audio|speech|ocr)/i;

  function normalizeBaseUrl(baseUrl) {
    return String(baseUrl || '').trim().replace(/\/+$/, '');
  }

  function isLocalBaseUrl(baseUrl) {
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?/i.test(String(baseUrl || ''));
  }

  function oaiHeaders(baseUrl, key) {
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = normalizeKey(key);
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    if (/openrouter\.ai/i.test(baseUrl)) {
      headers['X-Title'] = 'VocabLab';
      try {
        if (typeof location !== 'undefined' && location.origin && location.origin !== 'null') {
          headers['HTTP-Referer'] = location.origin;
        }
      } catch (e) { /* ignore */ }
    }
    return headers;
  }

  function oaiBuildBody(o) {
    const body = {
      model: o.model,
      messages: [
        { role: 'system', content: o.system },
        { role: 'user', content: o.user }
      ],
      temperature: o.temperature == null ? 0.8 : o.temperature,
      max_tokens: o.maxTokens || 4096
    };
    if (o.jsonMode) body.response_format = { type: 'json_object' };
    // The keyless model is a small reasoning model: left alone it can spend the
    // whole token budget thinking and return an empty answer. Less reasoning and
    // more room keep a 20-word batch inside one reply.
    if (o.keyless) {
      body.reasoning_effort = 'low';
      // A health check only needs a word back; a full reply would burn the
      // shared slot on nothing.
      body.max_tokens = o.tiny ? (o.maxTokens || 256) : Math.max(body.max_tokens, 8192);
    }
    return body;
  }

  function oaiExtractText(data) {
    const choice = data && data.choices && data.choices[0];
    const msg = choice && choice.message;
    let text = '';
    if (msg) {
      if (typeof msg.content === 'string') text = msg.content;
      if (!text && typeof msg.reasoning_content === 'string') text = msg.reasoning_content;
    }
    if (!String(text).trim()) {
      const reason = (choice && choice.finish_reason) || 'unknown';
      const err = new Error('Provider returned no text (' + reason + ')');
      err.empty = true;
      err.friendly = 'The AI provider returned an empty answer (' + reason + '). VocabLab will use built-in questions for these words.';
      throw err;
    }
    return { text: text, usage: (data && data.usage) || null };
  }

  function oaiModelRank(id) {
    const s = String(id).toLowerCase();
    if (s === 'openrouter/free') return 100;
    if (/:free/.test(s)) return 80;
    if (/gpt-oss|qwen|llama|mistral|gemma|nemotron|deepseek|glm|phi|mixtral|command|hermes|zephyr|granite/.test(s)) return 60;
    if (/instruct|chat/.test(s)) return 50;
    return 20;
  }

  function sortOaiModels(models) {
    return models.slice().sort(function (a, b) {
      const ra = oaiModelRank(a.id), rb = oaiModelRank(b.id);
      if (ra !== rb) return rb - ra;
      if (a.id.length !== b.id.length) return a.id.length - b.id.length;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
  }

  /** The page's own origin, for CORS hints (file:// pages send Origin: null). */
  function pageOrigin() {
    try {
      if (typeof location !== 'undefined') {
        if (location.origin && location.origin !== 'null') return location.origin;
        if (location.protocol === 'file:') return 'null';
      }
    } catch (e) { /* ignore */ }
    return 'unknown';
  }

  /**
   * Did anything answer at all? A CORS refusal still proves the server is up,
   * which is the difference between “start Ollama” and “let Ollama accept me”.
   * The reply is opaque on purpose — we only care that the connection worked.
   */
  async function hostAnswers(baseUrl) {
    let timer = null, ctrl = null;
    try {
      if (typeof AbortController === 'function') {
        ctrl = new AbortController();
        timer = setTimeout(function () { ctrl.abort(); }, 4000);
      }
      await fetch(baseUrl + '/models', {
        mode: 'no-cors', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined
      });
      return true;
    } catch (e) {
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function networkError(baseUrl, model) {
    let host = baseUrl;
    try { host = new URL(baseUrl).host; } catch (e) { /* keep raw */ }
    const local = isLocalBaseUrl(baseUrl);
    const answers = await hostAnswers(baseUrl);
    const lines = [];
    if (answers) {
      // Something is listening: the browser could not *read* the answer (CORS).
      lines.push('Could not use ' + host + ' — a server answered, but it blocked this page.');
      if (local) {
        lines.push('• Local Ollama only accepts pages it trusts — restart it with OLLAMA_ORIGINS=*');
        lines.push('• It has to allow this page’s origin: ' + pageOrigin() + '. A file:// page sends “null”, which Ollama refuses — serve the folder over http (python3 -m http.server 8000) instead');
        lines.push('• Then press “Test & load models” in Settings → AI');
      } else {
        lines.push('• The service is up but refuses browser calls from this page. Try a provider that allows them — Gemini, Groq, OpenRouter or Mistral');
      }
    } else if (local) {
      // Nothing on that port at all — the usual cause is simply “not installed”.
      const scheme = /^https:/i.test(baseUrl) ? 'https' : 'http';
      lines.push('Could not reach ' + host + ' — nothing is running there.');
      lines.push('• Ollama is a program on your computer, not a web service — install it once: https://ollama.com/download');
      lines.push('• Start it in a terminal: ollama serve    (and fetch a model once: ollama pull ' + (model || 'llama3.2') + ')');
      lines.push('• Check it in a new tab: ' + scheme + '://' + host + '/api/tags — if that fails, swap localhost and 127.0.0.1');
      lines.push('• If that tab works but VocabLab still cannot, the browser is blocking this page — serve VocabLab over http://, or pick another provider');
      lines.push('• Rather not set it up? Set Generator to Built-in, or use a free Gemini/Groq key');
    } else {
      lines.push('Could not reach ' + host + '.');
      lines.push('• Check the Base URL and your internet connection.');
      lines.push('• Gemini, Groq, OpenRouter and Mistral allow browser calls; a local server needs its CORS opened.');
    }
    const err = new Error('Network error while contacting ' + host);
    err.friendly = lines.join('\n');
    err.network = true;
    err.hint = answers ? 'cors' : (local ? 'offline' : 'unreachable');
    return err;
  }

  async function oaiHttpError(res, context, opts) {
    opts = opts || {};
    let detail = '';
    try {
      const body = await res.json();
      const problem = body && body.error;
      // Providers disagree on the shape: {error:{message}} or {error:"…"} —
      // the string form is usually the one that says what actually happened.
      if (typeof problem === 'string') detail = problem;
      else detail = (problem && problem.message) || '';
    } catch (e) { /* ignore */ }
    const err = new Error(context + ' failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
    err.status = res.status;
    if (res.status === 400) {
      err.friendly = 'The provider rejected the request (400)' + (detail ? ' — ' + detail : '') + '.';
    } else if (res.status === 401 || res.status === 403) {
      const p = providerForBase(opts.base || '');
      const who = (p && p.short) || 'The provider';
      if (opts.keyless) {
        // No key exists in this mode, so blaming the key sends the learner on a
        // pointless hunt. This is the service questioning the page itself.
        err.friendly = 'The free service refused this request (' + res.status +
          (detail ? ' — ' + detail : '') + ').\n' +
          '• No key is involved: it is challenging this page, not your setup. A page opened as “localhost” is one it challenges like this.\n' +
          '• VocabLab retries the same call through this site\u2019s own server. If it still fails, open the app as 127.0.0.1 instead of localhost, use the deployed site, or switch to Advanced with your own key (Groq and Gemini have free tiers).';
      } else {
        err.friendly = who + ' rejected this key (401/403)' + (detail ? ' — ' + detail : '') + '.' +
          (p && p.keyUrl ? '\n• Copy a new key from ' + p.keyUrl + ' and paste it into the API key field on its own.' : '') +
          (p && p.keyPrefix ? '\n• ' + p.short + ' keys look like “' + p.keyPrefix + '…” — if yours does not, it belongs to another provider.' : '') +
          '\n• A key only works for the provider that issued it, and only for models that key may use.';
      }
    } else if (res.status === 402) {
      if (opts.keyless) {
        // The wait it asks for is usually in the body (“Retry after 3s”) and only
        // sometimes in a header, so read both — a needless 30-second pause is
        // the difference between a quiz that starts and one that looks broken.
        const header = res.headers && typeof res.headers.get === 'function' ? Number(res.headers.get('retry-after')) : NaN;
        const bodyMatch = /retry after\s+(\d+)\s*s/i.exec(detail || '');
        const said = isFinite(header) && header > 0 ? header : (bodyMatch ? Number(bodyMatch[1]) : NaN);
        err.friendly = 'The free AI allows one request every 30 seconds — it is a shared public service.\n' +
          '• Wait a moment and press again.\n' +
          '• For no waiting, switch to Advanced in Settings → AI and use your own key.';
        err.freeWait = true;
        err.retryAfter = isFinite(said) && said > 0 ? Math.min(45, said) : 30;
      } else {
        err.friendly = 'The provider says there are no credits for this model (402). On OpenRouter, pick a “:free” model such as openrouter/free.';
      }
    } else if (res.status === 404) {
      err.friendly = opts.keyless
        ? 'The free service no longer offers “' + (opts.model || 'this model') + '” (404).\n' +
          '• Open Settings → AI and press “Check the free AI” to load the models it serves now.\n' +
          '• VocabLab tries this by itself — retry the same action and it will pick a model that exists.'
        : 'Endpoint or model not found (404)' + (detail ? ' — ' + detail : '') +
          (isLocalBaseUrl(opts.base || '')
            ? '\n• Local Ollama: download the model first — ollama pull ' + (opts.model || 'llama3.2')
            : '\n• Check the Base URL and the model ID in Settings → AI.');
    } else if (res.status === 429) {
      err.friendly = opts.keyless
        ? 'The free AI is busy right now (429) — it is a shared service with a queue.\n' +
          '• Wait a minute and press again.\n' +
          '• Still busy? Switch to Advanced in Settings → AI and use your own key, or set Generator to Built-in for now.'
        : 'Rate limit reached (429) by this provider. Wait a minute, or switch provider in Settings → AI — ' +
          'Groq, Cerebras and OpenRouter have free tiers. Built-in questions cover the rest meanwhile.';
    } else if (res.status >= 500) {
      err.friendly = opts.keyless
        ? 'The free AI service is broken on their side right now (' + res.status + '). Nothing in your setup needs changing.\n' +
          '• Quizzes use the built-in generator meanwhile; paragraph practice needs AI, so use Advanced with a free Groq or Gemini key.\n' +
          '• Try again later, or press “Check the free AI” in Settings → AI.'
        : 'The provider had a server error (' + res.status + '). Try again shortly.';
    } else {
      err.friendly = err.message;
    }
    return err;
  }

  async function oaiListModels(cfg) {
    const base = normalizeBaseUrl(cfg.baseUrl);
    if (!base) {
      const err = new Error('No base URL');
      err.friendly = 'Set the provider Base URL first (e.g. https://api.groq.com/openai/v1).';
      throw err;
    }
    const def = providerForBase(base);
    const keyless = !!(cfg.keyless || (def && def.keyless));
    if (!normalizeKey(cfg.key) && !isLocalBaseUrl(base) && !keyless) {
      const err = new Error('No API key');
      err.friendly = 'Add the provider API key first (a local Ollama server needs none).';
      throw err;
    }
    const modelsUrl = cfg.modelsUrl || (def && def.modelsUrl) || (base + '/models');
    let timer = null, ctrl = null;
    let res;
    try {
      if (keyless && !cfg.signal && typeof AbortController !== 'undefined') {
        ctrl = new AbortController();
        timer = setTimeout(function () { ctrl.abort(); }, 20000);
      }
      res = await freeModels(modelsUrl, { headers: oaiHeaders(base, cfg.key), signal: cfg.signal || (ctrl && ctrl.signal) });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        if (ctrl && ctrl.signal.aborted) throw keylessTimeout('did not answer the model check in 20 seconds');
        throw e;
      }
      throw await networkError(base, cfg.model);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) throw await oaiHttpError(res, 'AI provider (list models)', { base: base, model: cfg.model, keyless: keyless });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
    const models = list
      // Pollinations tags each model with a tier; “anonymous” is the one usable
      // without a key, so a keyless setup must not offer the rest.
      .filter(function (m) { return !keyless || !m || m.tier == null || m.tier === 'anonymous'; })
      .map(function (m) {
        const id = String((m && (m.id || m.name)) || '');
        return { id: id, label: id };
      })
      .filter(function (m) { return m.id && !OAI_NON_CHAT.test(m.id); });
    return sortOaiModels(models);
  }

  function keylessTimeout(what, keyed) {
    const err = new Error('The AI took too long to answer');
    err.status = 408;
    err.timeout = true;
    if (keyed) {
      err.friendly = 'The provider did not answer ' + (what || 'in time') + '.\n' +
        '• Try again, or pick another provider in Settings → AI.\n' +
        '• VocabLab falls back to built-in questions meanwhile.';
    } else {
      err.friendly = 'The free AI ' + (what || 'is taking too long') + ' — it is a shared service and can queue up.\n' +
        '• Try again in a minute.\n' +
        '• Or switch to Advanced in Settings → AI with your own key, which has no queue.';
    }
    return err;
  }

  async function oaiCallOnce(cfg) {
    const base = normalizeBaseUrl(cfg.baseUrl);
    const def = providerForBase(base);
    const keyless = !!(cfg.keyless || (def && def.keyless));
    // Pace only truly keyless calls: a paid key on the same provider has no
    // 30-second rule, and a local server is unlimited.
    const paced = keyless && !normalizeKey(cfg.key);
    if (paced) await waitFreeSlot(cfg);
    const guard = requestGuard(cfg.signal, keyless ? FREE_TIMEOUT_MS : KEYED_TIMEOUT_MS);
    let res;
    try {
      res = await freeChat(base + '/chat/completions', {
        method: 'POST',
        headers: oaiHeaders(base, cfg.key),
        body: JSON.stringify(oaiBuildBody(Object.assign({}, cfg, { keyless: keyless }))),
        signal: guard.signal
      }, keyless);
    } catch (e) {
      if (e && e.name === 'AbortError') {
        if (guard.timedOut()) throw keylessTimeout(
          'within ' + Math.round((keyless ? FREE_TIMEOUT_MS : KEYED_TIMEOUT_MS) / 1000) + ' seconds',
          !keyless);
        throw e;
      }
      throw await networkError(base, cfg.model);
    } finally {
      guard.cleanup();
    }
    if (!res.ok) {
      throw await oaiHttpError(res, 'AI provider (chat)', {
        base: base, model: cfg.model, keyless: keyless
      });
    }
    // A reply just landed: hold the next keyless call for a full window from
    // THIS moment — the only trustworthy measurement of when the slot reopens.
    if (paced) freeNextAt = Date.now() + freeTiming.windowMs;
    const data = await res.json();
    usageBump(1);
    return oaiExtractText(data);
  }

  /* How many times one call may wait out the keyless service's “one reply per
     30 s” queue. A paragraph plus its correction can queue twice in a row. */
  const FREE_SLOT_WAITS = 3;

  /** A real “does it answer?” check for the keyless provider. Listing models
      only proves the catalogue is up — the reply endpoint can be broken while
      the list still loads, which is exactly how Settings used to say “works”
      while every quiz failed. */
  async function checkFree(cfg) {
    cfg = cfg || {};
    const def = providerForBase(normalizeBaseUrl(cfg.baseUrl)) ||
      (cfg.provider && providerById(cfg.provider));
    const baseUrl = normalizeBaseUrl(cfg.baseUrl) || (def && def.base);
    if (!baseUrl) {
      const err = new Error('No free provider');
      err.friendly = 'The free AI is not configured.';
      throw err;
    }
    return oaiCallWithFallbacks({
      baseUrl: baseUrl,
      key: '',
      model: cfg.model || (def && def.model) || 'openai-fast',
      system: 'You are a connectivity check. Reply with one word.',
      user: 'Reply with the single word OK.',
      maxTokens: 128,
      plain: true,
      tiny: true,
      signal: cfg.signal,
      onWait: cfg.onWait
    });
  }

  /** Try JSON mode first, then plain, retrying on 429/5xx/free-slot 402, and
      swapping a model the provider no longer serves for one it does. */
  async function oaiCallWithFallbacks(cfg) {
    // Tutor replies are prose, so skip the JSON-mode pass entirely. Sending
    // response_format: json_object for a chat answer only wastes a request.
    const passes = cfg.plain ? [{ jsonMode: false }] : [{ jsonMode: true }, { jsonMode: false }];
    const keyless = !!(cfg.keyless || (providerForBase(normalizeBaseUrl(cfg.baseUrl)) || {}).keyless);
    const startedAt = Date.now();
    let lastErr = null;
    let slotWaits = 0;
    let repaired = false;
    let call = cfg;
    for (let pass = 0; pass < passes.length; pass++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await oaiCallOnce(Object.assign({}, call, passes[pass]));
        } catch (e) {
          if (e && e.name === 'AbortError') throw e;
          lastErr = e;
          // A model that is gone fails every request from now on: look up what
          // the provider serves and re-send with that, once per call.
          if (!repaired && modelMissingError(e)) {
            repaired = true;
            const fixed = await repairModel(call);
            if (fixed) {
              call = Object.assign({}, call, { model: fixed });
              attempt--;
              continue;
            }
          }
          const freeWait = e.status === 402 && e.freeWait;
          if (freeWait) {
            // The provider's “Retry after” lies low (it has said 1s for a
            // wait of ~25 s), so wait out this session's window or a distrust
            // floor — each retry then lands in an open slot instead of
            // burning every attempt within a few seconds.
            if (slotWaits >= FREE_SLOT_WAITS) break;
            const ms = freeWaitMs(e.retryAfter * 1000, slotWaits);
            // One quiz must not spend minutes queueing: past this budget the
            // built-in generator is a better answer than a spinning overlay.
            if (keyless && Date.now() - startedAt + ms > FREE_TOTAL_MS) break;
            slotWaits++;
            freeNextAt = Date.now() + ms;
            if (typeof cfg.onWait === 'function') cfg.onWait(ms);
            await sleep(ms, cfg.signal);
            attempt--;
            continue;
          }
          // A keyless failure is not worth retrying: the next attempt lands in
          // the same closed slot (429/5xx do not open it), so retrying only
          // adds a 30-second wait before the unavoidable fallback.
          if (keyless && e.status !== 400) throw e;
          const retryable = e.status === 429 || e.status >= 500;
          if (retryable && attempt === 0) {
            await sleep(e.status === 429 ? 5200 : 2200, cfg.signal);
            continue;
          }
          if (e.status === 400) break; // e.g. json mode unsupported → next pass
          if (retryable) break;
          throw e;
        }
      }
    }
    throw lastErr || new Error('AI provider call failed');
  }

  /** One line of the reply, short enough to show in an error. */
  function excerpt(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  /** Appended on the second try: repeat the shape and say what was wrong. */
  function repairNote(shape) {
    return '\n\nYour previous reply could not be used. Reply again with ONLY the JSON object described above — ' +
      'one entry per ITEM, no code fences, no commentary.\nShape: ' + shape;
  }

  /**
   * Ask, then ask once more when the reply cannot be turned into questions.
   * A model that ignores JSON mode, wraps the object in prose or stops early
   * gets one explicit second chance (colder, with more room) instead of the
   * whole batch silently falling back.
   */
  async function askForQuestions(call, built, items, modelLabel) {
    let lastText = '';
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      let res = null;
      try {
        res = await call({
          user: attempt ? built.user + repairNote(REPLY_SHAPE) : built.user,
          temperature: attempt ? 0.2 : undefined,
          maxTokens: attempt ? 8192 : undefined
        });
      } catch (e) {
        // An empty/blocked answer is worth one more try; auth and quota errors are not.
        if (!e || !e.empty || attempt === 1) throw e;
        lastErr = e;
        continue;
      }
      lastText = String((res && res.text) || '');
      try {
        const questions = normalizeQuestions(parseJsonLoose(lastText), items);
        if (questions.length) return questions;
      } catch (e) { /* not JSON at all → repair pass */ }
    }
    if (lastErr && !lastText) throw lastErr;
    const err = new Error('Model produced no usable questions');
    err.raw = lastText;
    err.friendly = modelLabel + ' answered, but not in the JSON shape VocabLab needs — try another model in Settings → AI.';
    err.detail = err.friendly + ' “Test & load models” lists what this provider serves. ' +
      'Reasoning models often wrap the JSON in prose or stop early, so a plain chat model is the safer pick.' +
      (lastText ? '\nIt began with: “' + excerpt(lastText) + '…”' : '');
    throw err;
  }

  async function generateOaiQuestions(cfg) {
    const { baseUrl, key, model, items, targetLang, meaningLang, signal } = cfg;
    if (!items || !items.length) return [];
    const built = buildPrompt(items, targetLang || 'French', meaningLang || 'Vietnamese',
      { difficulty: cfg.difficulty, requirement: cfg.requirement });
    return askForQuestions(function (extra) {
      return oaiCallWithFallbacks({
        baseUrl: baseUrl, key: key, model: model, system: built.system,
        user: extra.user, temperature: extra.temperature, maxTokens: extra.maxTokens,
        signal: signal, onWait: cfg.onWait
      });
    }, built, items, '“' + model + '”');
  }

  /* ---------- Paragraph translation ---------- */
  /* Two extra jobs besides word quizzes:
       · write a short paragraph out of the learner's own sheet words,
       · correct the learner's whole-paragraph translation with the smallest
         possible edit (keep their wording whenever it is acceptable). */

  const PARA_SHAPE = '{"paragraph":"...","reference":"...",' +
    '"keywords":[{"term":"...","meaning":"...","note":"..."}]}';
  const FIX_SHAPE = '{"score":82,"verdict":"good","corrected":"...",' +
    '"notes":[{"text":"...","fix":"...","why":"..."}],"used":["..."],"comment":"..."}';
  const UPGRADE_SHAPE = '{"upgrades":[{"from":"produire","to":"susciter","level":"B2",' +
    '"scope":"word","meaning":"...","why":"...","example":"..."}]}';
  const UPGRADE_LIST = '[{"from":"produire","to":"susciter","level":"B2","scope":"word",' +
    '"meaning":"...","why":"...","example":"..."}]';

  /** The correction reply asks for optional upgrades only in VI → target mode. */
  function fixShape(cfg) {
    if (!cfg || cfg.direction !== 'vi2fr') return FIX_SHAPE;
    return FIX_SHAPE.replace(/\}$/, ',"upgrades":' + UPGRADE_LIST + '}');
  }

  function uiLangName(cfg) {
    return langName((cfg && cfg.uiLang) || 'en', 'English');
  }

  function langName(code, fallback) {
    const s = String(code || '').toLowerCase();
    // Accept both a language name and a BCP-47 code (“fr” / “fr-FR”).
    if (s.indexOf('vi') === 0) return 'Vietnamese';
    if (s.indexOf('fr') === 0) return 'French';
    if (s.indexOf('en') === 0) return 'English';
    return code || fallback;
  }

  /** Which language the learner reads, and which one they must write. */
  function paraSides(cfg) {
    const targetLang = cfg.targetLang || 'French';
    const meaningLang = cfg.meaningLang || 'Vietnamese';
    const vi2fr = cfg.direction === 'vi2fr';
    return {
      vi2fr: vi2fr,
      sourceLang: vi2fr ? meaningLang : targetLang,
      answerLang: vi2fr ? targetLang : meaningLang
    };
  }

  /* Difficulty is a promise about the language, not a label: each level changes
     sentence length, CEFR range and how much support the explanation gives. */
  const DIFFICULTIES = {
    easy: {
      label: 'easy', cefr: 'A1–A2', blankWords: '5–9', keywords: '4–5',
      quizTip: 'Use very common words and short, simple sentences. Keep each explanation to one plain idea.',
      para: '3–4 sentences, 40–70 words, CEFR A1–A2',
      paraTip: 'Use short sentences and simple connectors (et, mais, parce que).'
    },
    standard: {
      label: 'standard', cefr: 'A2–B2', blankWords: '6–14', keywords: '5–6',
      quizTip: 'Use natural, everyday sentences at a comfortable level.',
      para: '4–6 sentences, 60–110 words, CEFR A2–B2',
      paraTip: 'Use varied but clear sentences with everyday connectors.'
    },
    hard: {
      label: 'hard', cefr: 'B1–C1', blankWords: '10–20', keywords: '5–6',
      quizTip: 'Use longer, richer sentences with subordinate clauses and precise vocabulary. Keep explanations accurate and under 12 words.',
      para: '6–8 sentences, 90–150 words, CEFR B1–C1',
      paraTip: 'Use varied, more complex sentences (relative clauses, contrast, cause) while staying natural.'
    }
  };
  function difficultyOf(value) {
    const key = String(value || '').toLowerCase();
    return DIFFICULTIES[key] || DIFFICULTIES.standard;
  }
  function requirementOf(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 600);
  }

  function buildParagraphPrompt(cfg) {
    const sides = paraSides(cfg);
    const level = difficultyOf(cfg.difficulty);
    const request = requirementOf(cfg.requirement);
    const target = cfg.targetLang || 'French';
    const meaning = cfg.meaningLang || 'Vietnamese';
    const words = (cfg.words || []).map(function (w) { return { term: w.term, meaning: w.meaning }; });
    const system = 'You are VocabLab, an expert ' + target + ' tutor. You write short, ' +
      'natural, classroom-safe texts for a learner whose native language is ' + meaning +
      '. You reply with the requested JSON object only and never add commentary. Never use Markdown in the ' +
      'paragraph or reference.';
    const user =
      'Write ONE coherent ' + sides.sourceLang + ' paragraph (' + level.para + ') about a ' +
      'single everyday topic (city life, transport, environment, work, health, travel, food…).\n\n' +
      (request
        ? 'TOPIC OR FOCUS REQUESTED BY THE LEARNER (follow it when it does not conflict with the rules below):\n"""' +
          request + '"""\n\n'
        : '') +
      'VOCABULARY from the learner\'s own sheet (term = ' + target + ', meaning = ' + meaning + '):\n' +
      JSON.stringify(words, null, 1) + '\n\n' +
      'Rules:\n' +
      '• The paragraph MUST be written entirely in ' + sides.sourceLang + '. The reference MUST be written ' +
      'entirely in ' + sides.answerLang + '.\n' +
      '• Do not use Markdown or formatting in "paragraph" or "reference": no **bold**, no __, no backticks, ' +
      'no bullet lists, and no parenthetical translations.\n' +
      '• Difficulty: ' + level.label + ' (' + level.cefr + '). ' + level.paraTip + '\n' +
      '• Pick ' + level.keywords + ' words that fit the topic best. The paragraph MUST contain each of them ' +
      (sides.vi2fr
        ? 'through its `meaning` (the ' + meaning + ' side), never by copying its `term` or adding the ' +
          target + ' translation in parentheses. Example: the target “subir” with meaning “tăng lên” → write ' +
          '“chi phí tăng lên”, never “chi phí subir”. The learner has to produce the ' + target + ' term. ' +
          'The reference must use each chosen `term`.\n'
        : 'through its `term` (the ' + target + ' side), and must not add its `meaning` translation in ' +
          'parentheses. The reference must use each chosen `meaning` and must not copy the target terms.\n') +
      '• Use them naturally — an inflected form is fine — and make the text flow with connectors; it must not ' +
      'read like a list of example sentences.\n' +
      '• No names of real people, no numbers that carry meaning, nothing political or unsafe.\n' +
      '• "reference": an accurate, natural ' + sides.answerLang + ' translation of the whole paragraph.\n' +
      '• "keywords": the words you used, with "term" and "meaning" copied exactly from VOCABULARY, plus "note": ' +
      'a reminder of how to use that word in ' + sides.answerLang + ' (collocation, preposition, register), ' +
      'max 12 words. Same order as they appear.\n\n' +
      'Reply with ONE JSON object, no prose, no code fences, exactly this shape:\n' + PARA_SHAPE;
    return { system: system, user: user };
  }

  function buildCorrectionPrompt(cfg) {
    const sides = paraSides(cfg);
    const keywords = (cfg.keywords || []).map(function (k) {
      return { term: k.term, meaning: k.meaning };
    });
    const system = 'You are VocabLab, a patient ' + (cfg.targetLang || 'French') + ' tutor who corrects a ' +
      'learner\'s translation with the smallest possible change. The learner may legitimately choose their own ' +
      'pronoun, tense or wording — only genuine errors are corrected. You reply with the requested JSON ' +
      'object only.';
    const user =
      'The learner translated a ' + sides.sourceLang + ' paragraph into ' + sides.answerLang + '.\n\n' +
      'SOURCE (' + sides.sourceLang + '):\n"""' + String(cfg.source || '') + '"""\n\n' +
      'REFERENCE TRANSLATION (' + sides.answerLang + '):\n"""' + String(cfg.reference || '') + '"""\n\n' +
      'WORDS THE LEARNER HAD TO USE (' + sides.answerLang + ' side):\n' + JSON.stringify(keywords, null, 1) + '\n\n' +
      'LEARNER\'S TRANSLATION (' + sides.answerLang + '):\n"""' + String(cfg.userText || '') + '"""\n\n' +
      'Rules:\n' +
      '• The REFERENCE is only a guide to the meaning — it is NOT the answer the learner had to produce. ' +
      'The learner may choose another subject pronoun (je, tu, il, elle, on, nous, vous, ils, elles), another ' +
      'tense or mood (présent, passé composé, imparfait, futur, conditionnel…), another correct word order, ' +
      'or a synonym. Never “correct” any of those just because the reference used something else.\n' +
      '• Correct only genuine errors in the learner\'s own sentence: spelling and accents, a verb that does ' +
      'not agree with the subject the learner actually wrote, an adjective that does not agree with its noun, ' +
      'a wrong preposition, word order that is really wrong (not merely different), or a word that changes ' +
      'the meaning of the source.\n' +
      '• Keep the learner\'s words, sentence order and sentence count. Do not restructure, merge or split a ' +
      'phrase, and do not replace a correct phrase with more elegant wording.\n' +
      '• If a phrase is already acceptable, leave it exactly as written. When you are not sure something is ' +
      'an error, leave it unchanged — a missing note is better than a wrong one.\n' +
      '• One note per individual fix: "text" quotes the learner\'s exact wording, "fix" is the corrected ' +
      'wording, "why" explains it in English in at most 15 words. Never bundle several fixes into one note, ' +
      'and never write a note whose "fix" is the same as its "text". At most 10 notes.\n' +
      '• Check the meaning first: the learner\'s text must convey the ideas of the SOURCE. If it is unrelated, ' +
      'or leaves out or contradicts a whole idea, that is a meaning error — score it below 50 and say what is ' +
      'missing in "comment". Do not rewrite the text for this and do not add notes for ideas that are simply absent.\n' +
      '• Each required word that the learner does not use costs 10 points. With no other error and no change ' +
      'to their text, the score is 100 minus 10 per missing required word.\n' +
      '• "used": the exact "term" values from the word list the learner actually used (an inflected form counts).\n' +
      '• "score": start from 100 and subtract for the genuine sentence errors above, for source ideas that are ' +
      'missing or contradicted, and for required words that are missing. Do not lower it for a different ' +
      'pronoun, tense or synonym. "verdict": "good" (80+), "fair" (60–79) or "weak" (below 60). ' +
      '"comment": one encouraging sentence in ' + uiLangName(cfg) + ' naming the main thing to improve.\n' +
      (sides.vi2fr
        ? '• "upgrades": up to 12 optional style improvements to the learner\'s own target-language wording. ' +
          'They are not grammar corrections: never put a spelling/agreement fix here. Suggest only natural, ' +
          'polite B1/B2 written ' + (cfg.targetLang || 'French') + ', preferring B2 because the learner is ' +
          'preparing DELF B2. Replace a repeated, vague, basic or informal word/phrase with a more precise one; ' +
          'or rewrite one whole sentence when that makes it flow better. Keep the learner\'s meaning, facts, ' +
          'names, numbers, stance and every required word. Do not add new ideas. Do not suggest rare, literary ' +
          'or C1 vocabulary. Write every replacement in ' + (cfg.targetLang || 'French') +
          '; never in Vietnamese, which is the source language. ' +
          'If there is no safe improvement, return [].\n' +
          '  Each upgrade has: "from" (exact substring of the learner text), "to" (the replacement), ' +
          '"level" ("B1" or "B2"), "scope" ("word" for a word/phrase or "sentence" for a whole sentence), ' +
          '"meaning" and "why" in ' + uiLangName(cfg) + ' (short), and "example" in ' +
          (cfg.targetLang || 'French') + '.\n\n'
        : '\n') +
      'Reply with ONE JSON object, no prose, no code fences, exactly this shape:\n' + fixShape(cfg);
    return { system: system, user: user };
  }

  /**
   * Optional B1/B2 upgrades for a typed VI → target quiz answer.
   * The paragraph path gets upgrades from the correction reply; this is the
   * smaller, cached call used by word/phrase questions.
   */
  function buildUpgradePrompt(cfg) {
    const target = cfg.targetLang || 'French';
    const source = String(cfg.source || '').trim();
    const reference = String(cfg.reference || '').trim();
    const userText = String(cfg.userText || '').trim();
    const system = 'You are VocabLab, a DELF B2 writing tutor. You improve a learner\'s ' + target +
      ' wording without changing the idea. Reply with the requested JSON object only.';
    const user =
      'The learner answered a Vietnamese → ' + target + ' translation question correctly.\n\n' +
      'VIETNAMESE PROMPT:\n"""' + source + '"""\n\n' +
      'EXPECTED ' + target.toUpperCase() + ' ANSWER:\n"""' + reference + '"""\n\n' +
      'LEARNER\'S CORRECT ANSWER:\n"""' + userText + '"""\n\n' +
      'Suggest up to 12 optional upgrades at B1/B2 level, preferring B2 because the learner is preparing ' +
      'DELF B2. A quiz answer may be only a word, so do not invent a sentence. Keep the exact meaning and ' +
      'the learner\'s register appropriate for polite written ' + target + '. Replace basic, vague, repeated ' +
      'or informal wording with precise, natural wording; do not suggest C1/literary/rare words. ' +
      'Every replacement must be written in ' + target + ', never in Vietnamese, which is the source ' +
      'language the learner is translating from. If there is no safe upgrade, return {"upgrades":[]}.\n' +
      'Each object: "from" (exact substring of the learner\'s answer), "to" (the replacement), ' +
      '"level" ("B1" or "B2"), "scope" ("word" or "sentence"), "meaning" and "why" in ' +
      uiLangName(cfg) + ' (short), "example" in ' + target + '.\n\n' +
      'Reply with ONE JSON object, no prose, no code fences, exactly this shape:\n' + UPGRADE_SHAPE;
    return { system: system, user: user };
  }

  /** Letters used in Vietnamese but not in French or English. */
  const VIETNAMESE_ONLY = /[\u0103\u0111\u01a1\u01b0\u1ea1\u1ea3\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7\u1eb9\u1ebb\u1ebd\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7\u1ec9\u1ecb\u1ecd\u1ecf\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u1edb\u1edd\u1edf\u1ee1\u1ee3\u1ee5\u1ee7\u1ee9\u1eeb\u1eed\u1eef\u1ef1\u1ef3\u1ef5\u1ef7\u1ef9]/i;

  /** Keep only safe, applicable, B1/B2 suggestions. */
  function normalizeUpgrades(raw, cfg) {
    const text = String((cfg && cfg.userText) || '');
    const list = pickField(raw || {}, ['upgrades', 'suggestions', 'improvements', 'levelUp', 'level_up']);
    if (!Array.isArray(list)) return [];
    const flat = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
    const seen = new Set();
    const out = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const from = flat(item.from || item.original || item.text);
      const to = flat(item.to || item.replacement || item.fix || item.corrected);
      if (!from || !to || from === to) continue;
      if (text && text.indexOf(from) === -1) continue;
      if (to.indexOf('**') !== -1 || to.indexOf('`') !== -1) continue;
      // Suggestions are target-language only: never offer a Vietnamese word,
      // even when the model slips one in. These letters exist in Vietnamese
      // and not in French or English.
      if (VIETNAMESE_ONLY.test(to)) continue;
      const level = flat(item.level || item.cefr).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (level !== 'B1' && level !== 'B2') continue;
      const words = from.split(/\s+/).length;
      const scope = flat(item.scope).toLowerCase() === 'sentence' || words >= 8 ||
        /[.!?…]$/.test(from) ? 'sentence' : 'word';
      const key = from + '\u0000' + to;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        from: from,
        to: to,
        level: level,
        scope: scope,
        meaning: flat(item.meaning || item.gloss || ''),
        why: flat(item.why || item.reason || item.note || item.explanation || ''),
        example: flat(item.example || item.exemple || ''),
        dict: null
      });
    }
    // B2 suggestions are the goal of the exercise, so they come first; the
    // relative order inside each level stays exactly as the model wrote it.
    const ranked = out.filter(function (up) { return up.level === 'B2'; })
      .concat(out.filter(function (up) { return up.level !== 'B2'; }));
    return ranked.slice(0, 12);
  }

  /** The sheet word a model's keyword refers to, by term or by meaning. */
  function wordForKeyword(term, meaning, words) {
    const wanted = Util.normalizeForCompare(Util.stripDiacritics(term));
    const wantedMeaning = Util.normalizeForCompare(Util.stripDiacritics(meaning));
    for (const w of words) {
      if (wanted && Util.normalizeForCompare(Util.stripDiacritics(w.term)) === wanted) return w;
    }
    for (const w of words) {
      if (wanted && looseKey(w.term) === looseKey(term)) return w;
    }
    for (const w of words) {
      const m = Util.normalizeForCompare(Util.stripDiacritics(w.meaning));
      if (wantedMeaning && m === wantedMeaning) return w;
    }
    return null;
  }

  /** Plain prose only: models sometimes decorate a paragraph with **markdown**. */
  function cleanParaText(value) {
    return String(value || '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeParagraph(raw, words, cfg) {
    if (!raw || typeof raw !== 'object') return null;
    const text = cleanParaText(pickField(raw, ['paragraph', 'text', 'source', 'passage', 'content']));
    const reference = cleanParaText(pickField(raw, ['reference', 'translation', 'answer', 'translated']));
    if (!text) return null;
    if (!reference) return null;
    const listed = pickField(raw, ['keywords', 'mustUse', 'must_use', 'words', 'vocabulary']);
    const keywords = [];
    for (const entry of (Array.isArray(listed) ? listed : [])) {
      const term = typeof entry === 'string' ? entry : (entry && (entry.term || entry.word));
      const meaning = entry && typeof entry === 'object' ? entry.meaning : '';
      const note = entry && typeof entry === 'object'
        ? String(entry.note || entry.why || entry.hint || '').trim() : '';
      // The sheet is the source of truth for spelling and meaning — never the model.
      const word = wordForKeyword(term, meaning, words || []);
      if (!word) continue;
      if (keywords.some(function (k) { return Util.normalize(k.term) === Util.normalize(word.term); })) continue;
      keywords.push({ term: word.term, meaning: word.meaning, note: note });
      if (keywords.length >= 6) break;
    }
    if (keywords.length < 3) return null;

    // The source and the reference must be in opposite languages. Models
    // sometimes put the target terms inside a VI→target source as a gloss;
    // reject that reply so it is regenerated instead of showing a mixed text.
    if (cfg && cfg.direction === 'vi2fr') {
      if (keywords.some(function (k) { return mentionsAnyTerm(text, k.term); })) return null;
      if (keywords.some(function (k) { return !mentionsAnyForm(reference, k.term); })) return null;
    } else if (cfg && cfg.direction === 'fr2vi') {
      if (keywords.some(function (k) { return !mentionsAnyForm(text, k.term); })) return null;
      if (keywords.some(function (k) { return mentionsMeaning(text, k.meaning); })) return null;
      if (keywords.some(function (k) { return mentionsAnyTerm(reference, k.term); })) return null;
    }

    return { paragraph: text, reference: reference, keywords: keywords };
  }

  /** Treat straight and curly apostrophes as word separators. */
  function paraNorm(value) {
    return Util.normalizeForCompare(Util.stripDiacritics(value)).replace(/[’']/g, ' ');
  }

  /** Exact normalized form, for catching a target term copied into a source text. */
  function mentionsTerm(text, term) {
    const hay = paraNorm(text);
    const needle = paraNorm(term);
    if (!hay || !needle) return false;
    return (' ' + hay + ' ').indexOf(' ' + needle + ' ') !== -1;
  }

  /** Did the learner use this word (or a simple inflection of it)? */
  function mentionsForm(text, word) {
    const hay = paraNorm(text);
    const needle = paraNorm(word);
    if (!hay || !needle) return false;
    if (hay.indexOf(needle) !== -1) return true;
    // “constater” → “constate”, “rester” → “restent”, “subir” → “subissent”:
    // compare a few stems, long enough not to match an unrelated word.
    const stem = needle.split(' ').filter(function (w) { return w.length >= 5; })[0];
    if (!stem) return false;
    const stems = [stem.slice(0, Math.max(5, Math.min(7, stem.length - 1)))];
    if (/ir$/.test(stem)) stems.push(stem.slice(0, -1));
    if (/er$/.test(stem)) stems.push(stem.slice(0, -2));
    if (/re$/.test(stem)) stems.push(stem.slice(0, -2));
    return stems.some(function (s) { return s.length >= 4 && hay.indexOf(s) !== -1; });
  }

  /** A sheet term such as “excessif / excessive” or “petit(e)” has several forms. */
  function termForms(term) {
    const raw = String(term || '').trim();
    if (!raw) return [];
    const parts = raw.split(/[\/,;()]/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length >= 2; });
    const forms = [raw].concat(parts);
    return forms.filter(function (s, i) { return forms.indexOf(s) === i; });
  }

  function mentionsAnyForm(text, term) {
    return termForms(term).some(function (form) { return mentionsForm(text, form); });
  }

  /** Stricter than mentionsAnyForm: avoid short words matching inside another word. */
  function mentionsAnyTerm(text, term) {
    return termForms(term).some(function (form) {
      return mentionsTerm(text, form) || (form.length >= 6 && mentionsForm(text, form));
    });
  }

  /** Long Vietnamese meanings are safe to detect; skip short ones such as “lá”. */
  function mentionsMeaning(text, meaning) {
    return termForms(meaning).some(function (form) {
      return paraNorm(form).length >= 4 &&
        (mentionsTerm(text, form) || mentionsForm(text, form));
    });
  }

  function normalizeCorrection(raw, keywords, cfg) {
    if (!raw || typeof raw !== 'object') return null;
    const corrected = pickField(raw, ['corrected', 'correction', 'fixed', 'revised', 'answer']);
    if (typeof corrected !== 'string' || !corrected.trim()) return null;
    const list = keywords || [];
    let score = Number(pickField(raw, ['score', 'points', 'grade']));
    if (!isFinite(score)) score = 60;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const notes = [];
    const seen = new Set();
    const rawNotes = pickField(raw, ['notes', 'corrections', 'changes', 'errors']);
    const flat = function (s) { return String(s || '').trim().replace(/\s+/g, ' '); };
    for (const n of (Array.isArray(rawNotes) ? rawNotes : [])) {
      let note = null;
      if (typeof n === 'string') {
        if (n.trim()) note = { text: '', fix: '', why: n.trim() };
      } else if (n && typeof n === 'object') {
        const text = String(n.text || n.quote || n.original || '').trim();
        const fix = String(n.fix || n.corrected || n.correction || '').trim();
        const why = String(n.why || n.note || n.explanation || n.reason || '').trim();
        if (text || fix || why) note = { text: text, fix: fix, why: why };
      }
      if (!note) continue;
      // A “correction” that leaves the wording unchanged is noise, and asking
      // for the same fix twice only makes the panel look harsher than it is.
      if (note.text && flat(note.text) === flat(note.fix)) continue;
      const key = flat(note.text) + '|' + flat(note.fix);
      if (seen.has(key)) continue;
      seen.add(key);
      notes.push(note);
      if (notes.length >= 10) break;
    }
    // Unchanged text + no notes means there is no wording fix to make. What can
    // still be missing is a required word: 10 points each. With all of them
    // present the answer is perfect, whatever score the model guessed — a
    // different pronoun, tense or synonym must never cost points.
    const rawUsed = pickField(raw, ['used', 'usedKeywords', 'used_keywords']);
    const aiUsed = Array.isArray(rawUsed);
    const usedSet = new Set((aiUsed ? rawUsed : []).map(function (v) {
      return Util.normalize(String(v && v.term ? v.term : v));
    }));
    const vi2fr = cfg && cfg.direction === 'vi2fr';
    const used = list.map(function (k) {
      const local = mentionsForm(cfg && cfg.userText, vi2fr ? k.term : k.meaning);
      // The model may give credit for an inflection we cannot see, but it must
      // not mark a word missing when it is plainly in the text: a false ✗ is
      // unfair and demotivating.
      const byModel = aiUsed && usedSet.has(Util.normalize(k.term));
      return { term: k.term, meaning: k.meaning, used: byModel || local };
    });
    if (!notes.length && flat(corrected) === flat(cfg && cfg.userText)) {
      const missing = used.filter(function (u) { return !u.used; }).length;
      score = missing ? Math.max(40, 100 - missing * 10) : 100;
    }
    return {
      score: score,
      verdict: score >= 80 ? 'good' : score >= 60 ? 'fair' : 'weak',
      corrected: String(corrected).trim(),
      notes: notes,
      used: used,
      comment: String(pickField(raw, ['comment', 'feedback', 'summary']) || '').trim(),
      upgrades: cfg && cfg.direction === 'vi2fr' ? normalizeUpgrades(raw, cfg) : []
    };
  }

  /** One provider-agnostic call, retried once if the reply cannot be used. */
  function makeCaller(cfg, built) {
    return function (extra) {
      if ((cfg.provider || 'gemini') === 'gemini') {
        return callWithFallbacks({
          key: cfg.key, model: cfg.model, system: built.system, user: extra.user,
          // The repair pass asks for a colder, tighter answer — forward it, or
          // every Gemini attempt silently runs at the default temperature.
          temperature: extra.temperature, maxTokens: extra.maxTokens,
          signal: cfg.signal, noSchema: true
        });
      }
      return oaiCallWithFallbacks({
        baseUrl: cfg.baseUrl, key: cfg.key, model: cfg.model, system: built.system,
        user: extra.user, temperature: extra.temperature, maxTokens: extra.maxTokens,
        signal: cfg.signal, onWait: cfg.onWait
      });
    };
  }

  async function askForJson(call, built, accept, modelLabel, shape, what, repair) {
    let lastText = '';
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      let res = null;
      try {
        res = await call({
          user: attempt ? built.user + (repair || repairNote(shape)) : built.user,
          temperature: attempt ? 0.2 : undefined,
          maxTokens: attempt ? 8192 : undefined
        });
      } catch (e) {
        if (!e || !e.empty || attempt === 1) throw e;
        lastErr = e;
        continue;
      }
      lastText = String((res && res.text) || '');
      try {
        const value = accept(parseJsonLoose(lastText));
        if (value) return value;
      } catch (e) { /* not JSON → repair pass */ }
    }
    if (lastErr && !lastText) throw lastErr;
    const err = new Error('Model produced no usable ' + what);
    err.raw = lastText;
    err.paragraph = true;
    err.friendly = modelLabel + ' answered, but not in the shape this exercise needs — try again, or pick ' +
      'another model in Settings → AI.';
    err.detail = err.friendly + ' The reply has to be one JSON object; reasoning models often wrap it in prose ' +
      'or stop early. “Test & load models” lists what this provider serves.' +
      (lastText ? '\nIt began with: “' + excerpt(lastText) + '…”' : '');
    throw err;
  }

  /**
   * Write a paragraph from the learner's sheet words.
   * Returns { paragraph, reference, keywords:[{term,meaning,note}] }.
   */
  async function generateParagraph(cfg) {
    const words = cfg.words || [];
    if (words.length < 3) throw new Error('Not enough words for a paragraph');
    const built = buildParagraphPrompt(cfg);
    const reason = cfg.direction === 'vi2fr'
      ? 'The "paragraph" must be entirely ' + (cfg.meaningLang || 'Vietnamese') + ': use the "meaning" of ' +
        'every keyword, never the target "term", and never add Markdown or parenthetical translations. ' +
        'The "reference" must be in ' + (cfg.targetLang || 'French') + ' and use every chosen "term".'
      : 'The "paragraph" must be entirely ' + (cfg.targetLang || 'French') + ' and contain every chosen ' +
        'target "term"; the "reference" must be in ' + (cfg.meaningLang || 'Vietnamese') + ' and must not copy ' +
        'those terms.';
    const repair = '\n\n' + reason + repairNote(PARA_SHAPE);
    return askForJson(makeCaller(cfg, built), built,
      function (raw) { return normalizeParagraph(raw, words, cfg); },
      '“' + cfg.model + '”', PARA_SHAPE, 'paragraph', repair);
  }

  /**
   * Correct a whole-paragraph translation with minimal changes.
   * Returns { score, verdict, corrected, notes, used, comment }.
   */
  async function correctParagraph(cfg) {
    const built = buildCorrectionPrompt(cfg);
    const keywords = cfg.keywords || [];
    return askForJson(makeCaller(cfg, built), built,
      function (raw) { return normalizeCorrection(raw, keywords, cfg); },
      '“' + cfg.model + '”', fixShape(cfg), 'correction');
  }

  /**
   * Optional B1/B2 suggestions for a correct typed VI → target quiz answer.
   * Returns an array (possibly empty) of normalized upgrades.
   */
  async function suggestUpgrades(cfg) {
    const built = buildUpgradePrompt(cfg);
    return askForJson(makeCaller(cfg, built), built,
      function (raw) { return normalizeUpgrades(raw, cfg); },
      '“' + cfg.model + '”', UPGRADE_SHAPE, 'vocabulary suggestions');
  }

  /**
   * Ask the grammar tutor a free-form question. Unlike the question and
   * paragraph generators this returns prose, so it must not request JSON mode.
   * cfg: { provider, key, baseUrl?, model, system, prompt, signal, onWait }
   */
  async function askTutor(cfg) {
    const system = String(cfg.system || '').trim();
    const user = String(cfg.prompt || '').trim();
    if (!user) throw new Error('Ask the tutor a question first.');
    let res;
    try {
      if ((cfg.provider || 'gemini') === 'gemini') {
        res = await callWithFallbacks({
          key: cfg.key, model: cfg.model, system: system, user: user,
          signal: cfg.signal, noSchema: true, plain: true
        });
      } else {
        res = await oaiCallWithFallbacks({
          baseUrl: cfg.baseUrl, key: cfg.key, model: cfg.model,
          system: system, user: user,
          temperature: cfg.temperature == null ? 0.55 : cfg.temperature,
          maxTokens: cfg.maxTokens || 1600,
          signal: cfg.signal, onWait: cfg.onWait, plain: true
        });
      }
    } catch (err) {
      // The quiz fallback mentions built-in questions; that advice is wrong here.
      if (err && err.empty) {
        err.friendly = 'The AI tutor returned an empty answer. Try again, or ask a shorter question.';
      }
      throw err;
    }
    const text = String((res && res.text) || '').trim();
    if (!text) {
      const err = new Error('The AI tutor returned an empty answer.');
      err.empty = true;
      err.friendly = 'The AI tutor returned an empty answer. Try again, or ask a shorter question.';
      throw err;
    }
    return { text: text, usage: (res && res.usage) || null };
  }

  /* ---------- Pronunciation scoring from audio ---------- */
  /* Gemini Flash accepts short audio clips, so a learner's recording can be
     judged without spending Azure's speech-to-text allowance. The model hears
     the clip and estimates a score — not phoneme-level like Azure — so the UI
     labels the result as an AI estimate. Free-tier audio is sent to Google. */

  const SPEECH_SHAPE = '{"transcript":"...","score":0,"accuracy":0,"fluency":0,' +
    '"completeness":0,"words":[{"word":"...","accuracy":0,' +
    '"errorType":"None|Mispronunciation|Omission|Insertion"}],"tips":"..."}';

  const SPEECH_SCHEMA = {
    type: 'object',
    properties: {
      transcript: { type: 'string' },
      score: { type: 'integer' },
      accuracy: { type: 'integer' },
      fluency: { type: 'integer' },
      completeness: { type: 'integer' },
      words: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            word: { type: 'string' },
            accuracy: { type: 'integer' },
            errorType: { type: 'string', enum: ['None', 'Mispronunciation', 'Omission', 'Insertion'] }
          },
          required: ['word', 'accuracy', 'errorType']
        }
      },
      tips: { type: 'string' }
    },
    required: ['transcript', 'score', 'accuracy', 'fluency', 'completeness', 'words', 'tips'],
    propertyOrdering: ['transcript', 'score', 'accuracy', 'fluency', 'completeness', 'words', 'tips']
  };

  function buildSpeechPrompt(cfg) {
    const reference = String(cfg.reference || '').trim();
    const lang = langName(cfg.lang, 'French');
    const system = 'You are a strict but encouraging ' + lang + ' pronunciation examiner. ' +
      'You judge only the audio you were given and never assume the learner said the reference correctly.';
    const user =
      'The attached clip is one learner reading this ' + lang + ' sentence:\n' +
      '“' + reference + '”\n\n' +
      '1. Transcribe exactly what you hear — do not correct it towards the sentence.\n' +
      '2. Judge how clearly the learner pronounced it.\n' +
      'Calibration: 90+ only for a clear, natural reading with almost no accent; 75–89 clear but ' +
      'noticeably accented; 60–74 understandable with effort; below 60 hard to follow. Do not inflate scores.\n' +
      'Accuracy covers individual sounds and word stress; fluency covers rhythm, pauses and hesitation; ' +
      'completeness compares how many reference words were actually said.\n' +
      '3. List every reference word in order with a 0–100 accuracy and an errorType of ' +
      '"None", "Mispronunciation", "Omission" or "Insertion". Mark omitted words "Omission".\n' +
      '4. Give at most two short, concrete practice tips in English, no markdown.\n' +
      'Reply with JSON only: ' + SPEECH_SHAPE;
    return { system: system, user: user };
  }

  function speechScore(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Math.round(Number(value));
    if (!isFinite(n)) return null;
    return Math.max(0, Math.min(100, n));
  }

  /** Turn one model reply into the shape the shadowing UI already renders. */
  function normalizeSpeechResult(raw, reference) {
    raw = raw || {};
    const transcript = String(raw.transcript || '').replace(/\s+/g, ' ').trim();
    if (!transcript) {
      const err = new Error('No speech was heard in the recording');
      err.empty = true;
      err.friendly = 'Gemini could not hear any speech in that recording. Record a little closer to the ' +
        'microphone, for the whole sentence, and try again.';
      throw err;
    }
    const words = (Array.isArray(raw.words) ? raw.words : []).map(function (w) {
      if (!w) return null;
      return {
        word: String(w.word || '').trim(),
        accuracy: speechScore(w.accuracy),
        errorType: String(w.errorType || '').trim() || 'None'
      };
    }).filter(function (w) { return w && w.word; }).slice(0, 80);

    const accuracy = speechScore(raw.accuracy);
    const fluency = speechScore(raw.fluency);
    const completeness = speechScore(raw.completeness);
    const overall = speechScore(raw.score);
    const known = [accuracy, fluency, completeness].filter(function (v) { return v != null; });
    const fallback = known.length
      ? Math.round(known.reduce(function (sum, v) { return sum + v; }, 0) / known.length)
      : (overall == null ? 0 : overall);
    const score = overall == null ? fallback : overall;
    return {
      source: 'gemini',
      score: score,
      accuracy: accuracy == null ? score : accuracy,
      fluency: fluency == null ? score : fluency,
      completeness: completeness == null ? score : completeness,
      recognized: transcript,
      words: words,
      tips: String(raw.tips || '').trim(),
      reference: String(reference || '')
    };
  }

  async function speechHttpError(res) {
    let detail = '';
    try {
      const body = await res.json();
      detail = (body && body.error && body.error.message) || '';
    } catch (e) { /* ignore */ }
    const err = new Error('Gemini pronunciation check failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
    err.status = res.status;
    if (res.status === 400 && /API key not valid/i.test(detail)) {
      err.friendly = 'That Gemini API key is not valid. Create/copy one at aistudio.google.com/apikey.';
    } else if (res.status === 401 || res.status === 403) {
      err.friendly = 'Gemini denied the pronunciation check (403). The key may be restricted, or audio input ' +
        'may not be available for this key’s region.';
    } else if (res.status === 404) {
      err.friendly = 'The Gemini model used for scoring was not found. Pick another model in Settings → AI.';
    } else if (res.status === 429) {
      err.friendly = 'Gemini’s free-tier limit is reached (429). Wait a minute and try again, or switch ' +
        'Pronunciation scoring to Azure in Settings → Speech.';
    } else if (res.status === 413) {
      err.friendly = 'That recording is too large for Gemini. Keep sentences short (under a minute) and try again.';
    } else if (res.status === 400) {
      err.friendly = 'Gemini rejected the audio request. Use a model that accepts audio (for example ' +
        'gemini-flash-latest) in Settings → AI, then try again.';
    } else if (res.status >= 500) {
      err.friendly = 'Gemini had a server error (' + res.status + '). Try again shortly.';
    } else {
      err.friendly = err.message;
    }
    return err;
  }

  async function geminiSpeechCall(cfg) {
    const url = BASE + '/' + normalizeModelPath(cfg.model || 'gemini-flash-latest') + ':generateContent';
    const generationConfig = {
      temperature: 0.15,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    };
    if (cfg.firstPass) {
      generationConfig.responseSchema = SPEECH_SCHEMA;
      // Flash models think before answering unless told not to; a scoring
      // reply is short, so skipping that keeps latency and tokens down.
      const thinking = leastThinking(cfg.model || 'gemini-flash-latest');
      if (thinking) generationConfig.thinkingConfig = thinking;
    }
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 60000) : null;
    if (ctrl && cfg.signal) {
      if (cfg.signal.aborted) ctrl.abort();
      else cfg.signal.addEventListener('abort', function () { ctrl.abort(); });
    }
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': normalizeKey(cfg.key) },
        body: JSON.stringify({
          systemInstruction: cfg.built.system ? { parts: [{ text: cfg.built.system }] } : undefined,
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: cfg.mimeType || 'audio/wav', data: cfg.audio } },
              { text: cfg.built.user }
            ]
          }],
          generationConfig: generationConfig,
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
          ]
        }),
        signal: ctrl ? ctrl.signal : undefined
      });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        const err = new Error('The Gemini pronunciation check timed out.');
        err.friendly = 'The Gemini pronunciation check took too long. Check the network and try again.';
        throw err;
      }
      const err = new Error('Network error while contacting Gemini');
      err.friendly = 'Could not reach Gemini for the pronunciation check. Check the internet connection, or ' +
        'switch Pronunciation scoring to Azure in Settings → Speech.';
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (!res.ok) throw await speechHttpError(res);

    const data = await res.json();
    usageBump(1);
    const cand = (data.candidates || [])[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.map(function (p) { return p && p.text ? p.text : ''; }).join('');
    if (!text) {
      const reason = (data.promptFeedback && data.promptFeedback.blockReason) || (cand && cand.finishReason) || 'unknown';
      const err = new Error('Gemini returned no pronunciation result (' + reason + ')');
      err.empty = true;
      err.friendly = 'Gemini returned no result (' + reason + '). Try again with a shorter, clearer recording.';
      throw err;
    }
    return { text: text };
  }

  /**
   * Score one recording with Gemini's audio input.
   * cfg: { key, model, audio (base64), mimeType, reference, lang, signal }
   * Returns the same shape as Azure's assessment, plus source and tips.
   */
  async function assessSpeech(cfg) {
    cfg = cfg || {};
    if (!cfg.audio) throw new Error('Record a sentence before asking for a score.');
    if (!normalizeKey(cfg.key)) {
      const err = new Error('Gemini key missing');
      err.friendly = 'Add a free Gemini key in Settings → AI to score recordings with AI. ' +
        'You can also switch Pronunciation scoring to Azure in Settings → Speech.';
      throw err;
    }
    const built = buildSpeechPrompt(cfg);
    let lastErr = null;
    for (let pass = 0; pass < 2; pass++) {
      try {
        const res = await geminiSpeechCall({
          key: cfg.key, model: cfg.model, audio: cfg.audio, mimeType: cfg.mimeType,
          lang: cfg.lang, built: built, signal: cfg.signal, firstPass: pass === 0
        });
        let raw = null;
        try { raw = parseJsonLoose(res.text); } catch (e) { /* handled below */ }
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          const err = new Error('Gemini answered but not in the scoring format.');
          err.friendly = 'Gemini answered, but not in the shape VocabLab needs for a score. ' +
            'Pick another Gemini model in Settings → AI and try again.';
          throw err;
        }
        return normalizeSpeechResult(raw, cfg.reference);
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        lastErr = e;
        // A 400 usually means this model rejects the response schema or the
        // no-thinking flag; retry once with a plain JSON request.
        if (e && e.status === 400 && pass === 0) continue;
        throw e;
      }
    }
    throw lastErr || new Error('Gemini could not score the recording.');
  }

  /* ---------- Usage counter ---------- */
  function usageGet() {
    const u = Util.lsGet('usage', null);
    const today = Util.todayKey();
    if (!u || u.date !== today) return { date: today, count: 0 };
    return u;
  }
  function usageBump(n) {
    const u = usageGet();
    u.count += (n || 1);
    Util.lsSet('usage', u);
    return u;
  }

  /* ---------- JSON helpers ---------- */
  function extractBalanced(text, start) {
    const stack = [];
    let inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']');
      else if (c === '}' || c === ']') {
        if (stack.length && stack[stack.length - 1] === c) {
          stack.pop();
          if (!stack.length) return text.slice(start, i + 1);
        } else return null;
      }
    }
    return null;
  }

  function parseJsonLoose(text) {
    let t = String(text || '').trim();
    if (!t) throw new Error('Empty model response');
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
    try { return JSON.parse(t); } catch (e) { /* keep going */ }
    const start = t.search(/[{[]/);
    if (start !== -1) {
      const chunk = extractBalanced(t, start);
      if (chunk) {
        try { return JSON.parse(chunk); }
        catch (e) {
          try { return JSON.parse(chunk.replace(/,\s*([}\]])/g, '$1')); } catch (e2) { /* keep going */ }
        }
      }
    }
    // last resort: strip trailing commas globally
    try { return JSON.parse(t.replace(/,\s*([}\]])/g, '$1')); } catch (e) { /* no luck */ }
    throw new Error('Could not parse the model output as JSON');
  }

  /* ---------- Thinking control ---------- */
  /*
   * A “thinking” Gemini model spends 1–3 minutes reasoning before it writes
   * anything, which looks exactly like a hang. How to turn that down changed
   * with the model family, and the two ways are not interchangeable:
   *   · Gemini 2.5 takes a token budget — 0 switches thinking off; Pro refuses
   *     0 and its smallest allowed budget is 128.
   *   · Gemini 3 dropped the budget for thinkingLevel (minimal | low | …); a
   *     budget sent to it is either a 400 or, worse, is ignored — and then the
   *     model quietly thinks for minutes anyway.
   * Aliases move, so “gemini-flash-latest” must be treated as the newest family.
   */
  function leastThinking(model) {
    const id = String(normalizeModelPath(model || '')).toLowerCase();
    const found = /gemini-(\d+)(?:\.(\d+))?/.exec(id);
    const version = found ? Number(found[1] + '.' + (found[2] || '0')) : 0;
    const pro = /pro/.test(id);
    // A “-latest” alias is reassigned to the newest family whenever Google
    // ships one, so it can never be judged by its own name.
    if (/flash-latest|pro-latest/.test(id)) return { thinkingLevel: pro ? 'low' : 'minimal' };
    if (version >= 3) return { thinkingLevel: pro ? 'low' : 'minimal' };
    if (version >= 2.5) return pro ? { thinkingBudget: 128 } : { thinkingBudget: 0 };
    // A bare “gemini-flash”/“gemini-pro” is the newest of its line; the older
    // families are always versioned (gemini-1.5, gemini-2.0).
    if (!version && /(flash|pro)/.test(id)) return { thinkingLevel: pro ? 'low' : 'minimal' };
    // Anything else has no thinking knob: an unknown field would only earn a
    // 400 on every single request.
    return null;
  }

  /** The other way of asking for little thinking, tried when the first is
      rejected — so no pass of the ladder is left asking for full latency. */
  function altThinking(model) {
    const first = leastThinking(model);
    if (!first) return null;
    if (first.thinkingLevel) return { thinkingBudget: 0 };
    return { thinkingLevel: 'minimal' };
  }

  /* ---------- Raw call ---------- */
  async function callOnce(opts) {
    const { key, model, system, user, useSchema, thinking, signal } = opts;
    const url = BASE + '/' + normalizeModelPath(model) + ':generateContent';
    const generationConfig = {
      temperature: opts.temperature == null ? 0.85 : opts.temperature,
      topP: 0.95,
      maxOutputTokens: opts.maxTokens || 8192,
      responseMimeType: opts.plain ? 'text/plain' : 'application/json'
    };
    if (useSchema) generationConfig.responseSchema = RESPONSE_SCHEMA;
    // Thinking models both waste the output budget and make the learner wait,
    // so ask for as little as this model accepts (see leastThinking).
    if (thinking) generationConfig.thinkingConfig = thinking;

    let res;
    const guard = requestGuard(signal, GEMINI_TIMEOUT_MS);
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': normalizeKey(key) },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: generationConfig,
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
          ]
        }),
        signal: guard.signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        if (guard.timedOut()) throw keylessTimeout(
          'within ' + Math.round(GEMINI_TIMEOUT_MS / 1000) + ' seconds', true);
        throw e;
      }
      const err = new Error('Network error while contacting Gemini');
      err.friendly = 'Could not reach the Gemini API. Check your internet connection (or switch the Generator to Built-in).';
      throw err;
    } finally {
      guard.cleanup();
    }
    if (!res.ok) throw await httpError(res, 'Gemini (generate)');

    const data = await res.json();
    usageBump(1);

    const cand = (data.candidates || [])[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.map(function (p) { return p && p.text ? p.text : ''; }).join('');
    if (!text) {
      const reason = (data.promptFeedback && data.promptFeedback.blockReason) || (cand && cand.finishReason) || 'unknown';
      const err = new Error('Gemini returned no text (' + reason + ')');
      err.empty = true;
      err.friendly = 'Gemini blocked or emptied this request (' + reason + '). VocabLab will use built-in questions instead.';
      throw err;
    }
    return { text: text, usage: data.usageMetadata || null };
  }

  /**
   * Try the much-less-thinking version first and only give up on it as a last
   * resort: a pass that leaves thinking on can add minutes to one paragraph.
   * Order: schema + least thinking, schema + the other style, schema alone,
   * then no schema (for models that reject it) — again with least thinking.
   */
  async function callWithFallbacks(opts) {
    const least = leastThinking(opts.model);
    const alt = altThinking(opts.model);
    const first = least || alt;
    const second = least ? alt : null;
    const ladder = [first, second, null]
      .map(function (thinking) { return { useSchema: !opts.noSchema, thinking: thinking }; });
    // Models that reject the schema still get the least-thinking request.
    if (!opts.noSchema) ladder.push({ useSchema: false, thinking: first });
    // The same request must never be sent twice just because two thinking
    // styles were not available for this model.
    const seen = new Set();
    const passes = ladder.filter(function (pass) {
      const key = pass.useSchema + '|' + JSON.stringify(pass.thinking);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    let lastErr = null;
    let repaired = false;
    let call = opts;
    for (let pass = 0; pass < passes.length; pass++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await callOnce(Object.assign({}, call, passes[pass]));
        } catch (e) {
          if (e && e.name === 'AbortError') throw e;
          lastErr = e;
          if (!repaired && modelMissingError(e)) {
            repaired = true;
            const fixed = await repairGeminiModel(call);
            if (fixed) {
              call = Object.assign({}, call, { model: fixed });
              attempt--;
              continue;
            }
          }
          const retryable = e.status === 429 || e.status >= 500;
          if (retryable && attempt === 0) { await sleep(e.status === 429 ? 5200 : 2200, opts.signal); continue; }
          if (e.status === 400) break; // unsupported config → next pass
          if (retryable) break;
          throw e;
        }
      }
    }
    throw lastErr || new Error('Gemini call failed');
  }

  /* ---------- Prompt + normalization ---------- */

  /**
   * The JSON shape every reply must have. Gemini gets it as a real schema, but
   * the OpenAI-compatible providers are only told “json_object”, which says
   * nothing about the field names — spell the whole shape out in the prompt too,
   * or the model invents its own keys and every question is dropped.
   */
  const REPLY_SHAPE =
    '{"questions":[{"type":"mc","direction":"term2meaning","term":"<term from ITEMS>",' +
    '"prompt":"<question text>","hint":"","options":["<wrong>","<wrong>","<wrong>","<answer>"],' +
    '"answer":"<answer text>","explanation":"<max 12 words, English>"}]}';

  function buildPrompt(items, targetLang, meaningLang, opts) {
    opts = opts || {};
    const level = difficultyOf(opts.difficulty);
    const request = requirementOf(opts.requirement);
    const payload = items.map(function (i) {
      const entry = { term: i.term, meaning: i.meaning, type: i.type, direction: i.direction };
      if (i.pron) entry.pron = i.pron;
      if (i.example) entry.example = i.example;
      if (i.pos) entry.pos = i.pos;
      return entry;
    });
    const system =
      'You are VocabLab, an expert language tutor. You write short, accurate vocabulary quiz items ' +
      'for a learner whose native language is ' + meaningLang + ' and who is studying ' + targetLang + '. ' +
      'You always reply with the requested JSON object and never add commentary.';
    const user =
      'Create exactly ' + items.length + ' quiz item(s) — one for EACH entry of ITEMS, using that entry\'s "type" and "direction".\n\n' +
      'ITEMS (JSON):\n' + JSON.stringify(payload, null, 1) + '\n\n' +
      'Rules:\n' +
      '• Copy the answer text EXACTLY as written in ITEMS (keep Vietnamese diacritics).\n' +
      '• type "mc": 4 unique options with exactly one correct (= the answer). Take the 3 distractors from the ' +
      'terms/meanings of the other ITEMs — the learner\'s own words — and never invent vocabulary that is not in ' +
      'ITEMS. Distractors must be plausible same-kind words but clearly wrong: never a synonym or near-synonym ' +
      'of the answer, and never text from another ITEM that could also be read as the answer. ' +
      'prompt = question text: for term2meaning put the term, for meaning2term put the meaning.\n' +
      '• type "blank": write one natural ' + targetLang + ' sentence (' + level.blankWords + ' words) containing the term, then replace the term with ___. ' +
      'hint must start with "Meaning: " followed by the Vietnamese meaning. prompt = the sentence. answer = the term.\n' +
      '• type "translate": term2meaning → prompt = term, answer = meaning; meaning2term → prompt = meaning, answer = term. ' +
      'If the term is a phrase, keep it a phrase.\n' +
      '• "term" must repeat the ITEMS term exactly. "explanation": max 12 words, in English, useful for memorising.\n' +
      '• Difficulty: ' + level.label + ' (' + level.cefr + '). ' + level.quizTip + '\n' +
      '• Classroom-safe at CEFR ' + level.cefr + '.\n' +
      (request
        ? '\nEXTRA REQUEST FROM THE LEARNER (optional; follow it when it does not conflict with the rules above):\n"""' +
          request + '"""\n'
        : '') +
      '\nReply with ONE JSON object and nothing else — no prose, no code fences — in exactly this shape:\n' +
      REPLY_SHAPE + '\n' +
      '• "questions" is an array with exactly one object per ITEM, in the same order (' + items.length + ' total).\n' +
      '• "type" is exactly "mc", "blank" or "translate"; "direction" is "term2meaning", "meaning2term" or "blank".\n' +
      '• "options" is exactly 4 strings for "mc", and [] for the other types.\n' +
      '• "term" is copied from ITEMS character for character.';
    return { system: system, user: user };
  }

  /** Pull the question array out of whatever envelope the model used. */
  function questionsFrom(raw) {
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (!/^[[{]/.test(t)) return [];
      try { return questionsFrom(JSON.parse(t)); } catch (e) { return []; }
    }
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    // A single question instead of a list.
    if (!raw.questions && !raw.items && (raw.term || raw.type || raw.question)) return [raw];
    const names = ['questions', 'items', 'data', 'results', 'quiz'];
    for (const name of names) {
      const v = raw[name];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        const inner = questionsFrom(v);
        if (inner.length) return inner;
        continue;
      }
      if (v && typeof v === 'object') {
        if (Array.isArray(v.questions)) return v.questions;
        if (Array.isArray(v.items)) return v.items;
        // {"1": {...}, "2": {...}}
        const vals = Object.keys(v).map(function (k) { return v[k]; });
        if (vals.length && vals.every(function (x) { return x && typeof x === 'object'; })) return vals;
      }
    }
    return [];
  }

  /** The first of several possible field names the model may have used. */
  function pickField(obj, names) {
    for (const name of names) {
      const v = obj[name];
      if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) return v;
    }
    return undefined;
  }

  function normalizeQType(value) {
    const s = String(value == null ? '' : value).toLowerCase().replace(/[\s-]+/g, '_');
    if (!s) return '';
    if (s === 'mc' || s === 'mcq' || s === 'multiple_choice' || s === 'multiplechoice' || s === 'choice') return 'mc';
    if (s === 'blank' || s === 'fill_in_the_blank' || s === 'fill_blank' || s === 'cloze' || s === 'gap' || s === 'gaps') return 'blank';
    if (s === 'translate' || s === 'translation' || s === 'typing' || s === 'type_answer') return 'translate';
    return '';
  }

  /** A forgiving key for matching a model's “term” to an ITEM. */
  function looseKey(value) {
    return Util.normalizeForCompare(Util.stripDiacritics(value))
      .replace(/^(?:le|la|les|l|un|une|des|du|de|the|a|an)\s+/, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeQuestions(raw, items) {
    const list = questionsFrom(raw);

    const entries = items.map(function (item, idx) { return { item: item, idx: idx, used: false }; });
    const byTerm = Object.create(null);
    const byLoose = Object.create(null);
    entries.forEach(function (entry) {
      const key = Util.normalize(entry.item.term);
      (byTerm[key] = byTerm[key] || []).push(entry);
      const loose = looseKey(entry.item.term);
      if (loose) (byLoose[loose] = byLoose[loose] || []).push(entry);
    });

    /** The ITEM a model's text refers to — exact first, then an unambiguous loose match. */
    function findEntry(value) {
      if (value == null) return null;
      const bucket = byTerm[Util.normalize(value)];
      if (bucket) {
        const free = bucket.find(function (e) { return !e.used; });
        if (free) return free;
      }
      const loose = byLoose[looseKey(value)];
      // “le chat” / “chat”, “gare.” / “gare” — only when exactly one ITEM fits.
      if (loose && loose.length === 1 && !loose[0].used) return loose[0];
      return null;
    }

    const out = [];
    for (const q of list) {
      if (!q || typeof q !== 'object') continue;

      // Models name these fields differently; accept the usual synonyms rather
      // than discard a perfectly good question.
      const termText = pickField(q, ['term', 'word', 'item', 'vocabulary', 'source']);
      const promptText = pickField(q, ['prompt', 'question', 'text', 'sentence', 'stem', 'front']);
      const answerText = pickField(q, ['answer', 'correct', 'correct_answer', 'correctAnswer', 'solution', 'back', 'target']);
      const rawOptions = pickField(q, ['options', 'choices', 'distractors', 'candidates']);

      // A reply without "term" can still be placed by its prompt or its answer.
      let entry = findEntry(termText);
      if (!entry) entry = findEntry(promptText);
      if (!entry) entry = findEntry(answerText);
      if (!entry) continue;

      const item = entry.item;
      const type = normalizeQType(q.type) || normalizeQType(q.kind) || normalizeQType(item.type) || 'translate';
      let answer = String(answerText == null ? '' : answerText).trim();
      let prompt = String(promptText == null ? '' : promptText).trim();
      if (!answer || !prompt) continue;
      entry.used = true;

      // Sanity-check direction using the expected answer.
      let direction = type === 'blank' ? 'blank' : (item.direction || 'term2meaning');
      if (type !== 'blank') {
        const wantTerm = Util.normalizeForCompare(Util.stripDiacritics(item.term));
        const wantMeaning = Util.normalizeForCompare(Util.stripDiacritics(item.meaning));
        const got = Util.normalizeForCompare(Util.stripDiacritics(answer));
        if (direction === 'term2meaning' && got !== wantMeaning && got === wantTerm) direction = 'meaning2term';
        else if (direction === 'meaning2term' && got !== wantTerm && got === wantMeaning) direction = 'term2meaning';
      }

      let options = [];
      if (type === 'mc') {
        const arr = Array.isArray(rawOptions) ? rawOptions
          : (typeof rawOptions === 'string' ? rawOptions.split(/\s*[|;]\s*/) : []);
        options = Util.uniq(arr
          .map(function (o) { return String(o == null ? '' : o).trim(); })
          .filter(Boolean));
        const norm = function (s) { return Util.normalizeForCompare(Util.stripDiacritics(s)); };
        if (!options.some(function (o) { return norm(o) === norm(answer); })) {
          options = options.slice(0, 3);
          options.push(answer);
        }
        options = Util.uniq(options);
        // A near-synonym of the answer reads like a second correct option, so
        // drop it (the question falls back to the built-in generator when too
        // few options remain and the model ignored the prompt rule).
        options = options.filter(function (o) {
          return norm(o) === norm(answer) || !Util.tooSimilarMeaning(o, answer);
        });
        if (options.length < 3) { entry.used = false; continue; }
        options = Util.shuffle(options);
      }

      // Fill-in-the-blank needs a blank marker in the sentence.
      if (type === 'blank') {
        if (!/_{2,}/.test(prompt)) {
          const rx = Util.termRegex(item.term, 'i');
          if (rx.test(prompt)) prompt = prompt.replace(rx, '___');
          else { entry.used = false; continue; }
        }
      }

      out.push({
        type: type,
        direction: direction,
        term: item.term,
        prompt: prompt,
        hint: String(pickField(q, ['hint', 'meaning', 'translation']) || '').trim(),
        options: options,
        answer: answer,
        explanation: String(pickField(q, ['explanation', 'explain', 'note', 'notes', 'why']) || '').trim()
      });
    }
    return out;
  }

  /**
   * Generate questions for a batch of items with Google Gemini.
   * item: { term, meaning, pron?, example?, pos?, type: 'mc'|'blank'|'translate', direction }
   */
  async function generateGeminiQuestions(opts) {
    const { key, model, items, targetLang, meaningLang, signal } = opts;
    if (!items || !items.length) return [];
    const built = buildPrompt(items, targetLang || 'French', meaningLang || 'Vietnamese',
      { difficulty: opts.difficulty, requirement: opts.requirement });
    return askForQuestions(function (extra) {
      return callWithFallbacks({
        key: key, model: model, system: built.system, user: extra.user, signal: signal
      });
    }, built, items, 'Gemini (' + model + ')');
  }

  /* ---------- Provider dispatchers ---------- */

  /**
   * cfg: { provider: 'gemini'|'openai', key, baseUrl?, model, items, targetLang, meaningLang, signal }
   */
  async function generateQuestions(cfg) {
    if (cfg.provider === 'openai') return generateOaiQuestions(cfg);
    return generateGeminiQuestions(cfg);
  }

  /**
   * cfg: { provider: 'gemini'|'openai', key, baseUrl?, signal }
   * → [{ id, label, description? }] sorted best-first.
   */
  async function listModels(cfg) {
    if (cfg.provider === 'openai') return oaiListModels(cfg);
    return listGeminiModels(cfg.key, cfg.signal);
  }

  global.Ai = {
    providers: PROVIDERS,
    providerById: providerById,
    providerForBase: providerForBase,
    normalizeKey: normalizeKey,
    keyFormat: keyFormat,
    keyShapeWarning: keyShapeWarning,
    setModelRepairHandler: setModelRepairHandler,
    // Free-slot pacing, exposed so tests can shrink the 30-second window.
    freeSlot: { configure: configureFreeSlot, reset: resetFreeSlot, waitMs: freeWaitMs },
    listModels: listModels,
    checkFree: checkFree,
    pickDefaultModel: pickDefaultModel,
    prettifyModel: prettifyModel,
    generateQuestions: generateQuestions,
    buildPrompt: buildPrompt,
    generateParagraph: generateParagraph,
    correctParagraph: correctParagraph,
    suggestUpgrades: suggestUpgrades,
    buildUpgradePrompt: buildUpgradePrompt,
    normalizeUpgrades: normalizeUpgrades,
    askTutor: askTutor,
    assessSpeech: assessSpeech,
    buildSpeechPrompt: buildSpeechPrompt,
    normalizeSpeechResult: normalizeSpeechResult,
    buildParagraphPrompt: buildParagraphPrompt,
    buildCorrectionPrompt: buildCorrectionPrompt,
    normalizeParagraph: normalizeParagraph,
    normalizeCorrection: normalizeCorrection,
    parseJsonLoose: parseJsonLoose,
    normalizeQuestions: normalizeQuestions,
    usageGet: usageGet,
    usageBump: usageBump,
    normalizeModelPath: normalizeModelPath,
    normalizeBaseUrl: normalizeBaseUrl,
    isLocalBaseUrl: isLocalBaseUrl,
    oai: {
      buildBody: oaiBuildBody,
      extractText: oaiExtractText,
      headers: oaiHeaders,
      sortModels: sortOaiModels
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
