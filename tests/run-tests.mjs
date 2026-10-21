/* =========================================================
   VocabLab — logic tests (node tests/run-tests.mjs)
   Loads the browser scripts in a vm sandbox with a fake
   localStorage, then exercises the pure logic.
   ========================================================= */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- sandbox ---------- */
const store = new Map();
const storage = {};
Object.defineProperties(storage, {
  getItem: { value: (k) => (store.has(k) ? store.get(k) : null) },
  setItem: { value: (k, v) => { store.set(k, String(v)); Object.defineProperty(storage, k, { value: String(v), enumerable: true, configurable: true, writable: true }); } },
  removeItem: { value: (k) => { store.delete(k); delete storage[k]; } }
});
/* ---------- fake fetch for link-loading tests ---------- */
function fakeResponse(body, status = 200, headers) {
  const text = typeof body === 'string' ? body : '';
  const bytes = body instanceof Uint8Array ? body : null;
  const head = headers || {};
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => head[String(name).toLowerCase()] },
    text: async () => text,
    json: async () => JSON.parse(text),
    arrayBuffer: async () => {
      if (bytes) return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return new TextEncoder().encode(text).buffer;
    }
  };
}
let fetchRoutes = [];
/** When set, every fetch goes through this instead (used by the AI transport tests). */
let aiFetch = null;
const fetchStub = async function (url, opts) {
  if (aiFetch) return aiFetch(String(url), opts || {});
  const u = String(url);
  for (const route of fetchRoutes) {
    if (u.indexOf(route[0]) !== -1) return route[1](u);
  }
  return fakeResponse('not found', 404);
};

let jsonpHandler = null;
/** Minimal <script>-tag environment so the JSONP fallback can be tested. */
const fakeDocument = {
  head: {
    appendChild(el) {
      const src = String(el.src || '');
      const m = /responseHandler:([A-Za-z0-9_]+)/.exec(src);
      const name = m && m[1];
      setTimeout(() => {
        const data = name && jsonpHandler ? jsonpHandler(src) : null;
        if (data && typeof sandbox[name] === 'function') sandbox[name](data);
        else if (typeof el.onerror === 'function') el.onerror();
      }, 0);
    },
    removeChild() { /* ignore */ }
  },
  createElement() { return { src: '', onerror: null, parentNode: null }; }
};

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: storage,
  DOMException,
  AbortController,
  fetch: fetchStub,
  document: fakeDocument,
  TextDecoder,
  TextEncoder,
  DecompressionStream,
  Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Promise, Error,
  URL // browsers always have it; ai.js uses it to name the failing host
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['js/util.js', 'js/demo.js', 'js/sources.js', 'js/ai.js', 'js/generator.js', 'js/quiz.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
}
const { Util, Sources, Gen, Quiz, Ai, DemoDeck } = sandbox;

/* ---------- tiny test harness ---------- */
let passed = 0, failed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed++; }
  else { failed++; failures.push(label); console.log('  ✕ ' + label); }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; }
  else { failed++; failures.push(label); console.log('  ✕ ' + label + '\n      expected: ' + e + '\n      actual:   ' + a); }
}
function section(name) { console.log('\n▸ ' + name); }

/* ---------- Util ---------- */
section('Util helpers');
eq(Util.normalize('  Hello   World! '), 'hello world!', 'normalize collapses spaces + lowercases');
eq(Util.normalizeForCompare('Sự khởi hành.'), 'sự khởi hành', 'normalizeForCompare strips punctuation');
eq(Util.stripDiacritics('Sự khởi hành'), 'Su khoi hanh', 'stripDiacritics handles đ + tones');
eq(Util.levenshtein('departure', 'departuer'), 2, 'levenshtein distance');
eq(Util.levenshtein('abc', 'abc'), 0, 'levenshtein equal');
ok(Util.termRegex('boarding pass').test('boarding   pass'), 'termRegex allows flexible whitespace');
ok(!Util.termRegex('ripe').test('tripe'), 'termRegex is case-insensitive but not substring-happy');
eq(Util.slugify('Food & Dining'), 'food-dining', 'slugify');
eq(Util.todayKey(new Date(2026, 9, 15)), '2026-10-15', 'todayKey local date');

/* A sheet often stores near-identical meanings for different words; those two
   meanings must never face each other in one multiple-choice question. */
ok(Util.tooSimilarMeaning('có tác động đến', 'tác động tích cực (đến)'), 'near-synonym meanings detected');
ok(Util.tooSimilarMeaning('tác động đến', 'có tác động đến'), 'meaning + glue words detected');
ok(Util.tooSimilarMeaning('ảnh hưởng, tác động đến', 'có tác động đến'), 'list meaning detected');
ok(Util.tooSimilarMeaning('tác động tích cực (đến)', 'tác động tiêu cực (đến)'), 'opposite meanings detected');
ok(Util.tooSimilarMeaning('TÁC ĐỘNG ĐẾN', 'tac dong den'), 'case and diacritics ignored');
ok(!Util.tooSimilarMeaning('có tác động đến', 'làm phát sinh, dẫn đến'), 'different meanings stay usable');
ok(!Util.tooSimilarMeaning('có tác động đến', 'gây hậu quả xấu (đến)'), 'unrelated meanings stay usable');
ok(!Util.tooSimilarMeaning('nhà ga', 'nhà hàng'), 'one shared word is not similarity');
ok(!Util.tooSimilarMeaning('le taux de chômage', "le taux d'intérêt"), 'French glue words ignored');
ok(!Util.tooSimilarMeaning('', 'nhà ga'), 'missing meaning never clashes');

/* ---------- sources: delimited parsing ---------- */
section('Sources — CSV/TSV parsing');
const csv = 'Vocab,Vietnamese\n"departure","sự khởi hành, sự ra đi"\n"say ""hi""",xin chào\n';
const rows = Sources.parseDelimited(csv, ',');
eq(rows.length, 3, 'csv row count');
eq(rows[1][1], 'sự khởi hành, sự ra đi', 'csv quoted comma');
eq(rows[2][0], 'say "hi"', 'csv escaped quotes');
eq(Sources.detectDelimiter('a\tb\tc\n1\t2\t3'), '\t', 'detect TSV');
eq(Sources.detectDelimiter('a,b,c\n1,2,3'), ',', 'detect CSV');

/* ---------- sources: header detection ---------- */
section('Sources — header matching');
eq(Sources.matchColumn('Vocab').key, 'term', 'header Vocab → term');
eq(Sources.matchColumn('Từ vựng').key, 'term', 'header Từ vựng → term');
eq(Sources.matchColumn('Word/Phrase').key, 'term', 'header Word/Phrase → term');
eq(Sources.matchColumn('Vietnamese').key, 'meaning', 'header Vietnamese → meaning');
eq(Sources.matchColumn('Nghĩa').key, 'meaning', 'header Nghĩa → meaning');
eq(Sources.matchColumn('Meaning (EN)').key, 'meaning', 'header Meaning (EN) → meaning');
eq(Sources.matchColumn('Phát âm').key, 'pron', 'header Phát âm → pron');
eq(Sources.matchColumn('Pinyin').key, 'pron', 'header Pinyin → pron');
eq(Sources.matchColumn('Ví dụ').key, 'example', 'header Ví dụ → example');
eq(Sources.matchColumn('Example sentence').key, 'example', 'header Example sentence → example');
eq(Sources.matchColumn('Part of speech').key, 'pos', 'header Part of speech → pos');
eq(Sources.matchColumn('Ghi chú').key, 'note', 'header Ghi chú → note');
eq(Sources.matchColumn('Français').key, 'term', 'header Français → term');
eq(Sources.matchColumn('French').key, 'term', 'header French → term');
eq(Sources.matchColumn('Vietnamien').key, 'meaning', 'header Vietnamien → meaning');
eq(Sources.matchColumn('Tiếng Việt').key, 'meaning', 'header Tiếng Việt → meaning');
eq(Sources.matchColumn('random junk'), null, 'unknown header → null');

/* ---------- sources: parseTable ---------- */
section('Sources — parseTable');
const t1 = Sources.parseTable([
  ['Vocab', 'Vietnamese', 'Pronunciation', 'Example'],
  ['departure', 'sự khởi hành', 'dɪˈpɑːtʃə', 'The departure was delayed.'],
  ['luggage', 'hành lý', 'ˈlʌɡɪdʒ', 'My luggage is heavy.'],
  [],
  ['Vocab', 'Vietnamese', 'Pronunciation', 'Example'], // repeated header mid-sheet
  ['passport', 'hộ chiếu', '', '']
]);
eq(t1.words.length, 3, 'parseTable with EN headers (repeated header skipped)');
eq(t1.words[0], { term: 'departure', meaning: 'sự khởi hành', pron: 'dɪˈpɑːtʃə', example: 'The departure was delayed.', pos: '', note: '' }, 'first word mapped');
eq(t1.meta.headerRow, 0, 'header row index');

const t2 = Sources.parseTable([
  ['Từ vựng', 'Nghĩa', 'Phát âm', 'Ví dụ', 'Từ loại'],
  ['grill', 'nướng', 'ɡrɪl', "Let's grill the fish.", 'verb']
]);
eq(t2.words[0].pos, 'verb', 'Vietnamese headers incl. part of speech');
eq(t2.words[0].example, "Let's grill the fish.", 'Vietnamese header example');

const t3 = Sources.parseTable([
  ['departure', 'sự khởi hành'],
  ['luggage', 'hành lý'],
  ['passport', 'hộ chiếu']
]);
eq(t3.meta.headerRow, -1, 'no header detected');
eq(t3.words.map((w) => w.term), ['departure', 'luggage', 'passport'], 'no-header positional mapping');

const t4 = Sources.parseTable([
  ['departure', 'sự khởi hành', '/dɪˈpɑːtʃə/', 'The departure was delayed.'],
  ['luggage', 'hành lý', 'ˈlʌɡɪdʒ', 'My luggage is heavy.']
]);
eq(t4.words[0].pron, '/dɪˈpɑːtʃə/', 'extra IPA-looking column sniffed as pron');
eq(t4.words[1].example, 'My luggage is heavy.', 'extra example column sniffed');

const t5 = Sources.parseTable([
  ['Word', 'Meaning'],
  ['word', 'meaning'],   // looks like a repeated header → skipped
  ['', 'orphan'],
  ['dup', 'x'], ['dup', 'x']
]);
eq(t5.words.length, 1, 'repeated header, empty and duplicate rows skipped');

/* ---------- sources: gviz + links ---------- */
section('Sources — gviz & links');
const gvizText = `/*O_o*/
google.visualization.Query.setResponse({"version":"0.6","table":{"cols":[{"label":"Vocab","type":"string"},{"label":"Vietnamese","type":"string"}],"rows":[{"c":[{"v":"departure"},{"v":"sự khởi hành"}]},{"c":[{"v":"luggage"},{"v":"hành lý"}]}]}});`;
const g = Sources.parseGviz(gvizText);
eq(g.header, ['Vocab', 'Vietnamese'], 'gviz header from col labels');
const gt = Sources.parseTable(g.values, { header: g.header });
eq(gt.words.length, 2, 'gviz rows parsed');
eq(gt.words[1].meaning, 'hành lý', 'gviz value mapping');

const labelRows = Sources.parseTable([
  ['Tiếng Pháp', 'Giống / Từ loại', 'Nghĩa tiếng Việt', 'Ví dụ đơn giản'],
  ['causer', 'v.t.', 'gây nên, gây ra', 'La pollution cause de nombreuses maladies.'],
  ['🟢 Nhảy tới B1 (42 từ)', '', '🟠 Nhảy tới B2 (79 mục)', ''],
  ['▸ Cause → conséquence — Nguyên nhân → hệ quả', '', '', ''],
  ['provoquer', 'v.t.', 'gây ra, gây nên', 'Le tabac peut provoquer des cancers.']
]);
eq(labelRows.words.length, 2, 'section/label rows are skipped');
eq(labelRows.words[0].term, 'causer', 'first real word kept');
eq(labelRows.words[0].meaning, 'gây nên, gây ra', 'meaning column from “Nghĩa tiếng Việt”');
eq(labelRows.words[0].pos, 'v.t.', 'pos column from “Giống / Từ loại”');
eq(labelRows.words[0].example, 'La pollution cause de nombreuses maladies.', 'example column from “Ví dụ đơn giản”');

const links = Sources.parseLinkLines('Travel | https://example.com/a.csv\nhttps://example.com/b.csv\n\n# comment\nnot a url');
eq(links.length, 2, 'parseLinkLines count');
eq(links[0].name, 'Travel', 'parseLinkLines name');
eq(links[1].url, 'https://example.com/b.csv', 'parseLinkLines bare url');

