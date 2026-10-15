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
function fakeResponse(body, status = 200) {
  const text = typeof body === 'string' ? body : '';
  const bytes = body instanceof Uint8Array ? body : null;
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => JSON.parse(text),
    arrayBuffer: async () => {
      if (bytes) return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return new TextEncoder().encode(text).buffer;
    }
  };
}
let fetchRoutes = [];
const fetchStub = async function (url) {
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
  fetch: fetchStub,
  document: fakeDocument,
  TextDecoder,
  TextEncoder,
  DecompressionStream,
  Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Promise, Error
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

const tiny = [{ term: 'a', meaning: 'x' }];
eq(Gen.build(tiny[0], 'mc', 'term2meaning', tiny), null, 'MC impossible with tiny pool → null');

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

/* ---------- OpenAI-compatible provider helpers ---------- */
section('OpenAI-compatible helpers');
const reqBody = Ai.oai.buildBody({ model: 'openrouter/free', system: 'sys', user: 'usr', jsonMode: true });
eq(reqBody.model, 'openrouter/free', 'body carries the model id');
eq(reqBody.messages.length, 2, 'system + user messages');
eq(reqBody.messages[0].role, 'system', 'first message is the system prompt');
eq(reqBody.messages[1].content, 'usr', 'user content passed through');
eq(reqBody.response_format, { type: 'json_object' }, 'json mode sets response_format');
ok(!('response_format' in Ai.oai.buildBody({ model: 'm', system: 's', user: 'u', jsonMode: false })), 'no response_format without json mode');
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

/* ---------- UI wiring sanity (js/app.js ↔ index.html) ---------- */
section('App wiring');
const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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

/* ---------- summary ---------- */
console.log('\n' + '─'.repeat(46));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) {
  console.log('\nFailures:\n' + failures.map((f) => ' · ' + f).join('\n'));
  process.exit(1);
}
