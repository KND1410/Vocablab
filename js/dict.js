/* =========================================================
   VocabLab — dictionary client
   Verifies AI suggestions against a free dictionary, with a
   Wiktionary fallback and a short local cache. The dictionary
   never decides what to suggest; it only checks that a word
   exists and gives the learner a source link.
   ========================================================= */
(function () {
  'use strict';

  const CACHE_KEY = 'vocablab.dictCache';
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const CACHE_MAX = 400;
  const TIMEOUT = 2600;
  let memory = null;

  function langCode(lang) {
    const s = String(lang || '').toLowerCase();
    if (s.indexOf('fr') === 0) return 'fr';
    if (s.indexOf('en') === 0) return 'en';
    return '';
  }

  function clean(word) {
    return String(word || '').replace(/^[«“"'(\[]+|[»”"')\].,;:!?]+$/g, '').trim();
  }

  function cacheRead() {
    if (memory) return memory;
    memory = {};
    try {
      const raw = globalThis.localStorage.getItem(CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object') memory = parsed;
    } catch (e) { /* private mode / disabled storage */ }
    return memory;
  }

  function cacheWrite(cache) {
    memory = cache;
    try {
      const keys = Object.keys(cache);
      if (keys.length > CACHE_MAX) {
        keys.sort(function (a, b) { return (cache[a].at || 0) - (cache[b].at || 0); });
        keys.slice(0, keys.length - CACHE_MAX).forEach(function (key) { delete cache[key]; });
      }
      globalThis.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* ignore quota / private mode */ }
  }

  function cached(lang, word) {
    const key = lang + ':' + word.toLowerCase();
    const hit = cacheRead()[key];
    if (!hit) return null;
    if (Date.now() - (hit.at || 0) > CACHE_TTL) {
      delete cacheRead()[key];
      return null;
    }
    return hit.value;
  }

  function remember(lang, word, value) {
    const cache = cacheRead();
    cache[lang + ':' + word.toLowerCase()] = { at: Date.now(), value: value };
    cacheWrite(cache);
  }

  function request(url, fetchImpl) {
    const impl = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!impl) return Promise.reject(new Error('Fetch is not available.'));
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT) : null;
    return Promise.resolve(impl(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    })).then(function (res) {
      if (res && res.ok) return res.json();
      const err = new Error('Dictionary returned HTTP ' + (res && res.status));
      err.status = res && res.status;
      throw err;
    }).catch(function (err) {
      if (err && err.name === 'AbortError') {
        const timeout = new Error('Dictionary timed out.');
        timeout.timeout = true;
        throw timeout;
      }
      throw err;
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  function firstSense(entry) {
    if (!entry) return '';
    const senses = entry.senses || [];
    for (const sense of senses) {
      if (sense && sense.definition) return String(sense.definition).replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  function normalizeFree(word, lang, data) {
    const entries = data && Array.isArray(data.entries) ? data.entries : [];
    const usable = entries.filter(function (e) { return e && e.partOfSpeech; });
    if (!usable.length) return null;
    return {
      word: (data && data.word) || word,
      lang: lang,
      source: 'freedictionaryapi',
      sourceUrl: 'https://freedictionaryapi.com/',
      license: 'Wiktionary, CC BY-SA 4.0',
      partOfSpeech: usable[0].partOfSpeech || '',
      definition: firstSense(usable[0]),
      entries: usable.slice(0, 3).map(function (e) {
        return {
          partOfSpeech: e.partOfSpeech || '',
          definition: firstSense(e)
        };
      })
    };
  }

  async function lookupFree(word, lang, fetchImpl) {
    const url = 'https://freedictionaryapi.com/api/v1/entries/' + encodeURIComponent(lang) +
      '/' + encodeURIComponent(word);
    const data = await request(url, fetchImpl);
    return normalizeFree(word, lang, data);
  }

  async function lookupWiktionary(word, lang, fetchImpl) {
    const host = lang === 'fr' ? 'fr.wiktionary.org' : 'en.wiktionary.org';
    const url = 'https://' + host + '/w/api.php?action=query&format=json&origin=*' +
      '&prop=extracts&explaintext=1&redirects=1&titles=' + encodeURIComponent(word);
    const data = await request(url, fetchImpl);
    const pages = data && data.query && data.query.pages ? data.query.pages : {};
    // MediaWiki marks a missing title with `"missing": ""`, so test for the
    // property itself — `!p.missing` would treat every missing page as found.
    const page = Object.keys(pages).map(function (k) { return pages[k]; })
      .filter(function (p) { return p && p.missing === undefined; })[0];
    if (!page) return null;
    const extract = String(page.extract || '').replace(/\s+/g, ' ').trim();
    return {
      word: page.title || word,
      lang: lang,
      source: 'wiktionary',
      sourceUrl: 'https://' + host + '/wiki/' + encodeURIComponent(page.title || word),
      license: 'Wiktionary, CC BY-SA 4.0',
      partOfSpeech: '',
      definition: extract.split(/\n|\./).filter(function (s) { return s.trim().length > 12; })[0] || '',
      entries: []
    };
  }

  /**
   * Look a word up in the target language.
   * Returns { status: 'verified'|'not-found'|'unavailable'|'unsupported',
   *           source, sourceUrl, partOfSpeech, definition, ... }.
   */
  async function lookup(word, lang, opts) {
    const options = opts || {};
    const code = langCode(lang || options.targetLang);
    const term = clean(word);
    if (!code || !term) {
      return { status: 'unsupported', word: term, lang: code, source: '' };
    }
    // A phrase or full sentence is not a dictionary headword; let the AI label it.
    if (!/^[\p{L}\p{M}'’ -]+$/u.test(term) || /\s/.test(term)) {
      return { status: 'unsupported', word: term, lang: code, source: '' };
    }
    const hit = cached(code, term);
    if (hit && options.cache !== false) return hit;

    let firstError = null;
    try {
      const free = await lookupFree(term, code, options.fetch);
      if (free) {
        const value = Object.assign({ status: 'verified' }, free);
        remember(code, term, value);
        return value;
      }
    } catch (e) { firstError = e; }

    try {
      const wiki = await lookupWiktionary(term, code, options.fetch);
      if (wiki) {
        const value = Object.assign({ status: 'verified' }, wiki);
        remember(code, term, value);
        return value;
      }
    } catch (e) {
      if (!firstError) firstError = e;
    }

    const value = {
      status: firstError ? 'unavailable' : 'not-found',
      word: term,
      lang: code,
      source: '',
      sourceUrl: '',
      error: firstError ? (firstError.message || 'Dictionary unavailable.') : ''
    };
    // Do not cache a transient outage for a week. A not-found result is stable.
    if (!firstError) remember(code, term, value);
    return value;
  }

  /** Verify a list of upgrade objects in parallel; adds `.dict` to each. */
  async function verifyUpgrades(upgrades, lang, opts) {
    const list = Array.isArray(upgrades) ? upgrades : [];
    return Promise.all(list.map(async function (up) {
      if (!up || !up.to) return up;
      if (up.scope === 'sentence') {
        return Object.assign({}, up, {
          dict: { status: 'ai', source: '', sourceUrl: '' }
        });
      }
      const dict = await lookup(up.to, lang, opts);
      return Object.assign({}, up, { dict: dict });
    }));
  }

  globalThis.Dict = {
    lookup: lookup,
    verifyUpgrades: verifyUpgrades,
    langCode: langCode,
    clearCache: function () {
      memory = {};
      try { globalThis.localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
    }
  };
})();