const sid = '1jbA32_VjL1qLxKayyh_YoM0sb1xGX9a-dt4uwZLlEiY';
const sheetLines = Sources.parseLinkLines([
  '# my vocab sheet',
  'https://docs.google.com/spreadsheets/d/' + sid + '/edit?usp=sharing',
  'Y tế - Phẫu thuật',
  'Viết DELF - Nhân quả & Liên kết'
].join('\n'));
eq(sheetLines.length, 2, 'sheet link + tab names → one link per tab');
eq(sheetLines[0].name, 'Y tế - Phẫu thuật', 'tab name kept as topic name');
ok(sheetLines[0].url.indexOf('/gviz/tq?tqx=out:csv&sheet=Y%20t%E1%BA%BF') !== -1, 'tab name URL-encoded into the gviz link');
ok(sheetLines[1].url.indexOf('%26') !== -1, 'ampersand in a tab name is encoded');
eq(Sources.parseLinkLines('just a name\nanother name').length, 0, 'bare names without a sheet link are ignored');
const gidLine = Sources.parseLinkLines('https://docs.google.com/spreadsheets/d/' + sid + '/edit#gid=12345');
eq(gidLine.length, 1, 'tab link with #gid becomes a link');
ok(/gid=12345/.test(gidLine[0].url), 'gid kept in the gviz url');
const namedSheet = Sources.parseLinkLines('Whole sheet | https://docs.google.com/spreadsheets/d/' + sid + '/edit');
eq(namedSheet.length, 1, 'named plain sheet link → first tab');
ok(/gviz\/tq\?tqx=out:csv$/.test(namedSheet[0].url), 'named sheet link → gviz csv without sheet param');
const onlySheet = Sources.parseLinkLines('https://docs.google.com/spreadsheets/d/' + sid + '/edit');
eq(onlySheet.length, 1, 'sheet link alone still loads the first tab');
const pubLink = Sources.parseLinkLines('Travel | https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?output=csv');
eq(pubLink[0].url, 'https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?output=csv', 'published /e/ link kept as-is');

/* ---------- Header detection for a French→Vietnamese sheet ---------- */
section('Sources — header names (tiếng …)');
eq(Sources.matchColumn('Tiếng Pháp').key, 'term', '"Tiếng Pháp" = word column');
eq(Sources.matchColumn('Nghĩa tiếng Việt').key, 'meaning', '"Nghĩa tiếng Việt" = meaning column');
eq(Sources.matchColumn('Giống / Từ loại').key, 'pos', '"Giống / Từ loại" = part of speech');
eq(Sources.matchColumn('Ví dụ đơn giản').key, 'example', '"Ví dụ đơn giản" = example column');
eq(Sources.matchColumn('Tiếng Anh').key, 'term', '"Tiếng Anh" = word column');
eq(Sources.matchColumn('Tiếng Việt').key, 'meaning', '"Tiếng Việt" = meaning column');

/* ---------- Link loading with a changing sheet ---------- */
section('Sources — link loading (evolving sheet)');
const toCsv = (rows) => rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
const firstTabCsv = toCsv([['Vocab', 'Vietnamese'], ['gare', 'nhà ga'], ['billet', 'vé']]);
const sheetLine = 'https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwx/edit';
fetchRoutes = [
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['sheet=Unit%202', () => fakeResponse(toCsv([['Vocab', 'Vietnamese'], ['chat', 'mèo']]))],
  ['sheet=Old%20name', () => fakeResponse(firstTabCsv)] // Google falls back to the first tab
];
const linkDeck = await Sources.load({ mode: 'links', links: sheetLine + '\nUnit 1\nUnit 2\nOld name' }, null, null);
eq(linkDeck.topics.length, 2, 'stale tab name (falls back to first tab) dropped as duplicate');
eq(linkDeck.wordCount, 3, 'words from the two real tabs only');
ok(Array.isArray(linkDeck.source.warnings) && linkDeck.source.warnings.length >= 1, 'warnings reported on the deck');
fetchRoutes.push(['sheet=Broken', () => fakeResponse('nope', 404)]);
const mixedDeck = await Sources.load({ mode: 'links', links: sheetLine + '\nUnit 1\nBroken' }, null, null);
eq(mixedDeck.topics.length, 1, 'failed tab is skipped, the rest still loads');
ok(mixedDeck.source.warnings.some((w) => /Could not load/.test(w)), 'failure reported as a warning');

/* ---------- xlsx tab discovery (sheet link only) ---------- */
section('Sources — auto tab discovery (no key)');
const ptBare = Sources.parseLinkText(sheetLine);
eq(ptBare.bareOnly, true, 'sheet link alone is marked bareOnly');
eq(ptBare.sheetId, 'abcdefghijklmnopqrstuvwx', 'sheet id extracted');
eq(Sources.parseLinkText(sheetLine + '\nUnit 1').bareOnly, false, 'with tab names it is not bareOnly');

function makeZip(entries) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, data, method] of entries) {
    const nameBytes = Buffer.from(enc.encode(name));
    const stored = method === 8 ? zlib.deflateRawSync(Buffer.from(data)) : Buffer.from(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method || 0, 8);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    chunks.push(local, nameBytes, stored);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(method || 0, 10);
    cen.writeUInt16LE(0x21, 14);
    cen.writeUInt32LE(stored.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBytes.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBytes);
    offset += local.length + nameBytes.length + stored.length;
  }
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  const all = Buffer.concat([Buffer.concat(chunks), cdBuf, eocd]);
  return new Uint8Array(all.buffer.slice(all.byteOffset, all.byteOffset + all.length));
}

const wbXml = '<?xml version="1.0"?><workbook><sheets>' +
  '<sheet name="Unit 1" sheetId="1"/><sheet name="Hidden tab" state="hidden" sheetId="2"/>' +
  '<sheet name="Unit &amp; 2" sheetId="3"/></sheets></workbook>';
const zipStored = makeZip([['xl/workbook.xml', new TextEncoder().encode(wbXml), 0]]);
const zipDeflated = makeZip([['xl/workbook.xml', new TextEncoder().encode(wbXml), 8]]);
const namesStored = await Sources.readXlsxSheetNames(zipStored.buffer);
eq(namesStored, ['Unit 1', 'Unit & 2'], 'stored xlsx: tab names read, hidden skipped, entities decoded');
const namesDeflated = await Sources.readXlsxSheetNames(zipDeflated.buffer);
eq(namesDeflated, ['Unit 1', 'Unit & 2'], 'deflated xlsx: tab names read via DecompressionStream');

fetchRoutes = [
  ['export?format=xlsx', () => fakeResponse(zipDeflated)],
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['sheet=Unit%20%26%202', () => fakeResponse(toCsv([['Vocab', 'Vietnamese'], ['chat', 'mèo']]))]
];
const autoDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
eq(autoDeck.topics.length, 2, 'sheet link alone auto-discovers every tab');
eq(autoDeck.topics[1].name, 'Unit & 2', 'discovered tab names become topics');
ok(/auto-detected/.test(autoDeck.source.detail), 'deck notes auto-detection');

fetchRoutes = [
  ['export?format=xlsx', () => fakeResponse('nope', 500)],
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['sheet=Unit%20%26%202', () => fakeResponse(toCsv([['Vocab', 'Vietnamese'], ['chat', 'mèo']]))]
];
const cachedDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
eq(cachedDeck.topics.length, 2, 'export failure falls back to the cached tab list');
ok(cachedDeck.source.warnings.some((w) => /remembered list for this sheet \(2 tabs\)/.test(w)), 'cache fallback reported, with the tab count');

/* ---------- blocked tab-list download with no memory (double-clicked file://) ---------- */
section('Sources — tab list fallback');
Util.lsRemove('tablist');
Util.lsRemove('deck');
const blockExport = () => { throw new TypeError('Failed to fetch'); };
fetchRoutes = [
  ['export?format=xlsx', blockExport],
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['gviz/tq', () => fakeResponse(firstTabCsv)] // the unnamed first tab
];
const oneTabDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
eq(oneTabDeck.topics.length, 1, 'blocked tab list with no memory → first tab only');
ok(oneTabDeck.source.warnings.some((w) => /loaded the first tab only/.test(w)), 'the single-tab load says what happened');
ok(oneTabDeck.source.warnings.some((w) => /tab names, one per line/.test(w) && /http:\/\/localhost/.test(w)),
  'the note explains how to get every tab');
ok(oneTabDeck.source.warnings.some((w) => /online reader did not answer/.test(w)),
  'the note says the online reader was tried too');
ok(oneTabDeck.source.sheetId === 'abcdefghijklmnopqrstuvwx', 'the deck remembers which sheet it came from');
eq(oneTabDeck.source.firstTabOnly, true, 'a first-tab-only deck is marked as such');
eq(oneTabDeck.source.detail, 'first tab only · no key needed', 'the deck says it only has the first tab');
ok(!/\d+ tabs\b/.test(oneTabDeck.source.warnings.join(' ')) || !/\(1 tabs\)/.test(oneTabDeck.source.warnings.join(' ')),
  'never says “1 tabs”');

// A hand-written tab list is remembered, so the sheet keeps working from a bare link.
Util.lsRemove('tablist');
await Sources.load({ mode: 'links', links: sheetLine + '\nUnit 1\nUnit 2' }, null, null);
eq(Sources.cachedTabs('abcdefghijklmnopqrstuvwx'), ['Unit 1', 'Unit 2'],
  'explicit tab names are remembered per sheet');

// …and so is the topic list of the last deck, for sheets cached before this feature.
Util.lsRemove('tablist');
Util.lsRemove('deck');
Util.lsSet('deck', {
  source: { mode: 'links', sheetId: 'abcdefghijklmnopqrstuvwx' },
  topics: [{ name: 'Unit 1', words: [] }, { name: 'Unit & 2', words: [] }]
});
fetchRoutes = [
  ['export?format=xlsx', blockExport],
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['sheet=Unit%20%26%202', () => fakeResponse(toCsv([['Vocab', 'Vietnamese'], ['chat', 'mèo']]))]
];
const rememberedDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
eq(rememberedDeck.topics.length, 2, 'a blocked tab list reuses the last deck’s topics');
ok(rememberedDeck.source.warnings.some((w) => /remembered list for this sheet \(2 tabs\)/.test(w)), 'the reuse is reported');
ok(/remembered for this sheet/.test(rememberedDeck.source.detail), 'the deck says where the tab list came from');
// A different sheet must never reuse another sheet's tabs.
eq(Sources.lastDeckTabs('zzzzzzzzzzzzzzzzzzzzzzzz'), null, 'the last deck is only reused for the same sheet');
// A degraded load must never be mistaken for a tab list (it caused "…used the tab
// list from the last load (1 tabs)" and kept the app stuck on the first tab).
Util.lsRemove('tablist');
Util.lsSet('deck', {
  source: { mode: 'links', sheetId: 'abcdefghijklmnopqrstuvwx', firstTabOnly: true },
  topics: [{ name: 'Topic 1', words: [] }, { name: 'Topic 2', words: [] }]
});
eq(Sources.lastDeckTabs('abcdefghijklmnopqrstuvwx'), null, 'a first-tab-only deck is not a tab list');
Util.lsSet('deck', {
  source: { mode: 'links', sheetId: 'abcdefghijklmnopqrstuvwx' },
  topics: [{ name: 'Topic 1', words: [] }]
});
eq(Sources.lastDeckTabs('abcdefghijklmnopqrstuvwx'), null, 'a one-topic deck is not a tab list');
Util.lsRemove('deck');
Util.lsSet('tablist', { abcdefghijklmnopqrstuvwx: ['Topic 1'] });
eq(Sources.pickRemembered(Sources.cachedTabs('abcdefghijklmnopqrstuvwx'), 'abcdefghijklmnopqrstuvwx'), null,
  'a one-tab remembered list is not reused');
fetchRoutes = [
  ['export?format=xlsx', blockExport],
  ['gviz/tq', () => fakeResponse(firstTabCsv)]
];
const oneTabAgain = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
ok(oneTabAgain.source.warnings.some((w) => /loaded the first tab only/.test(w)),
  'so the honest “first tab only” note is shown instead');
Util.lsRemove('tablist');

/* ---------- online tab list (r.jina.ai) for pages Google refuses (file://) ---------- */
section('Sources — online tab list');

// Google's htmlview page lists each tab as items.push({name: "…"}) with JS escapes.
const htmlViewHtml = 'x;items.push({name: "Unit 1", pageUrl: "https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/abc\\/htmlview\\/sheet?headers\\x3dtrue&gid=2", gid: "2",initialSheet: (false)});'
  + 'items.push({name: "Unit \\x26 2", pageUrl: "https:\\/\\/x", gid: "3"});'
  + 'items.push({name: "Unit 1", gid: "4"});';
eq(Sources.parseHtmlViewNames(htmlViewHtml), ['Unit 1', 'Unit & 2'],
  'htmlview: tab names parsed, JS escapes decoded, duplicates dropped');
eq(Sources.parseHtmlViewNames('<html>nothing here</html>'), [], 'htmlview: a page without tabs yields no names');

