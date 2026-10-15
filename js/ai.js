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
    const apiKey = String(key || '').trim();
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
      err.friendly = 'Free-tier limit reached (429). Wait a minute and retry, or let VocabLab fall back to built-in questions.';
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
    const apiKey = String(key || '').trim();
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

  function networkError(baseUrl) {
    let host = baseUrl;
    try { host = new URL(baseUrl).host; } catch (e) { /* keep raw */ }
    const err = new Error('Network error while contacting ' + host);
    err.friendly = 'Could not reach ' + host + '.\n• Check the Base URL and your internet connection.' +
      '\n• Gemini, Groq, OpenRouter and Mistral allow browser calls; for local Ollama run it with OLLAMA_ORIGINS=*' +
      '\n• If you opened this page as a file:// URL, serve the folder instead (python3 -m http.server).';
    return err;
  }

  async function oaiHttpError(res, context) {
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
      err.friendly = 'The provider rejected the key (401/403). Check the key, and that it can use the selected model.';
    } else if (res.status === 402) {
      err.friendly = 'The provider says there are no credits for this model (402). On OpenRouter, pick a “:free” model such as openrouter/free.';
    } else if (res.status === 404) {
      err.friendly = 'Endpoint or model not found (404). Check the Base URL and the model ID in Settings → AI.';
    } else if (res.status === 429) {
      err.friendly = 'Free-tier rate limit reached (429). Groq and OpenRouter reset within a minute; VocabLab falls back to built-in questions meanwhile.';
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
    if (!String(cfg.key || '').trim() && !isLocalBaseUrl(base)) {
      const err = new Error('No API key');
      err.friendly = 'Add the provider API key first (a local Ollama server needs none).';
      throw err;
    }
    let res;
    try {
      res = await fetch(base + '/models', { headers: oaiHeaders(base, cfg.key), signal: cfg.signal });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      throw networkError(base);
    }
    if (!res.ok) throw await oaiHttpError(res, 'AI provider (list models)');
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
      throw networkError(base);
    }
    if (!res.ok) throw await oaiHttpError(res, 'AI provider (chat)');
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
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': String(key || '').trim() },
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
      '• type "mc": 4 unique options with exactly one correct (= the answer). Distractors must be plausible ' +
      'same-kind words but clearly wrong. prompt = question text: for term2meaning put the term, for meaning2term put the meaning.\n' +
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
