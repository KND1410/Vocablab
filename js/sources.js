/* =========================================================
   VocabLab — sources.js
   Loads vocabulary from:
     · Google Sheets API v4 (sheet id + free API key)  → all tabs
     · Apps Script web app URL (no Google Cloud needed) → all tabs
     · Published CSV / gviz links                       → one topic per link
     · Built-in demo deck
   And parses 2D tables into a deck:
     { source, loadedAt, topics: [ { id, name, words: [ {term, meaning, pron, example, pos, note} ] } ] }
   ========================================================= */
(function (global) {
  'use strict';

  const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

  /* ---------- Column header keywords (diacritic-insensitive matching) ---------- */
  const KEYWORDS = {
    term: ['vocab', 'vocabulary', 'word', 'words', 'term', 'terms', 'phrase', 'phrases', 'expression',
      'entry', 'target', 'front', 'target language', 'foreign word',
      'english', 'tieng anh', 'french', 'francais', 'german', 'deutsch', 'allemand', 'spanish', 'espagnol',
      'italian', 'italien', 'japanese', 'japonais', 'chinese', 'chinois', 'korean', 'coreen',
      'portuguese', 'portugais', 'russian', 'russe', 'thai', 'hanzi', 'kanji',
      'tu vung', 'muc tu', 'tu'],
    meaning: ['vietnamese', 'viet nam', 'vietnamien', 'meaning', 'meanings', 'translation', 'definition', 'back',
      'nghia', 'tieng viet', 'dinh nghia', 'y nghia', 'nghia tieng viet'],
    pron: ['pronunciation', 'pronounciation', 'pron', 'phonetic', 'phonetics', 'ipa', 'pinyin',
      'reading', 'romaji', 'furigana', 'phat am', 'phien am', 'cach doc'],
    example: ['example', 'examples', 'example sentence', 'sentence', 'sentences', 'usage',
      'vi du', 'cau vi du', 'vi du minh hoa'],
    pos: ['pos', 'part of speech', 'word type', 'tu loai', 'loai tu'],
    note: ['note', 'notes', 'remark', 'remarks', 'comment', 'tag', 'tags', 'level', 'unit', 'lesson',
      'chapter', 'category', 'topic', 'chu de', 'ghi chu', 'bai', 'chuong', 'section']
  };

  function baseHeader(cell) {
    return Util.stripDiacritics(Util.normalize(cell)).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Emoji in a word/meaning cell means a section label row (“🟢 Nhảy tới B1 (42 từ)”), not vocabulary. */
  const LABEL_RE = /[\p{Extended_Pictographic}]/u;

  /** Returns { key, score } for a header cell, or null. */
  function matchColumn(cell) {
    const base = baseHeader(cell);
    if (!base) return null;
    let best = null;
    for (const key in KEYWORDS) {
      for (const kw of KEYWORDS[key]) {
        let score = 0;
        if (base === kw) score = 100;
        else if (base.startsWith(kw + ' ') || base.startsWith(kw)) score = 70;
        else if (base.split(' ').indexOf(kw) !== -1) score = 60;
        else if (kw.length >= 3 && base.indexOf(kw) !== -1) score = 50;
        if (score && kw.indexOf(' ') !== -1) score += 15; // multi-word names are more specific
        if (score && (!best || score > best.score)) best = { key: key, score: score };
      }
    }
    // “Tiếng Pháp”, “Tiếng Anh”… name the word column (“Tiếng Việt” is the meaning).
    if (/^tieng (?!viet)/.test(base) && (!best || best.score < 65)) best = { key: 'term', score: 65 };
    return best;
  }

  /* ---------- Delimited text (CSV / TSV) ---------- */
  function detectDelimiter(text) {
    const lines = String(text || '').split(/\r?\n/).filter(function (l) { return l.trim() !== ''; }).slice(0, 10);
    let tabs = 0, commas = 0, semis = 0;
    for (const line of lines) {
      tabs += (line.match(/\t/g) || []).length;
      commas += (line.match(/,/g) || []).length;
      semis += (line.match(/;/g) || []).length;
    }
    if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t';
    if (semis > commas) return ';';
    return ',';
  }

  function parseDelimited(text, delimiter) {
    const d = delimiter || detectDelimiter(text);
    const src = String(text == null ? '' : text).replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], cell = '', inQuotes = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inQuotes) {
        if (c === '"') {
          if (src[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
        } else { cell += c; }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === d) {
        row.push(cell); cell = '';
      } else if (c === '\n') {
        row.push(cell); rows.push(row); row = []; cell = '';
      } else if (c !== '\r') {
        cell += c;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  /* ---------- gviz JSON ---------- */
  function gvizTable(data) {
    const table = (data && data.table) || {};
    const cols = (table.cols || []).map(function (c) { return c.label == null ? '' : String(c.label); });
    const values = (table.rows || []).map(function (r) {
      return (r.c || []).map(function (c) {
        if (!c || c.v == null) return '';
        return c.f != null ? String(c.f) : String(c.v);
      });
    });
    const labelsUseful = cols.some(function (l) { return l && !/^[A-Z]$/.test(l) && !/^\d+$/.test(l); });
    return { header: labelsUseful ? cols : null, values: values };
  }

  function parseGviz(text) {
    const start = String(text).indexOf('(');
    const end = String(text).lastIndexOf(')');
    if (start === -1 || end === -1) throw new Error('Unrecognized gviz response');
    return gvizTable(JSON.parse(String(text).slice(start + 1, end)));
  }

  /* ---------- Table → words ---------- */
  function looksLikeIpa(cell) {
    const s = String(cell || '').trim();
    if (!s) return false;
    if (/^\/.*\/$/.test(s)) return true;
    return /[ˈˌəɪʊɛɔæʌθðʃʒŋɲɟχʁøɨɯ]/.test(s);
  }

  function cleanCell(cell) {
    return String(cell == null ? '' : cell).replace(/\s+/g, ' ').trim();
  }

  /**
   * Parse a 2D table into words.
   * @param rows 2D array (strings)
   * @param opts.header optional header array (e.g. from gviz)
   */
  function parseTable(rows, opts) {
    opts = opts || {};
    rows = (rows || []).map(function (r) { return Array.isArray(r) ? r : []; });
    const meta = { headerRow: -1, mapping: {}, skipped: 0 };

    // 1. Determine header row and column mapping.
    let keys = null;
    let dataStart = 0;

    function keysFromRow(row) {
      return row.map(function (cell) {
        const m = matchColumn(cell);
        return m && m.score >= 50 ? m.key : null;
      });
    }

    if (opts.header && opts.header.length) {
      keys = keysFromRow(opts.header);
      dataStart = 0;
    } else {
      let best = null;
      for (let i = 0; i < Math.min(4, rows.length); i++) {
        const k = keysFromRow(rows[i]);
        const hasTerm = k.indexOf('term') !== -1;
        const hasMeaning = k.indexOf('meaning') !== -1;
        const strong = k.filter(Boolean).length;
        const score = strong + (hasTerm ? 2 : 0) + (hasMeaning ? 2 : 0) + (hasTerm && hasMeaning ? 3 : 0);
        if (!best || score > best.score) best = { idx: i, keys: k, score: score, hasTerm: hasTerm, hasMeaning: hasMeaning };
      }
      if (best && best.score >= 3 && (best.hasTerm || best.hasMeaning)) {
        keys = best.keys;
        dataStart = best.idx + 1;
        meta.headerRow = best.idx;
      }
    }

    const mapping = { term: null, meaning: null, pron: null, example: null, pos: null, note: null };
    const colCount = Math.max(keys ? keys.length : 0, rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0));

    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] && mapping[keys[i]] == null) mapping[keys[i]] = i;
      }
      // Fill gaps from the first unmapped columns (term before meaning).
      function firstUnmapped(fromIdx) {
        for (let i = fromIdx; i < colCount; i++) {
          if (keys[i] == null && mapping.term !== i && mapping.meaning !== i) return i;
        }
        return null;
      }
      if (mapping.term == null) mapping.term = firstUnmapped(0);
      if (mapping.meaning == null) mapping.meaning = firstUnmapped(mapping.term == null ? 0 : mapping.term + 1);
      if (mapping.meaning == null) mapping.meaning = firstUnmapped(0);
    } else {
      // No usable header → assume col 1 = vocab, col 2 = Vietnamese; sniff extras.
      mapping.term = 0;
      mapping.meaning = 1;
      dataStart = 0;
    }

    meta.mapping = Object.assign({}, mapping);

    // 2. Walk the data rows.
    const words = [];
    const seen = Object.create(null);
    const maxRows = 6000;

    for (let i = dataStart; i < rows.length && words.length < maxRows; i++) {
      const row = rows[i];
      const term = cleanCell(row[mapping.term]);
      const meaning = cleanCell(row[mapping.meaning]);
      if (!term || !meaning) { meta.skipped++; continue; }
      // Section/label rows (e.g. “🟢 Nhảy tới B1 (42 từ)”) are decoration, not vocabulary.
      if (LABEL_RE.test(term) || LABEL_RE.test(meaning)) { meta.skipped++; continue; }
      if (term.length > 160 || meaning.length > 400) { meta.skipped++; continue; }
      if (matchColumn(term) && matchColumn(meaning)) { meta.skipped++; continue; } // repeated header

      const pron = mapping.pron != null ? cleanCell(row[mapping.pron]) : '';
      const example = mapping.example != null ? cleanCell(row[mapping.example]) : '';
      const pos = mapping.pos != null ? cleanCell(row[mapping.pos]) : '';
      const note = mapping.note != null ? cleanCell(row[mapping.note]) : '';

      // Extra column sniffing when there was no header at all.
      let extraPron = '', extraExample = '';
      if (!keys) {
        const rest = row.slice(2);
        for (const cellRaw of rest) {
          const cell = cleanCell(cellRaw);
          if (!cell) continue;
          if (!extraPron && looksLikeIpa(cell)) { extraPron = cell; continue; }
          if (!extraExample && term.length >= 3 && Util.normalize(cell).indexOf(Util.normalize(term)) !== -1) {
            extraExample = cell;
          }
        }
      }

      const dedupeKey = Util.normalize(term) + '|' + Util.normalize(meaning);
      if (seen[dedupeKey]) { meta.skipped++; continue; }
      seen[dedupeKey] = true;

      words.push({
        term: term,
        meaning: meaning,
        pron: pron || extraPron || '',
        example: example || extraExample || '',
        pos: pos || '',
        note: note || ''
      });
    }

    return { words: words, meta: meta };
  }

  /* ---------- HTTP helpers ---------- */
  function friendlyHttpError(status, detail, context) {
    const suffix = detail ? ' — ' + detail : '';
    const err = new Error((context || 'Request') + ' failed (' + status + ')' + suffix);
    if (status === 400) {
      err.friendly = 'Google rejected the request (400)' + suffix +
        '. If this is the Sheets API, double-check the sheet ID and that the Sheets API is enabled for your key.';
    } else if (status === 401 || status === 403) {
      err.friendly = 'Access denied (403)' + suffix +
        '.\n• Sheet must be shared as “Anyone with the link → Viewer”.\n• The API key must be allowed to use the Google Sheets API.' +
        '\n• For Gemini: check the key at aistudio.google.com/apikey.';
    } else if (status === 404) {
      err.friendly = 'Not found (404)' + suffix + '. Check the link/ID — or the sheet was deleted.';
    } else if (status === 429) {
      err.friendly = 'Rate limit reached (429)' + suffix + '. Free tier quotas reset over time — waiting a minute usually helps.';
    } else if (status >= 500) {
      err.friendly = 'Google had a server error (' + status + '). Try again in a moment.';
    } else {
      err.friendly = err.message;
    }
    err.status = status;
    return err;
  }

  function networkHelp(context) {
    return 'Network error while contacting ' + (context || 'the server') + '.\n' +
      '• Check your internet connection.\n' +
      '• If you opened index.html by double-clicking it (a file:// page), Chrome and Edge block requests to Google. ' +
      'Run “python3 -m http.server 8080” in the app folder and open http://localhost:8080 — or open the page in Firefox.\n' +
      '• An ad/tracker blocker can also block the request — allow docs.google.com for this page.';
  }

  /* ---------- JSONP fallback ----------
     A <script> tag is not subject to CORS, so it still works when fetch() is
     blocked (double-clicked file:// pages, strict privacy settings). gviz
     supports it through tqx=responseHandler:<callback>. */
  let jsonpSeq = 0;
  const JSONP_TIMEOUT_MS = 20000;

  /** gviz URL with the callback, keeping every other query parameter. */
  function jsonpUrl(url, cbName) {
    const s = String(url);
    const cut = s.indexOf('#');
    const hash = cut === -1 ? '' : s.slice(cut);
    const bare = cut === -1 ? s : s.slice(0, cut);
    const q = bare.indexOf('?');
    const base = q === -1 ? bare : bare.slice(0, q);
    const kept = (q === -1 ? '' : bare.slice(q + 1)).split('&')
      .filter(function (p) { return p && !/^tqx=/i.test(p); });
    kept.push('tqx=responseHandler:' + cbName);
    return base + '?' + kept.join('&') + hash;
  }

  function jsonpRequest(url, context) {
    return new Promise(function (resolve, reject) {
      const doc = global.document;
      if (!doc || !doc.head || typeof doc.createElement !== 'function') {
        const err = new Error('JSONP unavailable');
        err.friendly = networkHelp(context);
        reject(err);
        return;
      }
      const cbName = '__vocablabJsonp' + (++jsonpSeq);
      const src = jsonpUrl(url, cbName);
      const script = doc.createElement('script');
      let done = false;
      const cleanup = function () {
        try { delete global[cbName]; } catch (e) { global[cbName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };
      const timer = setTimeout(function () {
        if (done) return;
        done = true; cleanup();
        const err = new Error('JSONP timed out');
        err.friendly = networkHelp(context);
        reject(err);
      }, JSONP_TIMEOUT_MS);
      global[cbName] = function (data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(data);
      };
      script.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        const err = new Error('JSONP load failed');
        err.friendly = networkHelp(context);
        reject(err);
      };
      script.src = src;
      doc.head.appendChild(script);
    });
  }

  async function request(url, opts, context) {
    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      const err = new Error((context || 'Request') + ' failed: ' + (e && e.message ? e.message : 'network error'));
      err.friendly = networkHelp(context);
      err.cause = e;
      throw err;
    }
    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = (body && body.error && body.error.message) || '';
      } catch (e) { /* not json */ }
      throw friendlyHttpError(res.status, detail, context);
    }
    return res;
  }

  async function requestJson(url, opts, context) {
    const res = await request(url, opts, context);
    try {
      return await res.json();
    } catch (e) {
      const err = new Error((context || 'Request') + ' returned invalid JSON');
      err.friendly = 'The server sent an unexpected response. ' + (context || '');
      throw err;
    }
  }

  async function requestText(url, opts, context) {
    const res = await request(url, opts, context);
    return res.text();
  }

  async function mapLimit(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    }
    const runners = [];
    for (let i = 0; i < Math.min(limit, items.length); i++) runners.push(run());
    await Promise.all(runners);
    return results;
  }

  /* ---------- Deck assembly ---------- */
  function makeDeck(topics, source) {
    const usedIds = Object.create(null);
    const clean = [];
    for (const t of topics) {
      if (!t || !t.words || !t.words.length) continue;
      let id = Util.slugify(t.name);
      if (usedIds[id]) { let n = 2; while (usedIds[id + '-' + n]) n++; id = id + '-' + n; }
      usedIds[id] = true;
      clean.push({
        id: id,
        name: String(t.name || 'Topic'),
        words: t.words.map(function (w) {
          return {
            term: w.term, meaning: w.meaning,
            pron: w.pron || '', example: w.example || '', pos: w.pos || '', note: w.note || ''
          };
        })
      });
    }
    const wordCount = clean.reduce(function (n, t) { return n + t.words.length; }, 0);
    return {
      source: source,
      loadedAt: Date.now(),
      topics: clean,
      wordCount: wordCount
    };
  }

  function parseSpreadsheetId(input) {
    const s = String(input || '').trim();
    const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/) || s.match(/^([a-zA-Z0-9_-]{20,})$/);
    return m ? m[1] : null;
  }

  /* ---------- Loaders ---------- */
  async function loadFromSheetsApi(config, onProgress, signal) {
    const id = parseSpreadsheetId(config.sheetUrl);
    if (!id) {
      const err = new Error('Invalid sheet link');
      err.friendly = 'That does not look like a Google Sheets link or ID. Paste something like https://docs.google.com/spreadsheets/d/…';
      throw err;
    }
    const key = String(config.sheetApiKey || '').trim();
    if (!key) {
      const err = new Error('Missing Sheets API key');
      err.friendly = 'This mode needs a Google Cloud API key (Sheets API enabled).\n' +
        '• No key? Switch to the “Sheet link — no key” mode and paste just your sheet link: every tab is detected automatically.\n' +
        '• Or use the “Apps Script” mode, which also needs no key.';
      throw err;
    }

    onProgress(0, 1, 'Finding tabs…');
    const meta = await requestJson(
      SHEETS_BASE + '/' + id + '?fields=properties.title,sheets(properties(sheetId,title,index,hidden,sheetType))&key=' + encodeURIComponent(key),
      { signal: signal },
      'Google Sheets (metadata)'
    );

    const sheets = ((meta.sheets || []).map(function (s) { return s.properties || {}; }))
      .filter(function (p) { return p.sheetType === 'GRID' && !p.hidden && p.title; })
      .sort(function (a, b) { return (a.index || 0) - (b.index || 0); });

    if (!sheets.length) {
      const err = new Error('No tabs found');
      err.friendly = 'The spreadsheet has no visible grid tabs.';
      throw err;
    }

    let done = 0;
    const topics = [];
    const results = await mapLimit(sheets, 3, async function (prop) {
      const range = "'" + String(prop.title).replace(/'/g, "''") + "'";
      const url = SHEETS_BASE + '/' + id + '/values/' + encodeURIComponent(range) + '?key=' + encodeURIComponent(key);
      let values = [];
      try {
        const data = await requestJson(url, { signal: signal }, 'Google Sheets (“' + prop.title + '”)');
        values = data.values || [];
      } catch (e) {
        if (e.status === 400 && /Unable to parse range/i.test(e.message)) values = [];
        else throw e;
      }
      done++;
      onProgress(done, sheets.length, prop.title);
      const parsed = parseTable(values);
      return { name: prop.title, words: parsed.words };
    });

    for (const r of results) topics.push(r);

    const title = (meta.properties && meta.properties.title) || 'Google Sheet';
    return makeDeck(topics, {
      mode: 'api',
      label: title,
      detail: sheets.length + ' tab' + (sheets.length === 1 ? '' : 's') + ' · ' + id.slice(0, 10) + '…',
      sheetId: id
    });
  }

  async function loadFromScript(config, onProgress, signal) {
    const url = String(config.scriptUrl || '').trim();
    if (!/^https:\/\/script\.google\.com\//.test(url)) {
      const err = new Error('Invalid script URL');
      err.friendly = 'Paste the deployed Apps Script web app URL (it starts with https://script.google.com/macros/s/…).';
      throw err;
    }
    onProgress(0, 1, 'Calling Apps Script…');
    const text = await requestText(url, { signal: signal, redirect: 'follow' }, 'Apps Script web app');
    let data;
    try { data = JSON.parse(text); }
    catch (e) {
      const err = new Error('Apps Script did not return JSON');
      err.friendly = 'The web app answered with HTML instead of JSON. Make sure the script from the Help dialog was pasted and the deployment is set to “Anyone”.';
      throw err;
    }
    let list = [];
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.topics)) list = data.topics;
    const topics = list.map(function (t) {
      const values = t.values || t.rows || [];
      return { name: t.title || t.name || 'Topic', words: parseTable(values).words };
    });
    onProgress(1, 1, 'Done');
    return makeDeck(topics, { mode: 'script', label: 'Apps Script sheet', detail: tabs(topics.length) });
  }

  /** Build a gviz CSV url for a tab (title) or tab id (gid) of a shared sheet. */
  function gvizUrl(id, title, gid) {
    let url = 'https://docs.google.com/spreadsheets/d/' + id + '/gviz/tq?tqx=out:csv';
    if (gid != null && gid !== '') url += '&gid=' + gid;
    else if (title) url += '&sheet=' + encodeURIComponent(title);
    return url;
  }

  /* ---------- Tab discovery without any API key ----------
     The .xlsx export is a zip whose xl/workbook.xml lists every tab name.
     Both Google hops send CORS headers, so the browser can fetch it directly. */

  function decodeXmlEntities(s) {
    return String(s)
      .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCodePoint(parseInt(d, 10)); })
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  }

  function sheetNamesFromWorkbookXml(xml) {
    const names = [];
    const re = /<sheet\b([^>]*?)\/?>/g;
    let m;
    while ((m = re.exec(xml))) {
      const attrs = m[1] || '';
      if (/state="(?:hidden|veryHidden)"/.test(attrs)) continue;
      const nm = /name="([^"]*)"/.exec(attrs);
      if (nm) names.push(decodeXmlEntities(nm[1]));
    }
    return names;
  }

  /** Find one entry in a zip archive (central-directory walk). Returns { method, data } or null. */
  function unzipEntry(buffer, wanted) {
    const u8 = new Uint8Array(buffer);
    const dv = new DataView(buffer);
    let eocd = -1;
    const minEocd = Math.max(0, u8.length - 66000);
    for (let i = u8.length - 22; i >= minEocd; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) return null;
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const decoder = new TextDecoder();
    for (let n = 0; n < count && off + 46 <= u8.length; n++) {
      if (dv.getUint32(off, true) !== 0x02014b50) return null;
      const method = dv.getUint16(off + 10, true);
      const compSize = dv.getUint32(off + 20, true);
      const nameLen = dv.getUint16(off + 28, true);
      const extraLen = dv.getUint16(off + 30, true);
      const commentLen = dv.getUint16(off + 32, true);
      const localOff = dv.getUint32(off + 42, true);
      const name = decoder.decode(u8.subarray(off + 46, off + 46 + nameLen));
      if (name === wanted) {
        const lNameLen = dv.getUint16(localOff + 26, true);
        const lExtraLen = dv.getUint16(localOff + 28, true);
        const dataStart = localOff + 30 + lNameLen + lExtraLen;
        return { method: method, data: u8.subarray(dataStart, dataStart + compSize) };
      }
      off += 46 + nameLen + extraLen + commentLen;
    }
    return null;
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') {
      const err = new Error('DecompressionStream unavailable');
      err.friendly = 'This browser cannot unpack the sheet preview. List your tab names on separate lines instead (see Help → Option C).';
      throw err;
    }
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const writeDone = writer.write(bytes).then(function () { return writer.close(); });
    const reader = ds.readable.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      chunks.push(r.value);
      size += r.value.length;
    }
    await writeDone;
    const out = new Uint8Array(size);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    return out;
  }

  /** Read the visible tab names from an .xlsx buffer. */
  async function readXlsxSheetNames(buffer) {
    const entry = unzipEntry(buffer, 'xl/workbook.xml');
    if (!entry) return [];
    const bytes = entry.method === 8 ? await inflateRaw(entry.data) : entry.data;
    return sheetNamesFromWorkbookXml(new TextDecoder().decode(bytes));
  }

  /** Download the sheet's .xlsx export and list its visible tabs (no API key). */
  async function discoverTabs(sheetId, signal) {
    let res;
    try {
      res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/export?format=xlsx', {
        redirect: 'follow', signal: signal
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
      const err = new Error('Tab discovery network error');
      err.friendly = networkHelp('the sheet export (tab list)');
      err.cause = e;
      throw err;
    }
    if (!res.ok) {
      const err = new Error('Sheet export failed (' + res.status + ')');
      err.status = res.status;
      err.friendly = (res.status === 401 || res.status === 403 || res.status === 404)
        ? 'Could not open the sheet. Set its sharing to “Anyone with the link → Viewer”, then press again.'
        : 'Google could not export the sheet (' + res.status + '). Try again in a moment.';
      throw err;
    }
    const names = await readXlsxSheetNames(await res.arrayBuffer());
    if (!names.length) {
      const err = new Error('No tab names found in the export');
      err.friendly = 'The sheet export had no tab names. List your tab names on separate lines in the box instead.';
      throw err;
    }
    return names;
  }

  /** Undo the JS string escapes Google uses in htmlview (\x26, \/, \u2026, \" …). */
  function decodeJsString(s) {
    return String(s).replace(/\\x([0-9a-fA-F]{2})|\\u([0-9a-fA-F]{4})|\\(.)/g,
      function (all, hex2, hex4, ch) {
        if (hex2) return String.fromCharCode(parseInt(hex2, 16));
        if (hex4) return String.fromCharCode(parseInt(hex4, 16));
        if (ch === 'n') return '\n';
        if (ch === 't') return '\t';
        if (ch === 'r') return '\r';
        return ch;
      });
  }

  /** Tab names out of a Google Sheets htmlview page: every tab is an items.push({name: "…"}). */
  function parseHtmlViewNames(html) {
    const names = [];
    const re = /items\.push\(\{\s*name:\s*"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = re.exec(String(html || '')))) {
      const name = decodeJsString(m[1]);
      if (name && names.indexOf(name) === -1) names.push(name);
    }
    return names;
  }

  /**
   * Best-effort tab list through the public r.jina.ai reader. A file:// page cannot
   * download the sheet export (Google refuses requests from a null origin), and this
   * reader is reachable from everywhere. Never throws: [] means “could not help”.
   */
  async function onlineTabNames(sheetId, signal) {
    if (!sheetId) return [];
    let sig = signal;
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout && AbortSignal.any) {
      const limit = AbortSignal.timeout(20000);
      sig = signal ? AbortSignal.any([signal, limit]) : limit;
    }
    let res;
    try {
      res = await fetch('https://r.jina.ai/https://docs.google.com/spreadsheets/d/' + sheetId + '/htmlview', {
        headers: { 'X-Return-Format': 'html' }, redirect: 'follow', signal: sig
      });
    } catch (e) {
      if (e && e.name === 'AbortError') throw e; // the caller cancelled
      return [];
    }
    if (!res.ok) return [];
    try { return parseHtmlViewNames(await res.text()); }
    catch (e) { return []; }
  }

  /* The tab list is remembered per sheet so a blocked download (file:// pages,
     privacy settings, blockers) still loads every topic. */
  function cachedTabs(sheetId) {
    if (!sheetId) return null;
    const all = Util.lsGet('tablist', {});
    return Array.isArray(all[sheetId]) ? all[sheetId] : null;
  }

  function rememberTabs(sheetId, names) {
    if (!sheetId || !names || !names.length) return;
    const all = Util.lsGet('tablist', {});
    all[sheetId] = names.slice();
    Util.lsSet('tablist', all);
  }

  /** Tab names from the last deck this browser loaded from the same sheet.
      A deck that itself fell back to the first tab is not a tab list. */
  function lastDeckTabs(sheetId) {
    if (!sheetId) return null;
    const deck = Util.lsGet('deck', null);
    if (!deck || !deck.topics || deck.topics.length < 2) return null;
    const src = deck.source || {};
    if (src.mode !== 'links' || src.sheetId !== sheetId || src.firstTabOnly) return null;
    return deck.topics.map(function (t) { return t.name; });
  }

  /** A remembered list worth reusing: two or more tabs from a healthy load. */
  function pickRemembered(cached, sheetId) {
    if (cached && cached.length > 1) return cached;
    const fromDeck = lastDeckTabs(sheetId);
    return fromDeck && fromDeck.length > 1 ? fromDeck : null;
  }

  function tabs(n) { return n + ' tab' + (n === 1 ? '' : 's'); }

  /**
   * Links-box syntax (one per line):
   *   Topic name | any sheet link        → that tab
   *   https://docs.google.com/spreadsheets/d/{id}/edit   → remember this sheet…
   *   Tab name                            → …each following bare line = one tab (no key needed)
   *   # comments and empty lines are ignored
   * Returns { links, sheetId, bareOnly } — bareOnly = a sheet link was given but
   * no tabs were listed, so the caller may auto-discover the tabs.
   */
  function parseLinkText(text) {
    const lines = String(text || '').split(/\r?\n/);
    const links = [];
    let baseId = null;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.charAt(0) === '#') continue;
      let name = '', url = line;
      const sep = line.indexOf('|');
      if (sep !== -1) { name = line.slice(0, sep).trim(); url = line.slice(sep + 1).trim(); }
      else {
        const tabSep = line.indexOf('\t');
        if (tabSep !== -1) { name = line.slice(0, tabSep).trim(); url = line.slice(tabSep + 1).trim(); }
      }
      if (!/^https?:\/\//i.test(url)) {
        // Bare line → a tab name for the sheet link pasted above it.
        const tabName = (name || url).trim();
        const looksLikeLink = /\//.test(tabName) || /^(www\.|docs\.google)/i.test(tabName) || /^[a-zA-Z0-9_-]{25,}$/.test(tabName);
        if (baseId && tabName && !looksLikeLink) links.push({ name: tabName, url: gvizUrl(baseId, tabName) });
        continue;
      }
      const id = /\/spreadsheets\/d\/e\//.test(url) ? null : parseSpreadsheetId(url);
      if (!id) { links.push({ name: name, url: url }); continue; }
      const gidMatch = url.match(/[?&#]gid=(\d+)/);
      const carriesData = /[?&](sheet|output|tqx|format)=/.test(url);
      if (!gidMatch && !carriesData && !name) { baseId = id; continue; } // plain sheet link → context for tab names below
      if (gidMatch) { links.push({ name: name, url: gvizUrl(id, null, gidMatch[1]) }); continue; }
      links.push({ name: name, url: carriesData ? url : gvizUrl(id) });
    }
    const bareOnly = !!baseId && links.length === 0;
    if (!links.length && baseId) links.push({ name: '', url: gvizUrl(baseId) });
    return { links: links, sheetId: baseId, bareOnly: bareOnly };
  }

  function parseLinkLines(text) {
    return parseLinkText(text).links;
  }

  async function loadFromLinks(config, onProgress, signal) {
    const parsed = parseLinkText(config.links);
    let links = parsed.links;
    const preWarnings = [];
    let autoDiscovered = false;
    let fromCache = false;
    let firstTabOnly = false;
    let onlineTabs = false;

    if (parsed.bareOnly) {
      // Only a sheet link was pasted → discover every tab (no key needed).
      onProgress(0, 1, 'Finding tabs…');
      const cached = cachedTabs(parsed.sheetId);
      let names = null;
      try {
        names = await discoverTabs(parsed.sheetId, signal);
        rememberTabs(parsed.sheetId, names);
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        const reason = e && e.friendly ? String(e.friendly).split('\n')[0] : e.message;
        // No HTTP status means the browser blocked the download itself (a file://
        // page, strict privacy settings, a blocker…). Ask the online reader instead.
        let online = [];
        let onlineTried = false;
        if (!e.status) {
          onlineTried = true;
          onProgress(0, 1, 'Finding tabs (online)…');
          try { online = await onlineTabNames(parsed.sheetId, signal); }
          catch (e2) { if (e2 && e2.name === 'AbortError') throw e2; }
        }
        if (online.length > 1) {
          names = online;
          onlineTabs = true;
          rememberTabs(parsed.sheetId, names);
        } else {
          const remembered = pickRemembered(cached, parsed.sheetId);
          if (remembered) {
            names = remembered;
            fromCache = true;
            preWarnings.push('Could not refresh the tab list (' + reason + ') — used the remembered list for this sheet (' +
              tabs(remembered.length) + ').');
          } else {
            // Only one tab is reachable: say so once, with something to do about it.
            firstTabOnly = true;
            const isFile = typeof location !== 'undefined' && location.protocol === 'file:';
            preWarnings.push('Could not list the tabs automatically (' + reason + ')' +
              (onlineTried ? ' and the online reader did not answer' : '') + ' — loaded the first tab only. ' +
              (isFile
                ? 'This page is opened as a local file, where Chrome and Edge block Google’s tab list: paste your tab names, one per line, under the link (they are remembered), or open the app from http://localhost and every tab is detected by itself.'
                : 'Add your tab names, one per line, to load them all: that also works when the browser blocks Google. Opening the app from http://localhost lets VocabLab detect every tab by itself.'));
            names = [''];
          }
        }
      }
      links = names.map(function (n) {
        return { name: n, url: n ? gvizUrl(parsed.sheetId, n) : gvizUrl(parsed.sheetId) };
      });
      autoDiscovered = names.length > 1 && !fromCache;
    } else if (parsed.sheetId) {
      // A hand-written tab list is remembered too, so the sheet keeps working
      // from a bare link later (even when the tab-list download is blocked).
      const listed = links.map(function (l) { return l.name; }).filter(Boolean);
      const sameSheet = links.every(function (l) {
        return l.url.indexOf('/spreadsheets/d/' + parsed.sheetId) !== -1;
      });
      if (listed.length === links.length && sameSheet) rememberTabs(parsed.sheetId, listed);
    }

    if (!links.length) {
      const err = new Error('No links');
      err.friendly = 'Add at least one link, one per line: “Topic name | https://…”.';
      throw err;
    }
    let done = 0;
    const failures = [];
    const results = await mapLimit(links, 3, async function (link, index) {
      const label = link.name || ('topic ' + (index + 1));
      try {
        let url = link.url;
        if (/\/export\?/.test(url)) {
          const gidMatch = url.match(/[?&]gid=(\d+)/);
          url = url.replace(/\/export\?[^#]*/, '/gviz/tq?tqx=out:json' + (gidMatch ? '&gid=' + gidMatch[1] : ''));
        }
        let header = null, values;
        const isGviz = /\/gviz\/tq/.test(url);
        let body = null;
        try {
          body = await requestText(url, { signal: signal, redirect: 'follow' }, 'Sheet link “' + label + '”');
        } catch (eFetch) {
          if (eFetch && eFetch.name === 'AbortError') throw eFetch;
          if (!isGviz || !eFetch.cause) throw eFetch;
          // fetch() was blocked (double-clicked file:// page, strict privacy settings,
          // blocker…). A <script> tag is not subject to CORS — retry with that.
          const data = await jsonpRequest(url, 'Sheet link “' + label + '”');
          const g = gvizTable(data);
          header = g.header; values = g.values;
        }
        if (body != null) {
          if (/google\.visualization|^\s*\/\*O_o\*\//.test(body) || (body.trim().charAt(0) === '{' && body.indexOf('"table"') !== -1)) {
            const g = parseGviz(body);
            header = g.header; values = g.values;
          } else {
            values = parseDelimited(body);
          }
        }
        const parsed = parseTable(values, { header: header });
        return { name: link.name || ('Topic ' + (index + 1)), words: parsed.words };
      } catch (e) {
        if (e && e.name === 'AbortError') throw e;
        failures.push({ name: label, message: e.friendly ? String(e.friendly).split('\n')[0] : e.message });
        return { name: link.name || ('Topic ' + (index + 1)), words: [] };
      } finally {
        done++;
        onProgress(done, links.length, label);
      }
    });

    // Google silently serves the FIRST tab when a tab name/gid is unknown (e.g. a
    // renamed tab). Identical content under two names exposes that fallback.
    const kept = [];
    const byFingerprint = Object.create(null);
    const warnings = [];
    for (const t of results) {
      if (!t.words.length) continue;
      const fingerprint = t.words.length + '|' + Util.hash(t.words.slice(0, 3).map(function (w) { return w.term; }).join('|'));
      if (byFingerprint[fingerprint]) {
        warnings.push('“' + t.name + '” returned the same words as “' + byFingerprint[fingerprint] +
          '” — the tab name is probably outdated (renamed?). Update the tab list in Settings → Google Sheet.');
        continue;
      }
      byFingerprint[fingerprint] = t.name;
      kept.push(t);
    }

    if (!kept.length) {
      const err = new Error('No rows in any link');
      const allNetwork = failures.length > 0 && failures.length === links.length &&
        failures.every(function (f) { return /^Network error/.test(f.message); });
      if (allNetwork) {
        err.friendly = networkHelp('Google Sheets') +
          '\n• Also make sure the sheet is shared as “Anyone with the link → Viewer”.';
      } else if (failures.length) {
        err.friendly = 'No usable rows were found. First problem: “' + failures[0].name + '” — ' + failures[0].message;
      } else {
        err.friendly = 'No usable rows were found. Check the tab names/links and that each tab has a Vocab column and a Vietnamese column.';
      }
      throw err;
    }

    for (const f of failures) warnings.push('Could not load “' + f.name + '”: ' + f.message);
    if (kept.length !== links.length && failures.length === 0 && !autoDiscovered) {
      warnings.push(kept.length + ' of ' + links.length + ' entries loaded — update the tab list in Settings → Google Sheet if you added or renamed tabs.');
    }

    const deck = makeDeck(kept, {
      mode: 'links',
      sheetId: parsed.sheetId || null,
      firstTabOnly: firstTabOnly,
      label: kept.length + ' tab' + (kept.length === 1 ? '' : 's'),
      detail: firstTabOnly ? 'first tab only · no key needed'
        : fromCache ? 'tabs remembered for this sheet · no key needed'
        : onlineTabs ? 'tabs listed online (r.jina.ai) · no key needed'
        : autoDiscovered ? 'tabs auto-detected · no key needed'
        : 'no API key needed'
    });
    const allWarnings = preWarnings.concat(warnings);
    if (allWarnings.length) deck.source.warnings = allWarnings;
    return deck;
  }

  /**
   * Main entry. config:
   *   { mode: 'api'|'script'|'links'|'demo', sheetUrl, sheetApiKey, scriptUrl, links }
   * onProgress(done, total, label)
   */
  async function load(config, onProgress, signal) {
    const progress = onProgress || function () {};
    if (!config || !config.mode || config.mode === 'demo') {
      return DemoDeck.load();
    }
    if (config.mode === 'api') return loadFromSheetsApi(config, progress, signal);
    if (config.mode === 'script') return loadFromScript(config, progress, signal);
    if (config.mode === 'links') return loadFromLinks(config, progress, signal);
    return DemoDeck.load();
  }

  global.Sources = {
    load: load,
    parseSpreadsheetId: parseSpreadsheetId,
    parseDelimited: parseDelimited,
    detectDelimiter: detectDelimiter,
    parseGviz: parseGviz,
    gvizTable: gvizTable,
    jsonpRequest: jsonpRequest,
    jsonpUrl: jsonpUrl,
    networkHelp: networkHelp,
    parseTable: parseTable,
    parseLinkLines: parseLinkLines,
    parseLinkText: parseLinkText,
    gvizUrl: gvizUrl,
    discoverTabs: discoverTabs,
    readXlsxSheetNames: readXlsxSheetNames,
    parseHtmlViewNames: parseHtmlViewNames,
    onlineTabNames: onlineTabNames,
    cachedTabs: cachedTabs,
    rememberTabs: rememberTabs,
    lastDeckTabs: lastDeckTabs,
    pickRemembered: pickRemembered,
    matchColumn: matchColumn,
    makeDeck: makeDeck
  };
})(typeof window !== 'undefined' ? window : globalThis);