Util.lsRemove('tablist');
Util.lsRemove('deck');
fetchRoutes = [
  ['export?format=xlsx', blockExport],
  ['r.jina.ai', () => fakeResponse(htmlViewHtml)],
  ['sheet=Unit%201', () => fakeResponse(firstTabCsv)],
  ['sheet=Unit%20%26%202', () => fakeResponse(toCsv([['Vocab', 'Vietnamese'], ['chat', 'mèo']]))]
];
const onlineDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
eq(onlineDeck.topics.length, 2, 'a blocked export is retried through the online reader');
eq(onlineDeck.source.detail, 'tabs listed online (r.jina.ai) · no key needed',
  'the deck says the tab list came from the online reader');
eq(Sources.cachedTabs('abcdefghijklmnopqrstuvwx'), ['Unit 1', 'Unit & 2'],
  'the online tab list is remembered for next time');

// An HTTP error means the sheet is not readable (wrong link / not shared) — that
// must not be sent to the third-party reader.
Util.lsRemove('tablist');
Util.lsRemove('deck');
let onlineAsked = false;
fetchRoutes = [
  ['export?format=xlsx', () => fakeResponse('nope', 403)],
  ['r.jina.ai', () => { onlineAsked = true; return fakeResponse(htmlViewHtml); }],
  ['gviz/tq', () => fakeResponse(firstTabCsv)]
];
const notSharedDeck = await Sources.load({ mode: 'links', links: sheetLine }, null, null);
ok(!onlineAsked, 'an unreadable sheet is not sent to the online reader');
eq(notSharedDeck.source.firstTabOnly, true, 'it still reports the first tab only');
eq(Sources.cachedTabs('abcdefghijklmnopqrstuvwx'), null, 'and remembers nothing');
Util.lsRemove('tablist');

/* ---------- JSONP fallback (browsers that block fetch: file://, blockers) ---------- */
section('Sources — script-tag (JSONP) fallback');

eq(Sources.gvizTable({ table: { cols: [{ label: 'Vocab' }, { label: 'Vietnamese' }], rows: [{ c: [{ v: 'chat' }, { v: 'mèo' }] }] } }),
  { header: ['Vocab', 'Vietnamese'], values: [['chat', 'mèo']] }, 'gvizTable turns a JSONP table into header + rows');

const blockFetch = () => { throw new TypeError('Failed to fetch'); };

// The callback URL must keep the other gviz parameters — a malformed
// "gviz/tq&sheet=X?tqx=…" returns 404, so every named tab failed silently.
eq(Sources.jsonpUrl('https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv', 'cb'),
  'https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=responseHandler:cb',
  'jsonp url: no-tab link keeps working');
eq(Sources.jsonpUrl('https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv&sheet=Unit%201', 'cb'),
  'https://docs.google.com/spreadsheets/d/abc/gviz/tq?sheet=Unit%201&tqx=responseHandler:cb',
  'jsonp url: sheet name stays a query parameter');
eq(Sources.jsonpUrl('https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv&gid=7', 'cb'),
  'https://docs.google.com/spreadsheets/d/abc/gviz/tq?gid=7&tqx=responseHandler:cb',
  'jsonp url: gid stays a query parameter');
eq(Sources.jsonpUrl('https://docs.google.com/spreadsheets/d/abc/gviz/tq', 'cb'),
  'https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=responseHandler:cb',
  'jsonp url: no query at all');
const jsonpNamed = Sources.jsonpUrl('https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv&sheet=Unit%201', 'cb');
ok((jsonpNamed.match(/\?/g) || []).length === 1 && /&tqx=responseHandler:cb$/.test(jsonpNamed),
  'jsonp url: exactly one “?”, callback last');

jsonpHandler = (src) => (/gviz\/tq\?sheet=Unit%201&tqx=responseHandler:/.test(src)
  ? { table: { cols: [{ label: 'Vocab' }, { label: 'Vietnamese' }], rows: [{ c: [{ v: 'gare' }, { v: 'nhà ga' }] }] } }
  : null);

fetchRoutes = [['sheet=Unit%201', blockFetch]];
const jsonpDeck = await Sources.load({ mode: 'links', links: sheetLine + '\nUnit 1' }, null, null);
eq(jsonpDeck.topics.length, 1, 'blocked fetch is retried with a <script> tag');
eq(jsonpDeck.topics[0].words[0].term, 'gare', 'words come through the JSONP fallback');
eq(jsonpDeck.source.warnings, undefined, 'JSONP success is silent');

fetchRoutes = [['export?format=xlsx', blockFetch], ['gviz/tq', blockFetch]];
const otherSheet = 'https://docs.google.com/spreadsheets/d/zzzzzzzzzzzzzzzzzzzzzzzz/edit';
jsonpHandler = () => null;
let jsonpErr = null;
try { await Sources.load({ mode: 'links', links: otherSheet }, null, null); } catch (e) { jsonpErr = e; }
ok(jsonpErr && /python3 -m http\.server/.test(jsonpErr.friendly), 'all-blocked load explains the local-server fix');
ok(jsonpErr && /Anyone with the link/.test(jsonpErr.friendly), 'all-blocked load also mentions sheet sharing');
jsonpHandler = null;

/* ---------- Apps Script mode ---------- */
section('Sources — Apps Script mode');
fetchRoutes = [
  ['script.google.com', () => fakeResponse(JSON.stringify({
    topics: [{ title: 'Only tab', values: [['Vocab', 'Vietnamese'], ['gare', 'nhà ga']] }]
  }))]
];
const scriptDeck = await Sources.load({ mode: 'script', scriptUrl: 'https://script.google.com/macros/s/AKfy/exec' }, null, null);
eq(scriptDeck.topics.length, 1, 'Apps Script topics are read');
eq(scriptDeck.wordCount, 1, 'Apps Script words are read');
eq(scriptDeck.source.detail, '1 tab', 'Apps Script mode never says “1 tabs”');

/* ---------- makeDeck ---------- */
section('Deck assembly');
const deck = Sources.makeDeck([
  { name: 'Travel', words: [{ term: 'a', meaning: 'x' }] },
  { name: 'Travel', words: [{ term: 'b', meaning: 'y' }] },
  { name: 'Empty', words: [] }
], { mode: 'demo', label: 't', detail: 'd' });
eq(deck.topics.length, 2, 'makeDeck drops empty topics');
eq(deck.topics[0].id !== deck.topics[1].id, true, 'makeDeck dedupes ids');
eq(deck.wordCount, 2, 'makeDeck word count');

/* ---------- demo deck ---------- */
section('Demo deck');
const demo = DemoDeck.load();
eq(demo.topics.length, 3, 'demo topics');
eq(demo.wordCount, 36, 'demo word count');
ok(demo.topics.every((t) => t.words.every((w) => w.term && w.meaning)), 'demo words complete');

/* ---------- generator ---------- */
section('Built-in generator');
const pool = Quiz.flattenDeck(demo, null);
const word = pool.find((w) => w.term === 'gare');
const mc = Gen.build(word, 'mc', 'term2meaning', pool);
eq(mc.options.length, 4, 'MC has 4 options');
ok(mc.options.includes(mc.answer), 'MC answer among options');
eq(mc.answer, 'nhà ga', 'MC answer is the meaning');
ok(new Set(mc.options).size === 4, 'MC options unique');
const mcB = Gen.build(word, 'mc', 'meaning2term', pool);
eq(mcB.prompt, 'nhà ga', 'MC meaning2term prompt is the meaning');

const blank = Gen.build(word, 'blank', 'term2meaning', pool);
eq(blank.prompt, 'Le train part de la gare à huit heures.'.replace('gare', '___'), 'blank uses example sentence');
eq(blank.answer, 'gare', 'blank answer is the term');

const blank2 = Gen.build(pool.find((w) => w.term === "l'entrée" || w.term === 'entrée'), 'blank', 'term2meaning', pool);
eq(blank2.prompt, "L'___ est une salade.", 'blank cloze works after an apostrophe');

const noEx = Gen.build({ term: 'tâche', meaning: 'nhiệm vụ', example: '' }, 'blank', 'term2meaning', pool);
eq(noEx.prompt.replace(/ /g, ''), 't____', 'blank falls back to spelling mask (accented word)');
eq(noEx.answer, 'tâche', 'spelling mask answer');

const tr = Gen.build(word, 'translate', 'term2meaning', pool);
eq(tr.prompt, 'gare', 'translate t→m prompt');
eq(tr.answer, 'nhà ga', 'translate t→m answer');
const tr2 = Gen.build(word, 'translate', 'meaning2term', pool);
eq(tr2.prompt, 'nhà ga', 'translate m→t prompt');
eq(tr2.answer, 'gare', 'translate m→t answer');

/* A wrong multiple-choice pick should still teach: “you picked x — it means y”. */
eq(Quiz.counterpart('nhà ga', 'term2meaning', pool), ['gare'], 'term2meaning pick → its term');
eq(Quiz.counterpart('gare', 'meaning2term', pool), ['nhà ga'], 'meaning2term pick → its meaning');
eq(Quiz.counterpart('nha ga', 'term2meaning', pool), ['gare'], 'pick matched without diacritics');
eq(Quiz.counterpart('zzz', 'term2meaning', pool), [], 'unknown pick has no translation');
eq(Quiz.counterpart('', 'term2meaning', pool), [], 'empty pick has no translation');

const tiny = [{ term: 'a', meaning: 'x' }];
eq(Gen.build(tiny[0], 'mc', 'term2meaning', tiny), null, 'MC impossible with tiny pool → null');

/* The reported bug: a sheet whose words share almost the same meaning. No
   distractor may be a near-synonym of the answer. */
const clashPool = [
  { term: 'avoir un impact sur', meaning: 'có tác động đến', pos: 'loc. v.', topicId: 't1' },
  { term: 'avoir des effets positifs (sur)', meaning: 'tác động tích cực (đến)', pos: 'loc. v.', topicId: 't1' },
  { term: 'agir sur', meaning: 'tác động đến', pos: 'v.t.i.', topicId: 't1' },
  { term: 'affecter', meaning: 'ảnh hưởng, tác động đến', pos: 'v.t.', topicId: 't1' },
  { term: 'influencer', meaning: 'ảnh hưởng, tác động lên', pos: 'v.t.', topicId: 't1' },
  { term: 'provoquer', meaning: 'làm phát sinh, dẫn đến', pos: 'v.t.', topicId: 't1' },
  { term: 'nuire à', meaning: 'gây hậu quả xấu (đến)', pos: 'v.t.i.', topicId: 't1' },
  { term: 'le tourisme', meaning: 'ngành du lịch', pos: 'n.m.', topicId: 't1' },
  { term: "l'environnement", meaning: 'môi trường', pos: 'n.m.', topicId: 't1' },
  { term: 'la santé', meaning: 'sức khỏe', pos: 'n.f.', topicId: 't1' },
  { term: 'la crise', meaning: 'cuộc khủng hoảng', pos: 'n.f.', topicId: 't1' }
];
const clashWord = clashPool[0];
const clashMc = Gen.build(clashWord, 'mc', 'term2meaning', clashPool);
ok(clashMc, 'MC is still possible with clashing meanings');
ok(clashMc.options.every((o) => o === clashMc.answer || !Util.tooSimilarMeaning(o, clashMc.answer)),
  'no near-synonym option is offered');
ok(!clashMc.options.includes('tác động tích cực (đến)'), 'the reported ambiguous option is gone');
ok(!clashMc.options.includes('ảnh hưởng, tác động đến'), 'the other near-synonym is gone as well');

const clashMcB = Gen.build(clashWord, 'mc', 'meaning2term', clashPool);
ok(clashMcB, 'MC meaning2term is still possible');
ok(!clashMcB.options.includes('avoir des effets positifs (sur)'), 'near-synonym term is not offered');
ok(!clashMcB.options.includes('agir sur'), 'the word that shares its meaning is not offered');

/* ---------- grading ---------- */
section('Grading');
const qT = { type: 'translate', answer: 'nhà ga' };
eq(Quiz.grade(qT, 'nhà ga').verdict, 'correct', 'exact Vietnamese match');
eq(Quiz.grade(qT, '  NHÀ GA. ').verdict, 'correct', 'case/punctuation insensitive');
eq(Quiz.grade(qT, 'nha ga').verdict, 'accent', 'missing Vietnamese accents → accent verdict');
eq(Quiz.grade(qT, 'nhà gà').verdict, 'accent', 'wrong tone mark → accent verdict');
eq(Quiz.grade(qT, 'nhà ba').verdict, 'close', 'letter typo → close');
eq(Quiz.grade(qT, 'hello').verdict, 'wrong', 'wrong answer');

const qE = { type: 'translate', answer: 'gare' };
eq(Quiz.grade(qE, 'GARE').verdict, 'correct', 'French case-insensitive');
eq(Quiz.grade(qE, 'gaare').verdict, 'close', 'French typo → close');
eq(Quiz.grade(qE, '').verdict, 'wrong', 'empty → wrong');
const qAlt = { type: 'translate', answer: 'văn phòng / bàn làm việc' };
eq(Quiz.grade(qAlt, 'bàn làm việc').verdict, 'correct', 'slash alternative accepted');
eq(Quiz.grade(qAlt, 'van phong').verdict, 'accent', 'slash alternative without accents → accent');

