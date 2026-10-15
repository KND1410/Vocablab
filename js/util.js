/* =========================================================
   VocabLab — util.js
   Small helpers shared by every module. No dependencies.
   ========================================================= */
(function (global) {
  'use strict';

  const PREFIX = 'vocablab.';

  /* ---------- DOM ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Text ---------- */
  function normalize(value) {
    return String(value == null ? '' : value)
      .normalize('NFC')
      .toLowerCase()
      .replace(/[’‘`´]/g, "'")
      .replace(/[“”„]/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Normalization used for grading: also removes punctuation and collapses spaces. */
  function normalizeForCompare(value) {
    return normalize(value)
      .replace(/[.!?,;:«»"()\[\]{}…\-–—/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripDiacritics(value) {
    return String(value == null ? '' : value)
      .replace(/[đĐ]/g, function (m) { return m === 'đ' ? 'd' : 'D'; })
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .normalize('NFC');
  }

  function levenshtein(a, b) {
    a = String(a || ''); b = String(b || '');
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    let curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      }
      const t = prev; prev = curr; curr = t;
    }
    return prev[b.length];
  }

  function similarity(a, b) {
    const max = Math.max(String(a).length, String(b).length);
    if (!max) return 1;
    return 1 - levenshtein(a, b) / max;
  }

  function slugify(value) {
    return stripDiacritics(normalize(value)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Regex that matches a (possibly multi-word) term allowing flexible whitespace. */
  function termRegex(term, flags) {
    const parts = String(term == null ? '' : term).trim().split(/\s+/).map(escapeRegExp);
    const f = (((flags || '') + 'u').replace(/u+/g, 'u'));
    return new RegExp('(?<![\\p{L}\\p{N}])' + parts.join('[\\s\\u00a0]+') + '(?![\\p{L}\\p{N}])', f);
  }

  function titleCase(value) {
    return String(value || '').replace(/\w\S*/g, function (t) { return t.charAt(0).toUpperCase() + t.slice(1); });
  }

  /* ---------- Arrays ---------- */
  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  /** Pick up to n items, more likely the higher the weight (weight > 0). */
  function weightedSample(items, weights, n) {
    const pool = items.map(function (item, i) { return { item: item, w: Math.max(0.0001, Number(weights[i]) || 0) }; });
    const picked = [];
    while (picked.length < n && pool.length) {
      let total = 0;
      for (const p of pool) total += p.w;
      let r = Math.random() * total;
      let idx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) {
        r -= pool[i].w;
        if (r <= 0) { idx = i; break; }
      }
      picked.push(pool[idx].item);
      pool.splice(idx, 1);
    }
    return picked;
  }

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  function uniq(arr) { return Array.from(new Set(arr)); }

  /* ---------- Misc ---------- */
  function hash(str) {
    let h = 5381;
    str = String(str);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  function todayKey(d) {
    const t = d || new Date();
    const p = function (x) { return String(x).padStart(2, '0'); };
    return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
  }

  function formatDuration(ms) {
    const total = Math.round(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + 'm ' + String(s).padStart(2, '0') + 's';
  }

  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /* ---------- localStorage ---------- */
  function lsGet(key, fallback) {
    try {
      const raw = global.localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { global.localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function lsRemove(key) {
    try { global.localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  }
  function lsKeys() {
    try {
      return Object.keys(global.localStorage).filter(function (k) { return k.indexOf(PREFIX) === 0; });
    } catch (e) { return []; }
  }
  function lsBytes() {
    try {
      return lsKeys().reduce(function (sum, k) {
        return sum + (k.length + (global.localStorage.getItem(k) || '').length) * 2;
      }, 0);
    } catch (e) { return 0; }
  }

  /* ---------- UI helpers (browser only) ---------- */
  function toast(message, kind) {
    if (typeof document === 'undefined') return;
    const host = $('#toasts');
    if (!host) return;
    const div = document.createElement('div');
    div.className = 'toast ' + (kind || '');
    div.textContent = message;
    host.appendChild(div);
    setTimeout(function () {
      div.style.transition = 'opacity .3s ease';
      div.style.opacity = '0';
      setTimeout(function () { div.remove(); }, 320);
    }, kind === 'bad' ? 9000 : 4200);
  }

  let ttsVoicesReady = false;
  function speak(text, lang, rate) {
    if (typeof global.speechSynthesis === 'undefined' || !text) return false;
    try {
      global.speechSynthesis.cancel();
      const utter = new global.SpeechSynthesisUtterance(String(text));
      utter.lang = lang || 'en-US';
      utter.rate = rate || 0.92;
      const voices = global.speechSynthesis.getVoices() || [];
      const want = utter.lang.toLowerCase();
      const exact = voices.find(function (v) { return (v.lang || '').toLowerCase() === want; });
      const loose = exact || voices.find(function (v) { return (v.lang || '').toLowerCase().slice(0, 2) === want.slice(0, 2); });
      if (loose) utter.voice = loose;
      global.speechSynthesis.speak(utter);
      return true;
    } catch (e) { return false; }
  }

  function initVoices() {
    if (ttsVoicesReady || typeof global.speechSynthesis === 'undefined') return;
    ttsVoicesReady = true;
    global.speechSynthesis.getVoices();
    if (typeof global.speechSynthesis.onvoiceschanged !== 'undefined') {
      global.speechSynthesis.onvoiceschanged = function () { global.speechSynthesis.getVoices(); };
    }
  }

  global.Util = {
    $: $, $$: $$, esc: esc,
    normalize: normalize, normalizeForCompare: normalizeForCompare,
    stripDiacritics: stripDiacritics, levenshtein: levenshtein, similarity: similarity,
    slugify: slugify, escapeRegExp: escapeRegExp, termRegex: termRegex, titleCase: titleCase,
    shuffle: shuffle, weightedSample: weightedSample, chunk: chunk, uniq: uniq,
    hash: hash, uid: uid, clamp: clamp, todayKey: todayKey,
    formatDuration: formatDuration, debounce: debounce,
    lsGet: lsGet, lsSet: lsSet, lsRemove: lsRemove, lsKeys: lsKeys, lsBytes: lsBytes,
    toast: toast, speak: speak, initVoices: initVoices
  };
})(typeof window !== 'undefined' ? window : globalThis);
