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

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

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
    try {
      res = await fetch(BASE + '/models?pageSize=200', { headers: { 'x-goog-api-key': apiKey }, signal: signal });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      const err = new Error('Network error while contacting Gemini');
      err.friendly = 'Could not reach the Gemini API. Check your internet connection.';
      throw err;
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
      temperature: 0.8,
      max_tokens: o.maxTokens || 4096
    };
    if (o.jsonMode) body.response_format = { type: 'json_object' };
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
      detail = (body && body.error && body.error.message) || '';
    } catch (e) { /* ignore */ }
    const err = new Error(context + ' failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
    err.status = res.status;
    if (res.status === 400) {
      err.friendly = 'The provider rejected the request (400)' + (detail ? ' — ' + detail : '') + '.';
    } else if (res.status === 401 || res.status === 403) {
      const p = providerForBase(opts.base || '');
      const who = (p && p.short) || 'The provider';
      err.friendly = who + ' rejected this key (401/403)' + (detail ? ' — ' + detail : '') + '.' +
        (p && p.keyUrl ? '\n• Copy a new key from ' + p.keyUrl + ' and paste it into the API key field on its own.' : '') +
        (p && p.keyPrefix ? '\n• ' + p.short + ' keys look like “' + p.keyPrefix + '…” — if yours does not, it belongs to another provider.' : '') +
        '\n• A key only works for the provider that issued it, and only for models that key may use.';
    } else if (res.status === 402) {
      err.friendly = 'The provider says there are no credits for this model (402). On OpenRouter, pick a “:free” model such as openrouter/free.';
    } else if (res.status === 404) {
      err.friendly = 'Endpoint or model not found (404)' + (detail ? ' — ' + detail : '') +
        (isLocalBaseUrl(opts.base || '')
          ? '\n• Local Ollama: download the model first — ollama pull ' + (opts.model || 'llama3.2')
          : '\n• Check the Base URL and the model ID in Settings → AI.');
    } else if (res.status === 429) {
      err.friendly = 'Rate limit reached (429) by this provider. Wait a minute, or switch provider in Settings → AI — ' +
        'Groq, Cerebras and OpenRouter have free tiers. Built-in questions cover the rest meanwhile.';
    } else if (res.status >= 500) {
      err.friendly = 'The provider had a server error (' + res.status + '). Try again shortly.';
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
    if (!normalizeKey(cfg.key) && !isLocalBaseUrl(base)) {
      const err = new Error('No API key');
      err.friendly = 'Add the provider API key first (a local Ollama server needs none).';
      throw err;
    }
    let res;
    try {
      res = await fetch(base + '/models', { headers: oaiHeaders(base, cfg.key), signal: cfg.signal });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw await networkError(base, cfg.model);
    }
    if (!res.ok) throw await oaiHttpError(res, 'AI provider (list models)', { base: base, model: cfg.model });
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
    const models = list
      .map(function (m) {
        const id = String((m && (m.id || m.name)) || '');
        return { id: id, label: id };
      })
      .filter(function (m) { return m.id && !OAI_NON_CHAT.test(m.id); });
    return sortOaiModels(models);
  }

  async function oaiCallOnce(cfg) {
    const base = normalizeBaseUrl(cfg.baseUrl);
    let res;
    try {
      res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: oaiHeaders(base, cfg.key),
        body: JSON.stringify(oaiBuildBody(cfg)),
        signal: cfg.signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw await networkError(base, cfg.model);
    }
    if (!res.ok) throw await oaiHttpError(res, 'AI provider (chat)', { base: base, model: cfg.model });
    const data = await res.json();
    usageBump(1);
    return oaiExtractText(data);
  }

  /** Try JSON mode first, then plain, retrying once on 429/5xx. */
  async function oaiCallWithFallbacks(cfg) {
    const passes = [{ jsonMode: true }, { jsonMode: false }];
    let lastErr = null;
    for (let pass = 0; pass < passes.length; pass++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await oaiCallOnce(Object.assign({}, cfg, passes[pass]));
        } catch (e) {
          if (e && e.name === 'AbortError') throw e;
          lastErr = e;
          const retryable = e.status === 429 || e.status >= 500;
          if (retryable && attempt === 0) { await sleep(e.status === 429 ? 5200 : 2200); continue; }
          if (e.status === 400) break; // e.g. json mode unsupported → next pass
          if (retryable) break;
          throw e;
        }
      }
    }
    throw lastErr || new Error('AI provider call failed');
  }

  async function generateOaiQuestions(cfg) {
    const { baseUrl, key, model, items, targetLang, meaningLang, signal } = cfg;
    if (!items || !items.length) return [];
    const built = buildPrompt(items, targetLang || 'French', meaningLang || 'Vietnamese');
    const res = await oaiCallWithFallbacks({
      baseUrl: baseUrl, key: key, model: model,
      system: built.system, user: built.user, signal: signal
    });
    const raw = parseJsonLoose(res.text);
    const questions = normalizeQuestions(raw, items);
    if (!questions.length) {
      const err = new Error('Model produced no usable questions');
      err.friendly = 'The AI provider returned questions in an unexpected shape — falling back to built-in questions for these words.';
      throw err;
    }
    return questions;
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

  /* ---------- Raw call ---------- */
  async function callOnce(opts) {
    const { key, model, system, user, useSchema, useThinkingOff, signal } = opts;
    const url = BASE + '/' + normalizeModelPath(model) + ':generateContent';
    const generationConfig = {
      temperature: 0.85,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    };
    if (useSchema) generationConfig.responseSchema = RESPONSE_SCHEMA;
    // Flash/Pro 2.5+ models "think" before answering, which can consume the whole
    // output budget and truncate the JSON. Ask for no thinking where supported;
    // if a model rejects this, callWithFallbacks retries without it.
    if (useThinkingOff) generationConfig.thinkingConfig = { thinkingBudget: 0 };

    let res;
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
        signal: signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      const err = new Error('Network error while contacting Gemini');
      err.friendly = 'Could not reach the Gemini API. Check your internet connection (or switch the Generator to Built-in).';
      throw err;
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
      err.friendly = 'Gemini blocked or emptied this request (' + reason + '). VocabLab will use built-in questions instead.';
      throw err;
    }
    return { text: text, usage: data.usageMetadata || null };
  }

  /** Try schema+no-thinking first, then progressively simpler requests. One retry on 429/5xx. */
  async function callWithFallbacks(opts) {
    const passes = [
      { useSchema: true, useThinkingOff: true },
      { useSchema: true, useThinkingOff: false },
      { useSchema: false, useThinkingOff: false }
    ];
    let lastErr = null;
    for (let pass = 0; pass < passes.length; pass++) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await callOnce(Object.assign({}, opts, passes[pass]));
        } catch (e) {
          if (e && e.name === 'AbortError') throw e;
          lastErr = e;
          const retryable = e.status === 429 || e.status >= 500;
          if (retryable && attempt === 0) { await sleep(e.status === 429 ? 5200 : 2200); continue; }
          if (e.status === 400) break; // unsupported config → next pass
          if (retryable) break;
          throw e;
        }
      }
    }
    throw lastErr || new Error('Gemini call failed');
  }

  /* ---------- Prompt + normalization ---------- */
  function buildPrompt(items, targetLang, meaningLang) {
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
      'You obey the JSON schema exactly and never add commentary.';
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
      '• type "blank": write one natural ' + targetLang + ' sentence (6–14 words) containing the term, then replace the term with ___. ' +
      'hint must start with "Meaning: " followed by the Vietnamese meaning. prompt = the sentence. answer = the term.\n' +
      '• type "translate": term2meaning → prompt = term, answer = meaning; meaning2term → prompt = meaning, answer = term. ' +
      'If the term is a phrase, keep it a phrase.\n' +
      '• "term" must repeat the ITEMS term exactly. "explanation": max 12 words, in English, useful for memorising.\n' +
      '• Classroom-safe, CEFR A2–B2 sentences. Respond with JSON only.';
    return { system: system, user: user };
  }

  function normalizeQuestions(raw, items) {
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.questions)) list = raw.questions;

    const byTerm = Object.create(null);
    items.forEach(function (item, idx) {
      const k = Util.normalize(item.term);
      (byTerm[k] = byTerm[k] || []).push({ item: item, idx: idx, used: false });
    });

    const out = [];
    for (const q of list) {
      if (!q || typeof q !== 'object') continue;
      const type = String(q.type || '').toLowerCase();
      if (type !== 'mc' && type !== 'blank' && type !== 'translate') continue;

      const bucket = byTerm[Util.normalize(q.term)];
      if (!bucket) continue;
      const match = bucket.find(function (b) { return !b.used; });
      if (!match) continue;
      match.used = true;

      const item = match.item;
      let answer = String(q.answer == null ? '' : q.answer).trim();
      let prompt = String(q.prompt == null ? '' : q.prompt).trim();
      if (!answer || !prompt) { match.used = false; continue; }

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
        options = Util.uniq((Array.isArray(q.options) ? q.options : [])
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
        if (options.length < 3) { match.used = false; continue; }
        options = Util.shuffle(options);
      }

      // Fill-in-the-blank needs a blank marker in the sentence.
      if (type === 'blank') {
        if (!/_{2,}/.test(prompt)) {
          const rx = Util.termRegex(item.term, 'i');
          if (rx.test(prompt)) prompt = prompt.replace(rx, '___');
          else { match.used = false; continue; }
        }
      }

      out.push({
        type: type,
        direction: direction,
        term: item.term,
        prompt: prompt,
        hint: String(q.hint == null ? '' : q.hint).trim(),
        options: options,
        answer: answer,
        explanation: String(q.explanation == null ? '' : q.explanation).trim()
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
    const built = buildPrompt(items, targetLang || 'French', meaningLang || 'Vietnamese');
    const res = await callWithFallbacks({
      key: key, model: model, system: built.system, user: built.user, signal: signal
    });
    const raw = parseJsonLoose(res.text);
    const questions = normalizeQuestions(raw, items);
    if (!questions.length) {
      const err = new Error('Model produced no usable questions');
      err.friendly = 'Gemini returned questions in an unexpected shape — falling back to built-in questions for these words.';
      throw err;
    }
    return questions;
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
    listModels: listModels,
    pickDefaultModel: pickDefaultModel,
    prettifyModel: prettifyModel,
    generateQuestions: generateQuestions,
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