// Meanings are often comma lists with a bracketed clarification.
const qList = { type: 'translate', answer: 'làm tổn hại, đe dọa (kết quả, sự công bằng)' };
eq(Quiz.grade(qList, 'làm tổn hại').verdict, 'correct', 'first of a comma list accepted');
eq(Quiz.grade(qList, 'đe dọa').verdict, 'correct', 'second of a comma list accepted');
eq(Quiz.grade(qList, 'lam ton hai').verdict, 'accent', 'comma-list item, accents missing → accent');
eq(Quiz.grade(qList, 'làm tổn hại, đe dọa').verdict, 'correct', 'synonyms listed by the learner accepted');
eq(Quiz.grade(qList, 'làm tổn hại, xyz').verdict, 'wrong', 'a wrong extra item is not accepted');
eq(Quiz.grade(qList, 'kết quả').verdict, 'wrong', 'bracketed clarification is not a synonym');
eq(Quiz.grade({ type: 'translate', answer: 'nhà ga (gare)' }, 'nhà ga').verdict, 'correct', 'bracketed gloss ignored');
eq(Quiz.grade({ type: 'blank', answer: 'la gare, le train' }, 'le train').verdict, 'correct', 'fill-in-the-blank list');

const qMcVariant = { type: 'mc', answer: 'làm tổn hại, đe dọa (kết quả)', options: ['làm tổn hại', 'sân bay'] };
eq(Quiz.grade(qMcVariant, 'làm tổn hại').verdict, 'correct', 'MC option equal to a listed alternative');
ok(Quiz.sameAnswer('nhà ga', 'nhà ga'), 'sameAnswer: identical');
ok(!Quiz.sameAnswer('nhà ga', 'sân bay'), 'sameAnswer: different');
ok(Quiz.sameAnswer('văn phòng', 'văn phòng / bàn làm việc'), 'sameAnswer: alternative');

const qMc = { type: 'mc', answer: 'nhà ga', options: ['nhà ga', 'sân bay'] };
eq(Quiz.grade(qMc, 'nhà ga').verdict, 'correct', 'MC correct');
eq(Quiz.grade(qMc, 'sân bay').verdict, 'wrong', 'MC wrong');

/* ---------- AI parsing ---------- */
section('AI response parsing');
eq(Ai.parseJsonLoose('```json\n{"questions":[]}\n```'), { questions: [] }, 'parse fenced JSON');
eq(Ai.parseJsonLoose('Here you go: {"a":1} — enjoy!'), { a: 1 }, 'parse JSON inside prose');
eq(Ai.parseJsonLoose('{"a": [1,2,], }'), { a: [1, 2] }, 'parse JSON with trailing commas');

const items = [
  { term: 'gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' },
  { term: 'billet', meaning: 'vé', type: 'blank', direction: 'blank' }
];
const normalized = Ai.normalizeQuestions({
  questions: [
    { type: 'mc', direction: 'term2meaning', term: 'gare', prompt: 'gare', options: ['a', 'b', 'c'], answer: 'nhà ga', explanation: 'x' },
    { type: 'blank', term: 'billet', prompt: "J'ai acheté un billet aller-retour.", hint: 'Meaning: vé', answer: 'billet' },
    { type: 'mc', term: 'nonexistent', prompt: 'x', options: ['a', 'b', 'c'], answer: 'a' }
  ]
}, items);
eq(normalized.length, 2, 'unknown term dropped');
eq(normalized[0].options.length, 4, 'MC missing answer option gets fixed');
ok(normalized[0].options.includes('nhà ga'), 'fixed MC contains the answer');
eq(normalized[1].prompt.includes('___'), true, 'blank without ___ gets auto-blanked');
eq(normalized[1].direction, 'blank', 'blank direction kept');

const flipped = Ai.normalizeQuestions({
  questions: [{ type: 'mc', term: 'gare', prompt: 'x', options: ['a', 'b', 'c', 'gare'], answer: 'gare' }]
}, [{ term: 'gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' }]);
eq(flipped[0].direction, 'meaning2term', 'direction auto-flips when answer is the term');

/* An AI-made MC may offer a near-synonym; it must be peeled off, and the item
   is dropped when nothing but near-synonyms is left (built-in takes over). */
const aiItems = [{ term: 'avoir un impact sur', meaning: 'có tác động đến', type: 'mc', direction: 'term2meaning' }];
const peeled = Ai.normalizeQuestions({
  questions: [{
    type: 'mc', direction: 'term2meaning', term: 'avoir un impact sur', prompt: 'avoir un impact sur',
    options: ['có tác động đến', 'tác động tích cực (đến)', 'làm phát sinh, dẫn đến', 'gây hậu quả xấu (đến)'],
    answer: 'có tác động đến'
  }]
}, aiItems);
eq(peeled.length, 1, 'AI MC kept after peeling a near-synonym option');
eq(peeled[0].options.length, 3, 'near-synonym option dropped (4 → 3)');
ok(peeled[0].options.includes('có tác động đến'), 'the answer survives the peel');
ok(!peeled[0].options.includes('tác động tích cực (đến)'), 'the ambiguous option is removed');

const starved = Ai.normalizeQuestions({
  questions: [{
    type: 'mc', direction: 'term2meaning', term: 'avoir un impact sur', prompt: 'avoir un impact sur',
    options: ['có tác động đến', 'tác động tích cực (đến)', 'ảnh hưởng, tác động đến', 'tác động đến'],
    answer: 'có tác động đến'
  }]
}, aiItems);
eq(starved.length, 0, 'AI MC rejected when only near-synonyms remain');

/* The reported bug: an OpenAI-compatible provider gets “json_object” but no
   schema, so the prompt itself has to state the shape; and a reply that still
   deviates must be understood or retried, not turned into “unexpected shape”. */
const prompt = Ai.buildPrompt([{ term: 'gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' }],
  'French', 'Vietnamese');
ok(/"questions"/.test(prompt.user) && /"term"/.test(prompt.user) && /"options"/.test(prompt.user),
  'the prompt spells out the exact JSON shape');
ok(/one object per ITEM/.test(prompt.user), 'it says how many objects to return');
ok(/no code fences/i.test(prompt.user), 'it forbids code fences');
ok(/Difficulty: standard \(A2–B2\)/.test(prompt.user) && /6–14 words/.test(prompt.user),
  'without a choice, questions use the standard level');

const easyPrompt = Ai.buildPrompt(
  [{ term: 'gare', meaning: 'nhà ga', type: 'blank', direction: 'blank' }],
  'French', 'Vietnamese', { difficulty: 'easy', requirement: 'Talk about a train station.' });
ok(/Difficulty: easy \(A1–A2\)/.test(easyPrompt.user) && /5–9 words/.test(easyPrompt.user),
  'easy questions ask for short A1–A2 sentences');
ok(/EXTRA REQUEST FROM THE LEARNER[\s\S]*train station/.test(easyPrompt.user),
  'the learner\'s optional focus reaches the question prompt');
const hardPrompt = Ai.buildPrompt(
  [{ term: 'gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' }],
  'French', 'Vietnamese', { difficulty: 'hard' });
ok(/Difficulty: hard \(B1–C1\)/.test(hardPrompt.user) && /10–20 words/.test(hardPrompt.user),
  'hard questions ask for longer B1–C1 sentences');
ok(!/EXTRA REQUEST FROM THE LEARNER/.test(hardPrompt.user),
  'an empty focus adds no extra-request block');

const shapeItems = [
  { term: 'la gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' },
  { term: 'le billet', meaning: 'vé', type: 'translate', direction: 'term2meaning' }
];
const altNames = Ai.normalizeQuestions({
  items: [
    { type: 'multiple_choice', word: 'gare', question: 'la gare', choices: ['nhà ga', 'vé', 'hành lý', 'sân bay'], correct: 'nhà ga' },
    { kind: 'translation', word: 'billet', prompt: 'le billet', answer: 'vé' }
  ]
}, shapeItems);
eq(altNames.length, 2, 'alternate field names and a dropped article are understood');
eq(altNames[0].type, 'mc', '“multiple_choice” maps to mc');
eq(altNames[0].term, 'la gare', '“gare” still matches “la gare”');
eq(altNames[1].type, 'translate', '“translation” maps to translate');

const nestedEnvelope = Ai.normalizeQuestions({
  quiz: { questions: [{ type: 'mc', term: 'la gare', prompt: 'la gare', options: ['a', 'b', 'c', 'nhà ga'], answer: 'nhà ga' }] }
}, shapeItems);
eq(nestedEnvelope.length, 1, 'a nested envelope is unwrapped');

const noTerm = Ai.normalizeQuestions({
  questions: [{ type: 'mc', prompt: 'la gare', options: ['a', 'b', 'c', 'nhà ga'], answer: 'nhà ga' }]
}, shapeItems);
eq(noTerm.length, 1, 'a reply without “term” is placed by its prompt');
eq(noTerm[0].term, 'la gare', 'and lands on the right item');

const doubleJson = Ai.normalizeQuestions(JSON.stringify({
  questions: [{ type: 'mc', term: 'la gare', prompt: 'la gare', options: ['a', 'b', 'c', 'nhà ga'], answer: 'nhà ga' }]
}), shapeItems);
eq(doubleJson.length, 1, 'double-encoded JSON is unwrapped');

/* A first reply that cannot be used is retried once, colder and with more room. */
const oneItem = [{ term: 'gare', meaning: 'nhà ga', type: 'mc', direction: 'term2meaning' }];
let repairCalls = [];
aiFetch = async function (url, opts) {
  const body = JSON.parse(opts.body || '{}');
  repairCalls.push(body);
  if (repairCalls.length === 1) {
    return fakeResponse(JSON.stringify({
      choices: [{ message: { content: 'Sorry, here are your words: gare, billet.' } }]
    }), 200);
  }
  return fakeResponse(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({
      questions: [{ type: 'mc', direction: 'term2meaning', term: 'gare', prompt: 'gare', options: ['a', 'b', 'c', 'nhà ga'], answer: 'nhà ga', explanation: 'x' }]
    }) } }]
  }), 200);
};
const recovered = await Ai.generateQuestions({
  provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'openai/gpt-oss-120b',
  items: oneItem, targetLang: 'French', meaningLang: 'Vietnamese'
});
eq(recovered.length, 1, 'a second, explicit request recovers the batch');
eq(repairCalls.length, 2, 'exactly one repair attempt');
ok(/could not be used/.test(repairCalls[1].messages[1].content), 'the repair says what was wrong');
eq(repairCalls[1].temperature, 0.2, 'the repair is colder');
eq(repairCalls[1].max_tokens, 8192, 'the repair has more room');
ok(repairCalls[0].temperature === 0.8, 'the first request uses the normal temperature');

/* When even that fails: a message that explains it, not “unexpected shape”. */
let flatCalls = [];
aiFetch = async function (url, opts) {
  flatCalls.push(JSON.parse(opts.body || '{}'));
  return fakeResponse(JSON.stringify({ choices: [{ message: { content: 'I could not comply.' } }] }), 200);
};
let unusable = null;
try {
  await Ai.generateQuestions({
    provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'grok-4.7',
    items: oneItem, targetLang: 'French', meaningLang: 'Vietnamese'
  });
} catch (e) { unusable = e; }
ok(!!unusable, 'an unusable reply still fails so the built-in generator can take over');
ok(unusable && /not in the JSON shape/.test(unusable.friendly), 'the message says what went wrong');
ok(unusable && /grok-4\.7/.test(unusable.friendly), 'the message names the model to change');
ok(!/It began with/.test(unusable.friendly), 'the toast stays short');
ok(unusable && /It began with/.test(unusable.detail), 'the Settings box shows the start of the reply for diagnosis');
eq(unusable && unusable.raw, 'I could not comply.', 'the raw reply is kept');
eq(flatCalls.length, 2, 'one retry, then give up');
aiFetch = null;

/* ---------- OpenAI-compatible provider helpers ---------- */
section('OpenAI-compatible helpers');
const reqBody = Ai.oai.buildBody({ model: 'openrouter/free', system: 'sys', user: 'usr', jsonMode: true });
eq(reqBody.model, 'openrouter/free', 'body carries the model id');
eq(reqBody.messages.length, 2, 'system + user messages');
eq(reqBody.messages[0].role, 'system', 'first message is the system prompt');
eq(reqBody.messages[1].content, 'usr', 'user content passed through');
eq(reqBody.response_format, { type: 'json_object' }, 'json mode sets response_format');
ok(!('response_format' in Ai.oai.buildBody({ model: 'm', system: 's', user: 'u', jsonMode: false })), 'no response_format without json mode');
const freeBody = Ai.oai.buildBody({ model: 'openai-fast', system: 's', user: 'u', keyless: true });
eq(freeBody.reasoning_effort, 'low', 'the keyless reasoning model is asked to think less');
ok(freeBody.max_tokens >= 8192, '…and gets room for a 20-word batch');
ok(!('reasoning_effort' in reqBody), 'other providers are left untouched');
eq(Ai.oai.extractText({ choices: [{ message: { content: '{"a":1}' }, finish_reason: 'stop' }] }).text, '{"a":1}', 'extracts choices[0].message.content');
eq(Ai.oai.extractText({ choices: [{ message: { content: '', reasoning_content: 'thought text' } }] }).text, 'thought text', 'falls back to reasoning_content');
let emptyThrew = false;
try { Ai.oai.extractText({ choices: [{ message: { content: '' }, finish_reason: 'length' }] }); } catch (e) { emptyThrew = true; }
ok(emptyThrew, 'empty answer throws (so the built-in generator can step in)');
let noChoicesThrew = false;
try { Ai.oai.extractText(null); } catch (e) { noChoicesThrew = true; }
ok(noChoicesThrew, 'missing choices throws');
ok(Ai.isLocalBaseUrl('http://localhost:11434/v1'), 'localhost base detected');
ok(Ai.isLocalBaseUrl('http://127.0.0.1:1234/v1'), '127.0.0.1 base detected');
ok(!Ai.isLocalBaseUrl('https://api.groq.com/openai/v1'), 'remote host is not local');
eq(Ai.normalizeBaseUrl('https://api.groq.com/openai/v1///'), 'https://api.groq.com/openai/v1', 'trailing slashes trimmed from base URL');
const oaiHeaders = Ai.oai.headers('https://openrouter.ai/api/v1', 'sk-or-x');
eq(oaiHeaders.Authorization, 'Bearer sk-or-x', 'bearer token attached');
ok(!('Authorization' in Ai.oai.headers('http://localhost:11434/v1', '')), 'no auth header for keyless local server');
const sortedOai = Ai.oai.sortModels([
  { id: 'meta-llama/llama-3.3-70b-instruct:free' },
  { id: 'openrouter/free' },
  { id: 'openai/gpt-oss-120b' }
]);
eq(sortedOai[0].id, 'openrouter/free', 'openrouter/free ranks first');
eq(Ai.pickDefaultModel([{ id: 'some/small-model' }, { id: 'x/y:free' }], 'openai'), 'x/y:free', 'openai default prefers :free models');
eq(Ai.pickDefaultModel([], 'openai'), 'openrouter/free', 'openai default without a model list');
eq(Ai.pickDefaultModel([{ id: 'gemini-2.5-flash' }, { id: 'gemini-2.5-pro' }], 'gemini'), 'gemini-2.5-flash', 'gemini default unchanged');

/* ---------- Keys copied from the wrong dashboard ---------- */
section('API keys');
eq(Ai.normalizeKey('  AIzaSyDemo  '), 'AIzaSyDemo', 'surrounding spaces dropped');
eq(Ai.normalizeKey('"gsk_demo"'), 'gsk_demo', 'quotes from a web page dropped');
eq(Ai.normalizeKey('Bearer gsk_demo'), 'gsk_demo', 'a pasted “Bearer ” prefix is dropped');
eq(Ai.normalizeKey('Bearer: "gsk_demo"\n'), 'gsk_demo', '“Bearer:”, quotes and a newline all peel off');
eq(Ai.normalizeKey('gsk_de\u200Bmo'), 'gsk_demo', 'invisible characters removed');
eq(Ai.normalizeKey(null), '', 'a missing key is an empty string');
eq(Ai.oai.headers('https://api.groq.com/openai/v1', 'Bearer  "gsk_x" ').Authorization, 'Bearer gsk_x',
  'the request always carries the cleaned key');
eq(Ai.keyFormat('groq'), 'gsk_…', 'Groq says what its keys look like');
eq(Ai.keyFormat('mistral'), '', 'no invented format for providers we cannot verify');
eq(Ai.providerForBase('https://api.groq.com/openai/v1/').id, 'groq', 'a base URL identifies its provider');
eq(Ai.providerForBase('http://127.0.0.1:11434/v1').id, 'ollama', 'a local base URL identifies Ollama');
eq(Ai.providerForBase('https://together.example/v1'), null, 'a custom base URL belongs to no known provider');
const wrongKey = Ai.keyShapeWarning('groq', 'sk-or-v1-abcdef');
ok(/OpenRouter/.test(wrongKey) && /Groq/.test(wrongKey), 'an OpenRouter key in the Groq field names both providers');
ok(/console\.groq\.com\/keys/.test(wrongKey), 'the warning says where the right key comes from');
eq(Ai.keyShapeWarning('groq', 'gsk_aRealLookingGroqKey'), '', 'a matching key raises nothing');
eq(Ai.keyShapeWarning('openrouter', 'sk-or-v1-abcdef'), '', 'an OpenRouter key on OpenRouter is fine');
ok(/OpenRouter/.test(Ai.keyShapeWarning('deepseek', 'sk-or-v1-abcdef')),
  'its own prefix (“sk-”) does not shadow the provider that really issued it');
eq(Ai.keyShapeWarning('deepseek', 'sk-0123456789abcdef'), '', 'a DeepSeek key on DeepSeek is fine');
eq(Ai.keyShapeWarning('openai', 'sk-or-v1-abcdef'), '', 'a custom endpoint never second-guesses the key');

/* The reported bug: a key from a similarly named site, pasted into Groq. */
const grokKey = 'grok_' + '1'.repeat(32) + '_' + '2'.repeat(64);
const grokIssue = Ai.keyShapeWarning('groq', grokKey);
ok(/gsk_/.test(grokIssue), 'a "grok_…" key on Groq says what a Groq key starts with');
ok(/56/.test(grokIssue) && /102/.test(grokIssue), 'it compares the real length with the expected one');
ok(/different service/.test(grokIssue), 'it says the key came from a different service');
ok(/console\.groq\.com\/keys/.test(grokIssue), 'it points at the console the key has to come from');
eq(Ai.keyShapeWarning('xai', 'xai-' + 'a'.repeat(80)), '', 'an xAI key on xAI is fine');
ok(/xAI Grok/.test(Ai.keyShapeWarning('groq', 'xai-' + 'a'.repeat(80))),
  'an xAI Grok key in the Groq field names xAI Grok');
eq(Ai.providerById('xai').base, 'https://api.x.ai/v1', 'xAI base URL');
eq(Ai.providerById('xai').keyPrefix, 'xai-', 'xAI key prefix');
eq(Ai.keyFormat('xai'), 'xai-…', 'xAI says what its keys look like');
ok(/Gemini/.test(Ai.keyShapeWarning('groq', 'AIzaSyDemo')), 'a Gemini key in the Groq field is named');
ok(/space or line break/.test(Ai.keyShapeWarning('groq', 'gsk_a b')), 'an embedded space is called out');
const aiSrc = fs.readFileSync(path.join(root, 'js/ai.js'), 'utf8');
ok(/rejected this key \(401\/403\)/.test(aiSrc) && /providerForBase\(opts\.base/.test(aiSrc),
  'a 401 names the provider whose dashboard issued the key');
// Groq really answers 401 “Invalid API Key”; that reason must reach the learner.
aiFetch = async function () { return fakeResponse(JSON.stringify({ error: { message: 'Invalid API Key' } }), 401); };
let keyErr = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'sk-or-v1-nope' }); }
catch (e) { keyErr = e; }
ok(keyErr && /Groq rejected this key \(401\/403\)/.test(keyErr.friendly), 'the 401 says which provider refused it');
ok(keyErr && /Invalid API Key/.test(keyErr.friendly), "the provider's own reason is shown, not hidden");
ok(keyErr && /console\.groq\.com\/keys/.test(keyErr.friendly), 'the 401 links to a fresh key');
ok(keyErr && /gsk_/.test(keyErr.friendly), 'the 401 says what a Groq key looks like');
aiFetch = null;

/* ---------- AI transport errors (the “Ollama without a key” report) ---------- */
section('AI transport errors');
// Nothing listening on the port: the message must say to start the server.
aiFetch = async function () { throw new Error('connect ECONNREFUSED'); };
let deadErr = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'http://127.0.0.1:11434/v1', key: '' }); }
catch (e) { deadErr = e; }
ok(!!deadErr, 'a keyless local provider is still contacted (no key required)');
ok(deadErr && deadErr.hint === 'offline', 'a dead local server is reported as offline');
ok(deadErr && /nothing is running there/.test(deadErr.friendly), 'a dead local server says nothing is on that port');
ok(deadErr && /not a web service/.test(deadErr.friendly), 'the message is explicit that Ollama is a local program');
ok(deadErr && /ollama\.com\/download/.test(deadErr.friendly), 'the message links to the Ollama download');
ok(deadErr && /ollama serve/.test(deadErr.friendly), 'the fix says to run “ollama serve”');
ok(deadErr && /ollama pull llama3\.2/.test(deadErr.friendly), 'the fix names the model to pull');
ok(deadErr && /http:\/\/127\.0\.0\.1:11434\/api\/tags/.test(deadErr.friendly), 'the message gives a way to verify by hand');
ok(deadErr && /Built-in/.test(deadErr.friendly), 'the message offers the built-in generator as a way out');

// Something answered in no-cors mode → the server is up, the browser was blocked.
aiFetch = async function (url, opts) {
  if (opts && opts.mode === 'no-cors') return { ok: true, status: 0, type: 'opaque' };
  throw new Error('TypeError: Failed to fetch');
};
let corsErr = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'http://localhost:11434/v1', key: '' }); }
catch (e) { corsErr = e; }
ok(corsErr && corsErr.hint === 'cors', 'a server that answers but refuses the page is reported as a CORS block');
ok(corsErr && /OLLAMA_ORIGINS=\*/.test(corsErr.friendly), 'the CORS fix mentions OLLAMA_ORIGINS=*');
ok(corsErr && /python3 -m http\.server/.test(corsErr.friendly), 'the CORS fix suggests serving the folder over http');
ok(corsErr && !/ollama serve/.test(corsErr.friendly), 'a reachable server is not told to start Ollama');

// A model that was never pulled (Ollama answers 404).
aiFetch = async function () {
  return fakeResponse(JSON.stringify({ error: { message: 'model "llama3.2" not found, try pulling it first' } }), 404);
};
let modelErr = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'http://localhost:11434/v1', key: '' }); }
catch (e) { modelErr = e; }
ok(modelErr && /ollama pull llama3\.2/.test(modelErr.friendly), 'a 404 from a local server says which model to pull');
ok(modelErr && /try pulling it first/.test(modelErr.friendly), 'the provider’s own wording is kept in the message');

// A remote provider that answers but sends no CORS headers gets its own advice.
aiFetch = async function (url, opts) {
  if (opts && opts.mode === 'no-cors') return { ok: true, status: 0, type: 'opaque' };
  throw new Error('TypeError: Failed to fetch');
};
let blockedRemote = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x' }); }
catch (e) { blockedRemote = e; }
ok(blockedRemote && blockedRemote.hint === 'cors', 'a remote host that answers but blocks the page is reported as CORS');
ok(blockedRemote && /allows them|Gemini, Groq, OpenRouter/.test(blockedRemote.friendly) && !/OLLAMA_ORIGINS/.test(blockedRemote.friendly),
  'a blocked remote provider is pointed at providers that allow browser calls');

// A remote provider keeps the generic network advice.
aiFetch = async function () { throw new Error('offline'); };
let remoteErr = null;
try { await Ai.listModels({ provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x' }); }
catch (e) { remoteErr = e; }
ok(remoteErr && remoteErr.hint === 'unreachable', 'a remote host is reported as unreachable');
ok(remoteErr && /internet connection/.test(remoteErr.friendly), 'the remote advice mentions the connection');
aiFetch = null;

/* The keyless provider (Simple mode): its own /models URL, no Authorization
   header, and only the tier that works without a key. */
const freeDef = Ai.providerById('pollinations');
ok(freeDef && freeDef.keyless === true, 'the free provider is marked keyless');
eq(freeDef && freeDef.base, 'https://text.pollinations.ai/openai', 'the free provider speaks the OpenAI shape');
eq(freeDef && freeDef.modelsUrl, 'https://text.pollinations.ai/models', 'its model list lives beside /openai');
let freeReq = null;
aiFetch = async function (url, opts) {
  freeReq = { url: String(url), headers: (opts && opts.headers) || {} };
  return fakeResponse(JSON.stringify([
    { name: 'openai-fast', tier: 'anonymous' },
    { name: 'seed-only', tier: 'seed' },
    { name: 'openai', tier: 'anonymous', aliases: ['gpt-oss'] }
  ]), 200);
};
const freeModels = await Ai.listModels({ provider: 'openai', key: '', baseUrl: freeDef.base });
eq(freeModels.map((m) => m.id), ['openai', 'openai-fast'], 'keyless mode lists only models usable without a key');
eq(freeReq && freeReq.url, 'https://text.pollinations.ai/models', 'keyless mode asks the provider’s own model list URL');
ok(freeReq && !freeReq.headers.Authorization, 'keyless requests send no Authorization header');

aiFetch = async function () {
  return fakeResponse(JSON.stringify({ error: { message: 'queue is full' } }), 429);
};
let busyErr = null;
try { await Ai.listModels({ provider: 'openai', key: '', baseUrl: freeDef.base }); }
catch (e) { busyErr = e; }
ok(busyErr && /free AI is busy/.test(busyErr.friendly), 'a busy free service says so, instead of “rate limit by this provider”');
ok(busyErr && /Advanced/.test(busyErr.friendly), '…and points at the own-key mode as the way out');

let freeWait = null;
aiFetch = async function () {
  return fakeResponse(JSON.stringify({
    error: { message: 'Free limit reached: 1 reply every 30 seconds per IP.' }
  }), 402, { 'retry-after': '1' });
};
let freeLimit = null;
try {
  await Ai.generateQuestions({
    provider: 'openai', baseUrl: freeDef.base, key: '', model: 'openai-fast', items: oneItem,
    targetLang: 'French', meaningLang: 'Vietnamese',
    onWait: (ms) => { freeWait = ms; }
  });
} catch (e) { freeLimit = e; }
eq(freeWait, 1000, 'the free-slot wait is reported to the UI');
ok(freeLimit && /one request every 30 seconds/.test(freeLimit.friendly),
  'a 402 free-slot limit is explained as the free service’s own rule');
ok(freeLimit && !/OpenRouter/.test(freeLimit.friendly), '…and not mistaken for OpenRouter credits');
aiFetch = null;

/* ---------- planning + session ---------- */
section('Planning & session');
const plan = Quiz.planItems(pool.slice(0, 6), ['mc', 'blank', 'translate'], 'mixed', 0);
eq(plan.map((i) => i.type), ['mc', 'blank', 'translate', 'mc', 'blank', 'translate'], 'round-robin types');
eq(plan[0].direction, 'term2meaning', 'mixed direction even index');
eq(plan[3].direction, 'meaning2term', 'mixed direction odd index');
const plan2 = Quiz.planItems(pool.slice(0, 4), ['translate'], 'm2t', 0);
ok(plan2.every((i) => i.direction === 'meaning2term'), 'fixed m2t direction');
const plan3 = Quiz.planItems(pool.slice(0, 4), ['blank'], 'mixed', 0);
ok(plan3.every((i) => i.direction === 'blank'), 'blank plan direction');

/* Paragraphs are one card each, planned from 12 candidate words — never one
   per word, and never mixed into the word round-robin. */
const pp = Quiz.planParagraphs(pool, 2, 'fr2vi');
eq(pp.length, 2, 'two paragraph cards planned');
ok(pp.every((i) => i.type === 'paragraph' && i.direction === 'fr2vi'), 'fixed paragraph direction');
eq(pp[0].candidates.length, 12, 'twelve candidate words per paragraph');
eq(pp[1].term, 'Paragraph 2', 'paragraphs get distinct labels');
eq(Quiz.planItems(pool, ['paragraph'], 'mixed', 0).length, 0, 'a paragraph consumes no word slot');
ok(Quiz.planItems(pool, ['mc', 'paragraph'], 'mixed', 0).every((i) => i.type === 'mc'),
  'the word planner ignores the paragraph type');
eq(Quiz.planParagraphs(pool, 2, 'both').map((i) => i.direction), ['fr2vi', 'vi2fr'], '“both” alternates');
eq(Quiz.planParagraphs(pool.slice(0, 5), 1, 'both').length, 0, 'too few words → no paragraph');
// The two paragraphs must not reuse the same candidate words.
const overlap = pp[0].candidates.filter((w) => pp[1].candidates.some((x) => x.term === w.term));
eq(overlap.length, 0, 'paragraphs draw from different words');

eq(Quiz.selectWords(pool, 0).length, pool.length, 'count 0 → all words');
eq(Quiz.selectWords(pool, 5).length, 5, 'count 5 → 5 words');

/* ---------- full pipeline (builtin) ---------- */
section('Full quiz pipeline (built-in)');
const items2 = Quiz.planItems(pool.slice(0, 8), ['mc', 'blank', 'translate'], 'mixed', 0);
const built = await Quiz.buildPool({
  items: items2, pool: pool, source: 'builtin', aiKey: '', aiModel: '',
  targetLang: 'English', meaningLang: 'Vietnamese'
});
eq(built.questions.length, 8, 'one question per item');
ok(built.questions.every((q) => q.id && q.word && q.answer), 'questions carry id + word + answer');
ok(built.questions.filter((q) => q.type === 'mc').every((q) => q.options.length >= 3), 'all MC have ≥3 options');
const session = Quiz.makeSession(built.questions, 0);
eq(session.length, 8, 'session has all questions');

let score = 0;
for (const q of session) {
  const res = Quiz.grade(q, q.answer);
  if (res.verdict === 'correct' || res.verdict === 'accent') score++;
  Quiz.recordAnswer(q, res.verdict === 'correct' || res.verdict === 'accent');
}
eq(score, 8, 'every question gradable from its own answer');
eq(Quiz.getStats().answers, 8, 'stats recorded');
eq(Quiz.getStats().correct, 8, 'stats correct count');
ok(Quiz.masteredCount([pool[0]]) === 0, 'single answer does not mark mastered');

/* Typed questions: when the sheet gives another word the same meaning, either
   wording is accepted — the learner is never told a correct answer is wrong. */
const clashTr = await Quiz.buildPool({
  items: Quiz.planItems([clashPool[0]], ['translate'], 't2m', 0), pool: clashPool, source: 'builtin'
});
const trQ = clashTr.questions[0];
ok(Array.isArray(trQ.also) && trQ.also.length > 0, 'a shared meaning lists what else counts');
ok(trQ.also.indexOf('tác động đến') !== -1, '…the twin meaning from the sheet among them');
eq(Quiz.grade(trQ, trQ.also[0]).verdict, 'correct', 'the twin wording is graded correct');
ok(/both count/.test(Quiz.grade(trQ, trQ.also[0]).note), 'the note explains why it was accepted');
eq(Quiz.grade(trQ, 'môi trường').verdict, 'wrong', 'an unrelated answer is still wrong');

const clashTr2 = await Quiz.buildPool({
  items: Quiz.planItems([clashPool[0]], ['translate'], 'm2t', 0), pool: clashPool, source: 'builtin'
});
ok(clashTr2.questions[0].also.indexOf('agir sur') !== -1, 'the word sharing the meaning is accepted too');
eq(Quiz.grade(clashTr2.questions[0], 'agir sur').verdict, 'correct', 'grading the twin term is correct');

/* A model (or a question cached before this fix) can still hand us options that
   mean the same thing as the answer. The pipeline peels them off before the
   learner ever sees the question. */
const aiJson = (questions) => fakeResponse(JSON.stringify({
  choices: [{ message: { content: JSON.stringify({ questions: questions }) }, finish_reason: 'stop' }]
}), 200);
const aiOpts = {
  pool: clashPool, source: 'ai', aiProvider: 'openai',
  aiBaseUrl: 'https://api.example.test/v1', aiKey: 'test-key', aiModel: 'test-model',
  targetLang: 'French', meaningLang: 'Vietnamese'
};
const notAmbiguous = (q) => q.options.every((o) => Quiz.sameAnswer(o, q.answer) || !Util.tooSimilarMeaning(o, q.answer));
/* Every option must be a word the sheet defines, so it can be shown with its
   translation under it after answering — and so the learner can look it up. */
const onSheet = (q, words) => q.options.every((o) =>
  words.some((w) => Quiz.sameAnswer(w.term, o) || Quiz.sameAnswer(w.meaning, o)));
const translatable = (q, words) => q.options.every((o) => Quiz.counterpart(o, q.direction, words).length > 0);

fetchRoutes = [['/chat/completions', () => aiJson([
  { type: 'mc', direction: 'term2meaning', term: 'avoir un impact sur', prompt: 'avoir un impact sur',
    options: ['có tác động đến', 'tác động tích cực (đến)', 'làm phát sinh, dẫn đến', 'gây hậu quả xấu (đến)'],
    answer: 'có tác động đến', explanation: 'x' }
])]];
const aiBuilt = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[0]], ['mc'], 't2m', 0)
}));
eq(aiBuilt.questions.length, 1, 'AI question kept');
eq(aiBuilt.questions[0].options.length, 4, 'peeled option is refilled with a sheet word (4 → 4)');
ok(aiBuilt.questions[0].options.indexOf('tác động tích cực (đến)') === -1, 'the near-synonym itself is gone');
ok(notAmbiguous(aiBuilt.questions[0]), 'no ambiguous option survives the pipeline');
ok(onSheet(aiBuilt.questions[0], clashPool), 'every option is a word the sheet defines');
ok(translatable(aiBuilt.questions[0], clashPool), 'every option can be translated under it');

fetchRoutes = [['/chat/completions', () => aiJson([
  { type: 'mc', direction: 'meaning2term', term: 'avoir un impact sur', prompt: 'có tác động đến',
    options: ['avoir un impact sur', 'agir sur', 'affecter', 'provoquer'], answer: 'avoir un impact sur' }
])]];
const aiBuilt2 = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[0]], ['mc'], 'm2t', 0)
}));
const q2 = aiBuilt2.questions[0];
eq(q2.type, 'mc', 'a fair question still comes out when the AI options are all synonyms');
ok(q2.options.length >= 3 && notAmbiguous(q2), 'repaired question is unambiguous');
ok(!q2.options.includes('agir sur') && !q2.options.includes('affecter'),
  'words that share the meaning are not offered');
ok(onSheet(q2, clashPool) && translatable(q2, clashPool),
  'the synonym slots are refilled with translatable sheet words');

/* A question cached before this fix (the learner's browser) is repaired on the
   way out, so an old ambiguous question can never be replayed. */
fetchRoutes = [['/chat/completions', () => aiJson([
  { type: 'mc', direction: 'term2meaning', term: 'provoquer', prompt: 'provoquer',
    options: ['làm phát sinh, dẫn đến', 'gây hậu quả xấu (đến)', 'môi trường', 'sức khỏe'],
    answer: 'làm phát sinh, dẫn đến', explanation: 'x' }
])]];
const primed2 = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[5]], ['mc'], 't2m', 0)
}));
ok(primed2.questions[0].options.includes('môi trường'), 'clean AI question is cached');

const qcache = JSON.parse(store.get('vocablab.qcache'));
const cachedEntry = Object.keys(qcache).map((k) => qcache[k]).find((e) => e.q.term === 'provoquer');
cachedEntry.q.options = ['làm phát sinh, dẫn đến', 'dẫn đến', 'môi trường', 'sức khỏe'];
store.set('vocablab.qcache', JSON.stringify(qcache));

const repaired = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[5]], ['mc'], 't2m', 0)
}));
eq(repaired.swapped, 1, 'a stale cached question is repaired instead of replayed');
eq(repaired.questions[0].options.length, 4, 'the ambiguous cached option is replaced (4 → 4)');
ok(repaired.questions[0].options.indexOf('dẫn đến') === -1, 'the ambiguous cached option is gone');
ok(notAmbiguous(repaired.questions[0]), 'repaired question is unambiguous');
ok(onSheet(repaired.questions[0], clashPool) && translatable(repaired.questions[0], clashPool),
  'repaired options are sheet words with translations');

cachedEntry.q.options = ['làm phát sinh, dẫn đến', 'dẫn đến', 'phát sinh'];
store.set('vocablab.qcache', JSON.stringify(qcache));
const repaired2 = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[5]], ['mc'], 't2m', 0)
}));
ok(repaired2.questions[0].options.length >= 3 && notAmbiguous(repaired2.questions[0]),
  'repaired cached question is unambiguous');
ok(onSheet(repaired2.questions[0], clashPool) && translatable(repaired2.questions[0], clashPool),
  'a cached question left with only synonyms is refilled with sheet words');

/* The reported bug: the model wrote options that are not in the sheet at all
   («garder», «fermer»), so nothing could be shown under them after answering and
   the learner met words they cannot look up. Such options are now swapped for
   real sheet words, and every option keeps its translation. */
fetchRoutes = [['/chat/completions', () => aiJson([
  { type: 'mc', direction: 'term2meaning', term: 'avoir un impact sur', prompt: 'avoir un impact sur',
    options: ['có tác động đến', 'garder', 'fermer', 'gây hậu quả xấu (đến)'],
    answer: 'có tác động đến', explanation: 'x' }
])]];
const invented = await Quiz.buildPool(Object.assign({}, aiOpts, {
  items: Quiz.planItems([clashPool[0]], ['mc'], 't2m', 0)
}));
const invQ = invented.questions[0];
eq(invQ.options.length, 4, 'invented options are replaced, not dropped (4 → 4)');
ok(invQ.options.indexOf('garder') === -1 && invQ.options.indexOf('fermer') === -1, 'invented words are gone');
ok(onSheet(invQ, clashPool), 'every option is a word the sheet defines');
ok(translatable(invQ, clashPool), 'every option has a translation to show under it');
eq(invQ.options.filter((o) => Quiz.sameAnswer(o, invQ.answer)).length, 1, 'exactly one option is the answer');
eq(Quiz.grade(invQ, invQ.answer).verdict, 'correct', 'the repaired question is still gradable');
ok(typeof Gen.pickDistractors === 'function', 'Gen exports pickDistractors for the repair');

fetchRoutes = [];

/* ---------- paragraph translation ---------- */
section('Paragraph translation');
/** A whole chat-completion reply whose content is the given JSON object. */
const aiObj = (obj) => fakeResponse(JSON.stringify({
  choices: [{ message: { content: JSON.stringify(obj) }, finish_reason: 'stop' }]
}), 200);

const paraPrompt = Ai.buildParagraphPrompt({
  direction: 'fr2vi', words: pool.slice(0, 8), targetLang: 'French', meaningLang: 'Vietnamese'
});
ok(/"paragraph"/.test(paraPrompt.user) && /"reference"/.test(paraPrompt.user) && /"keywords"/.test(paraPrompt.user),
  'the paragraph prompt states the JSON shape');
ok(/5–6/.test(paraPrompt.user), 'it asks for 5–6 sheet words');
ok(/French paragraph/.test(paraPrompt.user), 'FR→VI writes the source in French');
ok(/reference.*Vietnamese|Vietnamese translation/.test(paraPrompt.user), 'and gives a Vietnamese reference');
const paraPromptVi = Ai.buildParagraphPrompt({
  direction: 'vi2fr', words: pool.slice(0, 8), targetLang: 'French', meaningLang: 'Vietnamese'
});
ok(/Vietnamese paragraph/.test(paraPromptVi.user), 'VI→FR writes the source in Vietnamese');
ok(/produce the French/.test(paraPromptVi.user), 'and the learner must produce French');

const paraEasy = Ai.buildParagraphPrompt({
  direction: 'fr2vi', words: pool.slice(0, 8), targetLang: 'French', meaningLang: 'Vietnamese',
  difficulty: 'easy', requirement: 'Talk about a weekend market.'
});
ok(/3–4 sentences, 40–70 words, CEFR A1–A2/.test(paraEasy.user),
  'easy paragraphs are shorter and simpler');
ok(/Pick 4–5 words/.test(paraEasy.user), 'easy paragraphs require fewer sheet words');
ok(/TOPIC OR FOCUS REQUESTED BY THE LEARNER[\s\S]*weekend market/.test(paraEasy.user),
  'the learner\'s optional focus reaches the paragraph prompt');
const paraHard = Ai.buildParagraphPrompt({
  direction: 'fr2vi', words: pool.slice(0, 8), targetLang: 'French', meaningLang: 'Vietnamese',
  difficulty: 'hard'
});
ok(/6–8 sentences, 90–150 words, CEFR B1–C1/.test(paraHard.user),
  'hard paragraphs are longer and richer');
ok(/Pick 5–6 words/.test(paraHard.user), 'hard paragraphs still cap the required words');

const fixPrompt = Ai.buildCorrectionPrompt({
  direction: 'fr2vi', source: 'Les habitants constatent que la pollution augmente.',
  reference: 'Người dân nhận thấy ô nhiễm gia tăng.', userText: 'Les habitant constate que pollution augmente.',
  keywords: [{ term: 'constater', meaning: 'nhận thấy' }], targetLang: 'French', meaningLang: 'Vietnamese'
});
ok(/smallest possible change/.test(fixPrompt.system + ' ' + fixPrompt.user),
  'the corrector is told to change as little as possible');
ok(/REFERENCE is only a guide/.test(fixPrompt.user), 'the reference is a guide, not the required answer');
ok(/subject pronoun/.test(fixPrompt.user) && /tense or mood/.test(fixPrompt.user),
  'the learner may choose their own pronoun and tense');
ok(/Never “correct” any of those/.test(fixPrompt.user),
  'and those legitimate choices must not be “corrected”');
ok(/not agree with the subject the learner actually wrote/.test(fixPrompt.user),
  'agreement is checked against the learner’s own subject');
ok(/never write a note whose "fix" is the same as its "text"/.test(fixPrompt.user),
  'no note is written when nothing changed');
ok(/must convey the ideas of the SOURCE/.test(fixPrompt.user) &&
  /Each required word that the learner does not use costs 10 points/.test(fixPrompt.user),
  'the score drops for meaning errors and missing required words');
ok(/do not replace a correct phrase with more elegant wording/.test(fixPrompt.user),
  'and never to restyle a correct phrase');
ok(/LEARNER'S TRANSLATION/.test(fixPrompt.user) && /REFERENCE TRANSLATION/.test(fixPrompt.user),
  'the corrector sees both the learner’s text and the reference');
ok(/"corrected"/.test(fixPrompt.user) && /"notes"/.test(fixPrompt.user), 'the correction shape is stated');

const kwWords = [
  { term: 'constater', meaning: 'nhận thấy' },
  { term: 'la pollution', meaning: 'ô nhiễm' },
  { term: 'aggraver', meaning: 'làm trầm trọng' }
];
const parsedPara = Ai.normalizeParagraph({
  paragraph: 'Les habitants constatent que la pollution augmente.',
  reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
  keywords: [
    { term: 'constater', meaning: 'nhận thấy', note: 'constater que + clause' },
    { term: 'LA POLLUTION', meaning: 'ô nhiễm' },
    { term: 'inconnu', meaning: 'không có trong sheet' },
    { term: 'pollution', meaning: 'ô nhiễm' },
    { term: 'aggraver', meaning: 'làm trầm trọng' }
  ]
}, kwWords);
eq(parsedPara.keywords.length, 3, 'unknown keywords are dropped and duplicates merged');
eq(parsedPara.keywords[1].term, 'la pollution', 'the sheet spelling wins over the model’s');
eq(parsedPara.keywords[0].note, 'constater que + clause', 'the usage note is kept');
eq(Ai.normalizeParagraph({ paragraph: 'x', reference: '', keywords: [] }, kwWords), null,
  'a paragraph without a reference is unusable');
eq(Ai.normalizeParagraph({ paragraph: '', reference: 'y', keywords: [] }, kwWords), null,
  'a paragraph without text is unusable');

const parsedFix = Ai.normalizeCorrection({
  score: 84,
  corrected: 'Les habitants constatent que la pollution augmente.',
  notes: [
    { text: 'les habitant', fix: 'les habitants', why: 'plural' },
    'Missing « la » before pollution.',
    { text: '', fix: '', why: '' }
  ],
  used: ['constater'],
  comment: 'Nice work.'
}, kwWords.slice(0, 2), { direction: 'fr2vi', userText: 'Les habitant constatent que pollution augmente.' });
eq(parsedFix.score, 84, 'the score is kept');
eq(parsedFix.verdict, 'good', 'the verdict follows the score');
eq(parsedFix.notes.length, 2, 'string notes are kept, empty notes dropped');
eq(parsedFix.corrected, 'Les habitants constatent que la pollution augmente.', 'the corrected text is kept');
eq(parsedFix.used.filter((u) => u.used).map((u) => u.term), ['constater'], 'used words come from the model');
eq(Ai.normalizeCorrection({ score: 999, corrected: 'x', used: [] }, kwWords, { direction: 'fr2vi', userText: '' }).score,
  100, 'the score is clamped');
eq(Ai.normalizeCorrection({ correct: 'x' }, kwWords, {}), null, 'a reply without corrected text is unusable');
const sameNote = Ai.normalizeCorrection({
  score: 55, corrected: 'Les habitants constatent la pollution et cela peut aggraver la situation.',
  notes: [{ text: 'constatent', fix: 'constatent', why: 'no-op' }]
}, kwWords, {
  direction: 'vi2fr',
  userText: 'Les habitants constatent la pollution et cela peut aggraver la situation.'
});
eq(sameNote.notes.length, 0, 'a note that changes nothing is dropped');
eq(sameNote.score, 100, '…and unchanged text with all required words scores 100, not the model’s guess');
const missingWord = Ai.normalizeCorrection({
  score: 55, corrected: 'Les habitants constatent.',
  notes: []
}, kwWords, { direction: 'vi2fr', userText: 'Les habitants constatent.' });
eq(missingWord.score, 80, 'missing required words cost points even when the wording needs no fix');
eq(missingWord.verdict, 'good', '…but two missing words is not a failed answer');
const unrelated = Ai.normalizeCorrection({
  score: 95, corrected: 'Đây là một câu không liên quan.',
  notes: []
}, kwWords, { direction: 'fr2vi', userText: 'Đây là một câu không liên quan.' });
eq(unrelated.score, 70, 'a text that uses none of the required words loses 10 points per word');
const dupNotes = Ai.normalizeCorrection({
  score: 70, corrected: 'Les habitants constatent.',
  notes: [{ text: 'habitant', fix: 'habitants', why: 'plural' },
    { text: 'habitant', fix: 'habitants', why: 'plural again' }]
}, kwWords, { direction: 'vi2fr', userText: 'Les habitant constatent.' });
eq(dupNotes.notes.length, 1, 'the same fix is only listed once');
// Without the model’s “used” list, the app still marks the words it can see.
const localUsed = Ai.normalizeCorrection({ score: 40, corrected: 'y' }, kwWords,
  { direction: 'vi2fr', userText: 'Les habitants constatent la pollution.' });
eq(localUsed.used.map((u) => u.used), [true, true, false], 'used words fall back to a local check');
// A word that is plainly in the text is never reported as missing, even when
// the model forgot it — a wrong ✗ is the kind of unfairness that demotivates.
const generous = Ai.normalizeCorrection({ score: 88, corrected: 'x', used: [] }, kwWords.slice(0, 2),
  { direction: 'vi2fr', userText: 'Les habitants constatent la pollution.' });
eq(generous.used.map((u) => u.used), [true, true], 'the model cannot mark a used word as missing');
eq(localUsed.verdict, 'weak', 'a low score is a weak verdict');

// The two AI jobs, end to end through the OpenAI-compatible transport.
let paraCalls = 0;
fetchRoutes = [['/chat/completions', () => {
  paraCalls++;
  return aiObj({
    paragraph: 'Les habitants constatent que la pollution augmente.',
    reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
    keywords: [
      { term: 'constater', meaning: 'nhận thấy', note: 'constater que + clause' },
      { term: 'la pollution', meaning: 'ô nhiễm', note: '' },
      { term: 'aggraver', meaning: 'làm trầm trọng', note: '' }
    ]
  });
}]];
const paraOut = await Ai.generateParagraph({
  provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'openai/gpt-oss-120b',
  direction: 'fr2vi', words: kwWords, targetLang: 'French', meaningLang: 'Vietnamese'
});
ok(paraOut && paraOut.paragraph.indexOf('constatent') !== -1, 'generateParagraph returns the text');
eq(paraOut.keywords[0].term, 'constater', '…with sheet keywords');
eq(paraCalls, 1, 'one call when the reply is usable');

let fixCalls = 0;
fetchRoutes = [['/chat/completions', () => {
  fixCalls++;
  return aiObj({
    score: 78, corrected: 'Les habitants constatent que la pollution augmente.',
    notes: [{ text: 'les habitant', fix: 'les habitants', why: 'plural' }],
    used: ['constater', 'la pollution'], comment: 'Nearly there.'
  });
}]];
const fixOut = await Ai.correctParagraph({
  provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'grok-4.7',
  direction: 'fr2vi', source: 'Les habitants constatent que la pollution augmente.',
  reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
  userText: 'Les habitant constatent que la pollution augmente.',
  keywords: kwWords, targetLang: 'French', meaningLang: 'Vietnamese'
});
eq(fixOut.score, 78, 'correctParagraph returns a score');
eq(fixOut.used.filter((u) => u.used).length, 2, '…and the used words');
eq(fixOut.notes[0].fix, 'les habitants', '…and the minimal fixes');
eq(fixCalls, 1, 'one call when the correction is usable');

// An unusable correction is asked for once more, then fails loudly (never silently).
let badFixCalls = 0;
fetchRoutes = [['/chat/completions', () => {
  badFixCalls++;
  return aiObj({ comment: 'I cannot help with that.' });
}]];
let fixErr = null;
try {
  await Ai.correctParagraph({
    provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'grok-4.7',
    direction: 'fr2vi', source: 's', reference: 'r', userText: 'u', keywords: kwWords
  });
} catch (e) { fixErr = e; }
ok(!!fixErr, 'an unusable correction throws');
ok(fixErr && fixErr.paragraph, '…marked as a paragraph failure by the app');
eq(badFixCalls, 2, '…after exactly one repair attempt');
fetchRoutes = [];

// buildPool: a paragraph is one AI call, never a built-in stand-in.
const realGenerateParagraph = Ai.generateParagraph;
let paraGenCalls = 0;
Ai.generateParagraph = async function () {
  paraGenCalls++;
  return {
    paragraph: 'Les habitants constatent que la pollution augmente.',
    reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
    keywords: kwWords
  };
};
const paraItems = Quiz.planParagraphs(pool, 1, 'fr2vi');
const paraBuilt = await Quiz.buildPool({
  items: paraItems, pool: pool, source: 'ai', aiKey: 'gsk_x', aiModel: 'm',
  aiProvider: 'openai', aiBaseUrl: 'https://api.groq.com/openai/v1',
  targetLang: 'French', meaningLang: 'Vietnamese'
});
eq(paraBuilt.questions.length, 1, 'the paragraph card is built');
eq(paraBuilt.questions[0].type, 'paragraph', '…of the paragraph type');
eq(paraBuilt.questions[0].direction, 'fr2vi', '…with its direction');
eq(paraBuilt.questions[0].keywords.length, 3, '…and its required words');
eq(paraBuilt.questions[0].word.term, 'Paragraph 1', '…and a label for the results screen');
eq(paraGenCalls, 1, 'exactly one AI call per paragraph');

Ai.generateParagraph = async function () {
  throw Object.assign(new Error('unusable'), { paragraph: true, friendly: 'The model answered oddly.' });
};
const paraFailed = await Quiz.buildPool({
  items: Quiz.planParagraphs(pool, 1, 'both'), pool: pool, source: 'ai', aiKey: 'gsk_x', aiModel: 'm',
  aiProvider: 'openai', aiBaseUrl: 'https://api.groq.com/openai/v1'
});
eq(paraFailed.questions.length, 0, 'a failed paragraph is left out — no fake built-in text');
ok(paraFailed.aiError && paraFailed.aiError.paragraph, '…and the error says it was the paragraph');

const paraNoAi = await Quiz.buildPool({
  items: Quiz.planParagraphs(pool, 1, 'both'), pool: pool, source: 'builtin'
});
eq(paraNoAi.questions.length, 0, 'a paragraph is never synthesised offline');
ok(paraNoAi.aiError && /needs AI/.test(paraNoAi.aiError.friendly), '…and the caller is told why');

// Simple mode must work with no key at all: the provider itself is keyless.
Ai.generateParagraph = async function () {
  return {
    paragraph: 'Les habitants constatent que la pollution augmente.',
    reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
    keywords: kwWords
  };
};
const paraKeyless = await Quiz.buildPool({
  items: Quiz.planParagraphs(pool, 1, 'fr2vi'), pool: pool, source: 'auto',
  aiProvider: 'openai', aiBaseUrl: 'https://text.pollinations.ai/openai',
  aiKey: '', aiKeyless: true, aiModel: 'openai-fast'
});
eq(paraKeyless.questions.length, 1, 'Simple mode generates AI content without any key');
Ai.generateParagraph = realGenerateParagraph;

eq(Quiz.typeLabel('paragraph'), 'Paragraph translation', 'paragraph has its own type label');
eq(Quiz.AI_BATCH_FREE, 20, 'the keyless free service gets bigger batches (fewer 30-second waits)');

section('App wiring');
const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSrc = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

const elsBlock = appSrc.match(/function cacheEls\(\)[\s\S]*?;\n/)[0];
const declared = [...elsBlock.matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
const usedIds = [...new Set([...appSrc.matchAll(/E\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))];
const missingInHtml = declared.filter((id) => htmlSrc.indexOf('id="' + id + '"') === -1);
const notDeclared = usedIds.filter((id) => declared.indexOf(id) === -1);
eq(missingInHtml, [], 'every cached element id exists in index.html');
eq(notDeclared, [], 'every E.* element is declared in cacheEls()');

// The session owns the question index — a stale `state.index` read made every
// answer throw ("Cannot read properties of undefined") and look un-clickable.
ok(!/\bstate\.index\b/.test(appSrc), 'app.js reads the question index from state.session');

// A deck that loads with notes shows one message, not a success toast + a warning toast.
ok(/setDeck\(deck, \{ silent: warnings\.length > 0 \}\)/.test(appSrc), 'deck notes suppress the separate success toast');
ok(/renderSheetWarnings\(warnings\)/.test(appSrc), 'loading notes are also listed in Settings');
ok(/id="sheetWarnings"/.test(htmlSrc), 'Settings has a persistent notes box');

// An AI failure keeps its “what to do about it” text in Settings → AI (and the
// toast keeps a short line), instead of being cut down to one unhelpful line.
ok(/function showAiIssue\(/.test(appSrc) && /showAiIssue\((?:err\.detail \|\| )?detail[,)]/.test(appSrc),
  'an AI failure is kept in Settings → AI');
ok(/id="aiIssue"/.test(htmlSrc), 'Settings has a box for the full AI error');
ok(/function useKeyProvider\(/.test(appSrc) && /'btnAiUseKey'/.test(appSrc),
  'a dead local provider can be swapped for a key-based one in one click');
ok(/\.notice-issue \{/.test(cssSrc) && /white-space: pre-line/.test(cssSrc),
  'the AI error box keeps its line breaks');
ok(/AI generation issue — built-in questions cover the rest\.\\n' \+ detail/.test(appSrc),
  'the AI error toast keeps its how-to-fix lines');
ok(/function toast\(message, kind, ms\)/.test(fs.readFileSync(path.join(root, 'js/util.js'), 'utf8')),
  'toasts accept a custom lifetime for long messages');
ok(/isLocalBaseUrl\(settings\.oaiBase\)[\s\S]{0,400}OLLAMA_ORIGINS/.test(appSrc),
  'the Ollama preset explains the CORS requirement');

// Paragraph translation: its own practice mode, card and AI call — and never a
// built-in stand-in, because the exercise only works with a real correction.
ok(/id="segPractice"/.test(htmlSrc) && /data-value="paragraph"/.test(htmlSrc) &&
  /id="paraSetupPane"/.test(htmlSrc) && /id="btnStartParagraph"/.test(htmlSrc),
  'paragraph translation has its own practice tab and start button');
ok(/id="qParagraph"/.test(htmlSrc) && /id="paraInput"/.test(htmlSrc) && /id="btnParaSubmit"/.test(htmlSrc),
  'the quiz screen has a paragraph card with its own textarea and check button');
ok(/async function startParagraphPractice/.test(appSrc) &&
  /planParagraphs\(paraWords, setup\.paragraphCount/.test(appSrc),
  'the paragraph practice plans its own cards');
ok(/Ai\.correctParagraph\(/.test(appSrc) && /function finishParagraph/.test(appSrc),
  'a paragraph answer is corrected by the AI and scored');
ok(/id="paraStartHint"/.test(htmlSrc) && /Paragraph translation needs AI/.test(appSrc),
  'the exercise is disabled — not faked — when AI is unavailable');
ok(!/id="typeParagraph"/.test(htmlSrc) && !/types\.indexOf\('paragraph'\)/.test(appSrc) &&
  /paragraphOnly: true/.test(appSrc),
  'paragraph translation is a separate practice, not a quiz question type');

// Quiz setup: difficulty and an optional focus note, as pill controls.
ok(/id="segDifficulty"/.test(htmlSrc) && /id="selDifficulty"/.test(htmlSrc) &&
  /data-value="easy"/.test(htmlSrc) && /data-value="hard"/.test(htmlSrc),
  'the setup offers Easy / Standard / Hard pills');
ok(/id="inpRequirement"/.test(htmlSrc) && /id="reqChips"/.test(htmlSrc) &&
  /data-fill="travel situations"/.test(htmlSrc),
  'the setup offers an optional focus box with suggestion chips');
ok(/id="moreOptions"/.test(htmlSrc) && /<summary>More options<\/summary>/.test(htmlSrc) &&
  /id="selCount"[^>]*class="input input-sm"/.test(htmlSrc) && !/id="paraOpts"/.test(htmlSrc),
  'count, direction and generator sit in the closed Quiz drawer');
ok(/difficulty: setup\.difficulty/.test(appSrc) && /requirement: setup\.requirement/.test(appSrc),
  'startQuiz sends difficulty and focus to the quiz builder');
const paraStartSrc = appSrc.slice(appSrc.indexOf('async function startParagraphPractice'),
  appSrc.indexOf('function renderQuestion'));
ok(/difficulty: setup\.difficulty/.test(paraStartSrc) && /requirement: setup\.requirement/.test(paraStartSrc),
  'startParagraphPractice sends difficulty and focus to the paragraph AI');
ok(/id="segPractice"[^>]*data-select="selPractice"/.test(htmlSrc) &&
  /settings\.practiceMode = mode === 'paragraph' \? 'paragraph' : 'quiz'/.test(appSrc),
  'the practice tabs persist the chosen mode');
ok(/difficulty: difficulty, requirement: requirement/.test(fs.readFileSync(path.join(root, 'js/quiz.js'), 'utf8')),
  'the quiz builder forwards both to AI question and paragraph calls');
const quizSrc = fs.readFileSync(path.join(root, 'js/quiz.js'), 'utf8');
ok(/difficulty \|\| 'standard'[\s\S]{0,80}requirement \? Util\.hash\(requirement\)/.test(quizSrc),
  'the question cache is separated by difficulty and focus');
ok(/aiMode: 'simple'/.test(appSrc) && /id="paneSimple"/.test(htmlSrc) && /id="modeAdvanced"/.test(htmlSrc),
  'Settings offers Simple (no key) and Advanced (own key)');
ok(/aiKeyless: aiKeyless\(\)/.test(appSrc) && /aiKeyless/.test(fs.readFileSync(path.join(root, 'js/quiz.js'), 'utf8')),
  'Simple mode tells the quiz builder that AI needs no key');
ok(/state\.paraBusy/.test(appSrc) && /if \(q\.type === 'paragraph'\)[\s\S]{0,260}submitParagraph\(\)/.test(appSrc),
  'plain Enter stays in the textarea; Ctrl+Enter checks');

// Settings → AI offers the whole provider list, and the menu is built from that
// one table — so a new provider can never end up missing from the picker.
const provs = Ai.providers;
const provIds = provs.map((p) => p.id);
eq(provIds, ['pollinations', 'gemini', 'groq', 'cerebras', 'openrouter', 'mistral', 'deepseek', 'xai', 'cloudflare', 'ollama', 'openai'],
  'provider list order');
eq(provs.filter((p) => p.transport === 'gemini').map((p) => p.id), ['gemini'], 'only Gemini speaks Google\'s own API');
ok(provs.every((p) => p.label && /^(gemini|openai)$/.test(p.transport)), 'every provider has a label and a transport');
ok(provs.every((p) => p.id === 'gemini' || p.id === 'openai' || /^https?:\/\//.test(p.base)),
  'every named provider has a base URL');
ok(provs.every((p) => p.id === 'openai' || p.cost === 'local' || /^https:\/\//.test(p.keyUrl)),
  'every hosted provider says where to get a key');
eq(Ai.providerById('deepseek').base, 'https://api.deepseek.com/v1', 'DeepSeek preset base URL');
eq(Ai.providerById('deepseek').model, 'deepseek-flash', 'DeepSeek default model');
eq(Ai.providerById('cerebras').base, 'https://api.cerebras.ai/v1', 'Cerebras preset base URL');
eq(Ai.providerById('nope'), null, 'an unknown provider id is not accepted');
ok(/renderProviderOptions\(\)/.test(appSrc) && /PROVIDERS\.forEach/.test(appSrc), 'the picker is built from the provider table');
ok(!/data-base=/.test(htmlSrc) && !/\.preset/.test(appSrc + htmlSrc), 'the old hard-coded preset chips are gone');
ok(/id="providerHint"/.test(htmlSrc), 'Settings explains the selected provider');
ok(/E\.inpGeminiKey\.addEventListener\('input'/.test(appSrc) && /E\.inpOaiKey\.addEventListener\('input'/.test(appSrc),
  'a pasted key counts even if the field never loses focus');
ok(/function useProvider\(/.test(appSrc) && /function loadConn\(/.test(appSrc) && /function rememberConn\(/.test(appSrc),
  'each provider keeps its own key, base URL and model');
ok(/normalizeStoredKeys\(\)/.test(appSrc) && /Ai\.normalizeKey\(settings\.oaiKey\)/.test(appSrc),
  'keys saved before the cleanup are repaired on load, not left to fail');
ok(/Switch to Groq \(free\)/.test(appSrc), 'a provider out of quota offers a one-click switch');
ok(/daily quota per project/.test(appSrc), 'the Gemini hint explains what its free tier really is');
ok(/pick another provider in Settings → AI/.test(fs.readFileSync(path.join(root, 'js/ai.js'), 'utf8')),
  'a 429 tells the learner they can switch provider');

// A multiple-choice pick reveals the translation of every option, and an
// accepted alternative explains why it counted.
ok(/function revealTranslation\(/.test(appSrc) && /revealTranslation\(btn, text, q\.direction\)/.test(appSrc),
  'answering a multiple-choice question reveals each option translation');
ok(/class="opt-main"/.test(appSrc) && /'opt-sub'/.test(appSrc), 'options carry a translation line');
ok(/\.opt-sub \{/.test(cssSrc) && /\.opt-main \{/.test(cssSrc), 'the translation line is styled');
ok(/if \(result\.note\) body \+=/.test(appSrc), 'an accepted-alternative note reaches the feedback');

/* ---------- summary ---------- */
console.log('\n' + '─'.repeat(46));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) {
  console.log('\nFailures:\n' + failures.map((f) => ' · ' + f).join('\n'));
  process.exit(1);
}
