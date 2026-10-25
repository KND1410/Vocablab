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
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

/* ---------- sandbox ---------- */
const store = new Map();
const storage = {};
Object.defineProperties(storage, {
  getItem: { value: (k) => (store.has(k) ? store.get(k) : null) },
  setItem: { value: (k, v) => { store.set(k, String(v)); Object.defineProperty(storage, k, { value: String(v), enumerable: true, configurable: true, writable: true }); } },
  removeItem: { value: (k) => { store.delete(k); delete storage[k]; } }
});
/* ---------- fake fetch for link-loading tests ---------- */function fakeResponse(body, status = 200, headers) {
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
  Blob,
  FileReader: class FakeFileReader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = 'data:' + (blob.type || '') + ';base64,' + Buffer.from(buf).toString('base64');
        if (this.onload) this.onload();
      }, (err) => {
        this.error = err;
        if (this.onerror) this.onerror(err);
      });
    }
  },
  DecompressionStream,
  Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Promise, Error,
  URL // browsers always have it; ai.js uses it to name the failing host
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of ['js/util.js', 'js/demo.js', 'js/sources.js', 'js/ai.js', 'js/generator.js', 'js/quiz.js',
  'js/speech.js', 'js/quests.js', 'js/grammar-data.js', 'js/grammar-handbook.js', 'js/grammar.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
}
const { Util, Sources, Gen, Quiz, Ai, DemoDeck, Speech, Quests, GrammarData, GrammarHandbook, Grammar } = sandbox;

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

/* ---------- speech helpers ---------- */
section('Speech helpers');
eq(Speech.splitSentences('Bonjour. Comment ça va ? Très bien !'), ['Bonjour.', 'Comment ça va ?', 'Très bien !'],
  'splitSentences keeps French punctuation');
eq(Speech.splitSentences('  Une seule phrase sans point  '), ['Une seule phrase sans point'],
  'splitSentences keeps a final sentence without punctuation');
Speech.configure({ azureKey: 'abc', azureRegion: 'francecentral', azureVoice: 'fr-FR-HenriNeural', cloudVoice: true });
ok(Speech.isConfigured(), 'Azure is configured when key + region are present');
eq(Speech.voiceFor('fr-FR'), 'fr-FR-HenriNeural', 'the chosen French voice is used for French');
eq(Speech.voiceFor('vi-VN'), 'vi-VN-HoaiMyNeural', 'Vietnamese gets a Vietnamese voice');
eq(Speech.voiceFor('en-US'), 'en-US-JennyNeural', 'English gets an English voice');
eq(Speech.voiceFor('de-DE'), '', 'other target languages let Azure choose a native default');
Speech.configure({ azureKey: 'abc', azureRegion: 'francecentral', cloudVoice: false });
ok(!Speech.enabled(), 'the cloud voice can be turned off without deleting the key');
Speech.configure({});
ok(!Speech.isConfigured() && !Speech.enabled(), 'a missing key disables cloud speech');
const wav = Speech.encodeWav(new Float32Array([0, -1, 1, 0.5]), 16000);
eq(wav.type, 'audio/wav', 'encodeWav returns a WAV blob');
eq(wav.size, 52, 'encodeWav writes a 44-byte header + 16-bit samples');
const wavHead = new Uint8Array(await wav.arrayBuffer()).slice(0, 4);
eq(Array.from(wavHead), [82, 73, 70, 70], 'the WAV starts with RIFF');

/* ---------- local browser voices ---------- */
section('Browser voice picker');
const spoken = [];
sandbox.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};
const browserVoices = [
  { name: 'English (America)', lang: 'en-US', voiceURI: 'en-us' },
  { name: 'French (France)', lang: 'fr-FR', voiceURI: 'fr-espeak' },
  { name: 'Google français', lang: 'fr-FR', voiceURI: 'fr-google' },
  { name: 'French (Belgium)', lang: 'fr-BE', voiceURI: 'fr-be' }
];
sandbox.speechSynthesis = {
  getVoices() { return browserVoices; },
  cancel() { /* ignore */ },
  speak(utter) { spoken.push(utter); }
};
Util.setBrowserVoice('fr-espeak');
ok(Util.browserSpeak('bureau', 'fr-FR', 0.95), 'the local browser voice path starts speech');
eq(spoken[0].voice.voiceURI, 'fr-espeak', 'a saved browser voice is used for a matching language');
spoken.length = 0;
Util.setBrowserVoice('en-us');
Util.browserSpeak('bureau', 'fr-FR', 0.95);
eq(spoken[0].voice.voiceURI, 'fr-google', 'a saved English voice never reads a French prompt');
spoken.length = 0;
Util.setBrowserVoice('');
Util.browserSpeak('bureau', 'fr-FR', 0.95);
eq(spoken[0].voice.voiceURI, 'fr-google', 'automatic mode prefers a natural French voice over eSpeak');
spoken.length = 0;
Util.setBrowserVoice('fr-espeak');
Util.browserSpeak('xin chào', 'vi-VN', 0.95);
eq(spoken[0].voice, undefined, 'a saved French voice is ignored for another language');
Util.setBrowserVoice('');

/* ---------- Gemini pronunciation scoring ---------- */
section('Gemini pronunciation scoring');
const speechPrompt = Ai.buildSpeechPrompt({
  reference: 'Les habitants constatent que la pollution augmente.', lang: 'fr-FR'
});
ok(/Les habitants constatent/.test(speechPrompt.user), 'the scoring prompt includes the reference sentence');
ok(/pronunciation examiner/i.test(speechPrompt.system), 'the scoring system prompt sets the examiner role');
ok(/French pronunciation examiner/.test(speechPrompt.system), 'a BCP-47 target code is named as a language');
ok(/Transcribe exactly what you hear/.test(speechPrompt.user), 'the model is told to transcribe, not correct');
ok(/do not inflate scores|Do not inflate scores/.test(speechPrompt.user), 'the prompt asks for calibrated scores');

const gem = Ai.normalizeSpeechResult({
  transcript: 'Les habitants constatent que la pollution augmente.',
  score: 91.6,
  accuracy: '88',
  fluency: 130,
  completeness: 95,
  words: [
    { word: 'habitants', accuracy: 61.4, errorType: 'Mispronunciation' },
    { word: 'pollution', accuracy: 94, errorType: 'None' },
    { word: '', accuracy: 40 }
  ],
  tips: 'Practise the French “an” sound.'
}, 'Les habitants constatent que la pollution augmente.');
eq(gem.score, 92, 'a Gemini score is rounded');
eq(gem.accuracy, 88, 'string scores become numbers');
eq(gem.fluency, 100, 'scores above 100 are clamped');
eq(gem.completeness, 95, 'completeness survives normalization');
eq(gem.words.length, 2, 'empty word entries are dropped');
eq(gem.words[0], { word: 'habitants', accuracy: 61, errorType: 'Mispronunciation' },
  'word-level details keep their accuracy and error type');
eq(gem.source, 'gemini', 'Gemini results are labelled as such');
eq(gem.recognized, 'Les habitants constatent que la pollution augmente.', 'the transcript is kept as “heard”');
eq(gem.tips, 'Practise the French “an” sound.', 'Gemini tips are passed through');

const gemFallback = Ai.normalizeSpeechResult(
  { transcript: 'Bonjour', accuracy: 80, fluency: 70, completeness: 90, words: [] }, 'Bonjour');
eq(gemFallback.score, 80, 'a missing overall score is averaged from the three metrics');
const gemEmptyWords = Ai.normalizeSpeechResult({ transcript: 'Bonjour', score: 75 }, 'Bonjour');
eq(gemEmptyWords.accuracy, 75, 'missing metrics fall back to the overall score');
ok(gemEmptyWords.words.length === 0, 'a missing word list is harmless');

let emptyTranscriptErr = null;
try { Ai.normalizeSpeechResult({ transcript: '   ' }, 'Bonjour'); }
catch (e) { emptyTranscriptErr = e; }
ok(emptyTranscriptErr && /could not hear any speech/i.test(emptyTranscriptErr.friendly),
  'an empty transcript gets a “record closer” message');

let missingKeyErr = null;
try { await Ai.assessSpeech({ audio: 'AAAA', reference: 'Bonjour' }); }
catch (e) { missingKeyErr = e; }
ok(missingKeyErr && /Gemini key in Settings → AI/.test(missingKeyErr.friendly),
  'scoring without a Gemini key explains where to add one');

const speechRequests = [];
aiFetch = async function (url, opts) {
  speechRequests.push({ url: String(url), body: JSON.parse(opts.body) });
  return fakeResponse(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify({
      transcript: 'Les habitants constatent…',
      score: 84, accuracy: 86, fluency: 78, completeness: 90,
      words: [{ word: 'habitants', accuracy: 64, errorType: 'Mispronunciation' }],
      tips: 'Slow down on “habitants”.'
    }) }] } }]
  }));
};
const gemResult = await Ai.assessSpeech({
  key: 'AIza-test-key', model: 'gemini-flash-latest', audio: 'UklGRg==', mimeType: 'audio/wav',
  reference: 'Les habitants constatent que la pollution augmente.', lang: 'fr-FR'
});
eq(gemResult.score, 84, 'assessSpeech returns the model score');
eq(gemResult.source, 'gemini', 'assessSpeech marks the source');
eq(speechRequests.length, 1, 'one Gemini request scores a recording');
ok(/gemini-flash-latest:generateContent$/.test(speechRequests[0].url), 'the configured Gemini model is called');
eq(speechRequests[0].body.contents[0].parts[0].inlineData.mimeType, 'audio/wav',
  'the recording is sent as inline WAV audio');
eq(speechRequests[0].body.contents[0].parts[0].inlineData.data, 'UklGRg==', 'the base64 audio reaches Gemini');
eq(speechRequests[0].body.generationConfig.responseMimeType, 'application/json',
  'scoring asks for JSON');
ok(!!speechRequests[0].body.generationConfig.responseSchema,
  'the scoring schema is attached on the first pass');
eq(speechRequests[0].body.generationConfig.thinkingConfig.thinkingBudget, 0,
  'scoring skips Gemini thinking when supported');

// A model that rejects the schema/thinking flag: the next pass drops both.
speechRequests.length = 0;
aiFetch = async function (url, opts) {
  const body = JSON.parse(opts.body);
  speechRequests.push(body);
  if (speechRequests.length === 1) {
    return fakeResponse(JSON.stringify({ error: { message: 'Invalid JSON payload' } }), 400);
  }
  return fakeResponse(JSON.stringify({
    candidates: [{ content: { parts: [{ text: '{"transcript":"Bonjour","score":70,"accuracy":70,"fluency":70,"completeness":70,"words":[],"tips":"Encore."}' }] } }]
  }));
};
const retried = await Ai.assessSpeech({
  key: 'AIza-test-key', model: 'gemini-flash-latest', audio: 'AAAA', reference: 'Bonjour', lang: 'fr-FR'
});
eq(retried.score, 70, 'a rejected schema is retried without it');
eq(speechRequests.length, 2, 'the retry makes exactly one extra request');
ok(!speechRequests[1].generationConfig.responseSchema, 'the retry leaves the schema out');
ok(!speechRequests[1].generationConfig.thinkingConfig, 'the retry leaves the thinking flag out');

// Free-tier quota errors should point at the Azure alternative instead of a quiz.
aiFetch = async function () {
  return fakeResponse(JSON.stringify({ error: { message: 'Quota exceeded' } }), 429);
};
let gemQuotaErr = null;
try {
  await Ai.assessSpeech({ key: 'AIza-test-key', audio: 'AAAA', reference: 'Bonjour' });
} catch (e) { gemQuotaErr = e; }
ok(gemQuotaErr && /free-tier limit is reached/.test(gemQuotaErr.friendly),
  'a Gemini 429 explains the free-tier limit');
ok(gemQuotaErr && /switch Pronunciation scoring to Azure/.test(gemQuotaErr.friendly),
  'a Gemini 429 offers the Azure engine');
aiFetch = null;

/* blobToBase64 is what feeds Gemini; check it strips the data: prefix. */
const b64 = await Speech.blobToBase64(new Blob(['hi'], { type: 'audio/wav' }));
eq(Buffer.from(b64, 'base64').toString(), 'hi', 'blobToBase64 returns raw base64 without a data prefix');

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

/* Level-up suggestions are target-language only, capped at 12 and B2 first. */
const upgradeCfg = { userText: 'Je vais à la gare avec ma valise.', targetLang: 'French' };
const viReplacement = Ai.normalizeUpgrades({
  upgrades: [{ from: 'gare', to: 'đường sắt', level: 'B2' }]
}, upgradeCfg);
eq(viReplacement.length, 0, 'a Vietnamese replacement is never suggested');
const mixedUpgrades = Ai.normalizeUpgrades({
  upgrades: [
    { from: 'valise', to: 'bagage à main', level: 'B2' },
    { from: 'gare', to: 'nhà ga', level: 'B1' },
    { from: 'gare', to: 'đường sắt', level: 'B1' }
  ]
}, upgradeCfg);
eq(mixedUpgrades.length, 2, 'the unmistakably Vietnamese replacement is filtered out');
eq(mixedUpgrades[0].to, 'bagage à main', 'the French replacement is kept first (B2 first)');
ok(!mixedUpgrades.some(function (up) { return /\u0111/.test(up.to); }),
  'no suggestion keeps a Vietnamese-only letter');
const manyUpgrades = Ai.normalizeUpgrades({
  upgrades: Array.from({ length: 15 }, function (_, i) {
    return { from: 'gare', to: 'gare' + i, level: i === 14 ? 'B2' : 'B1' };
  })
}, upgradeCfg);
eq(manyUpgrades.length, 12, 'upgrades are capped at 12');
eq(manyUpgrades[0].level, 'B2', 'the B2 upgrade is listed first');
const c1Upgrade = Ai.normalizeUpgrades({
  upgrades: [{ from: 'gare', to: 'gare', level: 'C1' }]
}, upgradeCfg);
eq(c1Upgrade.length, 0, 'C1 suggestions are dropped');

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
ok(/never by copying its `term`/.test(paraPromptVi.user) &&
  /never “chi phí subir”/.test(paraPromptVi.user),
  'VI→FR forbids copying the target term into the Vietnamese source');
ok(/no \*\*bold\*\*/.test(paraPrompt.user) && /no \*\*bold\*\*/.test(paraPromptVi.user),
  'paragraphs and references forbid Markdown formatting');

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

const viParaWords = [
  { term: 'subir', meaning: 'tăng lên' },
  { term: 'excessif', meaning: 'quá mức' },
  { term: 'trajectoire', meaning: 'quỹ đạo' }
];
const viCfg = { direction: 'vi2fr', targetLang: 'French', meaningLang: 'Vietnamese' };
const viRaw = {
  paragraph: 'Chi phí tăng lên và mức độ quá mức đang thay đổi quỹ đạo của thành phố.',
  reference: 'Les coûts subissent une hausse et le niveau excessif change la trajectoire de la ville.',
  keywords: [
    { term: 'subir', meaning: 'tăng lên', note: 'subir une hausse' },
    { term: 'excessif', meaning: 'quá mức', note: '' },
    { term: 'trajectoire', meaning: 'quỹ đạo', note: '' }
  ]
};
const viParsed = Ai.normalizeParagraph(viRaw, viParaWords, viCfg);
ok(viParsed && viParsed.paragraph === viRaw.paragraph, 'VI→FR accepts a fully Vietnamese source');
eq(Ai.normalizeParagraph({
  paragraph: 'Chi phí **subir** và mức độ **excessif** đang thay đổi **trajectoire**.',
  reference: viRaw.reference,
  keywords: viRaw.keywords
}, viParaWords, viCfg), null, 'VI→FR rejects target terms copied into the Vietnamese source');
eq(Ai.normalizeParagraph({
  paragraph: viRaw.paragraph,
  reference: 'Les coûts augmentent et le niveau change.',
  keywords: viRaw.keywords
}, viParaWords, viCfg), null, 'VI→FR requires the target terms in the French reference');
eq(Ai.normalizeParagraph({
  paragraph: 'Chi phí **tăng lên** và mức độ **quá mức** đang thay đổi quỹ đạo.',
  reference: viRaw.reference,
  keywords: viRaw.keywords
}, viParaWords, viCfg).paragraph.indexOf('**'), -1,
  'markdown around source words is removed');

const frCfg = { direction: 'fr2vi', targetLang: 'French', meaningLang: 'Vietnamese' };
const frRaw = {
  paragraph: 'Les habitants constatent que la pollution s’aggrave.',
  reference: 'Người dân nhận thấy ô nhiễm gia tăng.',
  keywords: [
    { term: 'constater', meaning: 'nhận thấy', note: '' },
    { term: 'la pollution', meaning: 'ô nhiễm', note: '' },
    { term: 'aggraver', meaning: 'làm trầm trọng', note: '' }
  ]
};
ok(Ai.normalizeParagraph(frRaw, kwWords, frCfg), 'FR→VI accepts French source terms');
eq(Ai.normalizeParagraph({
  paragraph: 'Les habitants constatent (nhận thấy) que la pollution s’aggrave.',
  reference: frRaw.reference,
  keywords: frRaw.keywords
}, kwWords, frCfg), null, 'FR→VI rejects Vietnamese glosses in the French source');
eq(Ai.normalizeParagraph({
  paragraph: frRaw.paragraph,
  reference: 'Người dân nhận thấy **constater** ô nhiễm gia tăng.',
  keywords: frRaw.keywords
}, kwWords, frCfg), null, 'FR→VI rejects target terms copied into the Vietnamese reference');
eq(Ai.normalizeParagraph({
  paragraph: 'Les habitants voient que la pollution augmente.',
  reference: frRaw.reference,
  keywords: frRaw.keywords
}, kwWords, frCfg), null, 'FR→VI requires every target term in the French source');

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
    paragraph: 'Les habitants constatent que la pollution s’aggrave.',
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

let viCalls = 0;
fetchRoutes = [['/chat/completions', () => {
  viCalls++;
  return aiObj(viCalls === 1 ? {
    paragraph: 'Chi phí **subir** và mức độ **excessif** thay đổi **trajectoire**.',
    reference: viRaw.reference,
    keywords: viRaw.keywords
  } : viRaw);
}]];
const viOut = await Ai.generateParagraph({
  provider: 'openai', baseUrl: 'https://api.groq.com/openai/v1', key: 'gsk_x', model: 'openai/gpt-oss-120b',
  direction: 'vi2fr', words: viParaWords, targetLang: 'French', meaningLang: 'Vietnamese'
});
ok(viOut && viOut.paragraph.indexOf('tăng lên') !== -1, 'VI→FR retries a mixed-language paragraph');
eq(viCalls, 2, 'the language check triggers one targeted retry');

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
const accountSrc = fs.readFileSync(path.join(root, 'js/account.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssSrc = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

const elsBlock = appSrc.match(/function cacheEls\(\)[\s\S]*?;\n/)[0];
const declared = [...elsBlock.matchAll(/'([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
const usedIds = [...new Set([...appSrc.matchAll(/E\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))];
const missingInHtml = declared.filter((id) => htmlSrc.indexOf('id="' + id + '"') === -1);
const notDeclared = usedIds.filter((id) => declared.indexOf(id) === -1);
eq(missingInHtml, [], 'every cached element id exists in index.html');
eq(notDeclared, [], 'every E.* element is declared in cacheEls()');
ok(/id="btnTestVoice"/.test(htmlSrc) && /E\.btnTestVoice\.addEventListener\('click', testVoice\)/.test(appSrc) &&
  /No speech voices found/.test(appSrc), 'the homepage has a speaker test with a no-voice explanation');

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
ok(/function paragraphIsGood/.test(appSrc) && /function finalizeParagraph/.test(appSrc) &&
  /paraAttempts/.test(appSrc) && /Apply fixes and edit/.test(appSrc) &&
  /Check again/.test(appSrc) && /Finish anyway/.test(appSrc),
  'paragraph correction supports apply-fix, retry and a final decision');
ok(/q\.paraLastCheck && q\.paraLastCheck\.text === text/.test(appSrc),
  'an unchanged paragraph is not sent to the AI twice');

// Shadowing: AI text, Azure voice/assessment, recording, replay and local save.
ok(/id="segPractice"/.test(htmlSrc) && /data-value="shadowing"/.test(htmlSrc) &&
  /id="btnStartShadowing"/.test(htmlSrc) && /id="shadowingSetupPane"/.test(htmlSrc),
  'shadowing has its own practice tab and setup pane');
ok(/id="screenShadowing"/.test(htmlSrc) && /id="btnShadowRecord"/.test(htmlSrc) &&
  /id="btnShadowAssess"/.test(htmlSrc) && /id="btnShadowSave"/.test(htmlSrc),
  'the shadowing screen has record, assess and save controls');
ok(/function startShadowingPractice/.test(appSrc) && /Speech\.splitSentences/.test(appSrc) &&
  /Quiz\.buildPool\(\{/.test(appSrc),
  'shadowing generates its paragraph with the existing AI paragraph builder');
ok(/MediaRecorder/.test(appSrc) && /getUserMedia/.test(appSrc) && /Speech\.assess/.test(appSrc),
  'shadowing records with MediaRecorder and scores with Azure');
ok(/Speech\.saveRecording/.test(appSrc) && /Speech\.listRecordings/.test(appSrc) &&
  /IndexedDB/.test(fs.readFileSync(path.join(root, 'js/speech.js'), 'utf8')),
  'saved recordings use local IndexedDB, not a database');
ok(/if \(fb\.corrected && fb\.corrected !== text\)/.test(appSrc),
  'the retry panel offers the AI correction');
ok(/id="inpAzureKey"/.test(htmlSrc) && /id="inpAzureRegion"/.test(htmlSrc) &&
  /id="selAzureVoice"/.test(htmlSrc) && /id="chkCloudVoice"/.test(htmlSrc) &&
  /id="btnTestAzure"/.test(htmlSrc),
  'Settings → Speech exposes the Azure key, region, voice and cloud toggle');
ok(/Speech\.configure\(settings\)/.test(appSrc) && /Speech\.enabled\(\)/.test(appSrc),
  'speaker icons use the Azure voice when it is enabled');

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
  /settings\.practiceMode = \['paragraph', 'shadowing'\]\.indexOf\(mode\)/.test(appSrc),
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

/* ---------- Grammar course ---------- */
section('Grammar course');
const grammarSrc = fs.readFileSync(path.join(root, 'js/grammar.js'), 'utf8');
const grammarDataSrc = fs.readFileSync(path.join(root, 'js/grammar-data.js'), 'utf8');

const grammarIds = GrammarData.chapters.map((c) => c.id);
eq(GrammarData.chapters.length, 18, 'all 18 chapters are present');
eq(GrammarData.parts.length, 7, 'the course map has seven parts');
eq(grammarIds, ['map', 'basics', 'present', 'passe-compose', 'imparfait',
  'passe-compose-vs-imparfait', 'plus-que-parfait', 'futur', 'conditionnel', 'si',
  'subjonctif', 'imperatif', 'gerondif', 'discours-indirect', 'passif', 'passe-simple',
  'anglais', 'revision'], 'chapter order follows the handbook');
ok(GrammarData.chapters.every((c, i) => c.num === i + 1), 'chapter numbers are sequential');
ok(GrammarData.chapters.every((c) => c.title && c.subtitle && c.subtitle.vi && c.subtitle.en &&
  c.summary && c.summary.vi && c.summary.en && c.blocks.length && c.exercises.length),
  'every chapter has a title, a bilingual summary, lesson blocks and exercises');
eq(GrammarData.chapters.reduce((n, c) => n + c.exercises.length, 0), 123, '123 exercises in the course');
eq(GrammarData.chapters[17].exercises.length, 27, 'the review chapter has the 27-question mock exam');

const badExercises = [];
GrammarData.chapters.forEach((chapter) => {
  chapter.exercises.forEach((ex, index) => {
    const where = chapter.id + ' #' + (index + 1);
    if (!ex.explain || !ex.explain.vi || !ex.explain.en) badExercises.push(where + ' explanations');
    if (ex.type === 'fill') {
      const blanks = (String(ex.text).match(/\{\{\d+\}\}/g) || []).length;
      if (!blanks || blanks !== ex.answers.length) badExercises.push(where + ' blank count');
      if (ex.answers.some((a) => !Array.isArray(a) || !a.length || a.some((x) => !String(x).trim()))) {
        badExercises.push(where + ' empty answer');
      }
    } else if (ex.type === 'choice') {
      if (!ex.question || !ex.question.vi || !ex.question.en || !ex.options || ex.options.length < 2 ||
        ex.options.some((option) => !String(option).trim()) ||
        !Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer >= ex.options.length) {
        badExercises.push(where + ' choice');
      }
    } else if (ex.type === 'translate') {
      if (!ex.source || !ex.source.vi || !ex.source.en || !ex.answers || !ex.answers.length ||
        ex.answers.some((answer) => !String(answer).trim())) {
        badExercises.push(where + ' translation');
      }
    } else {
      badExercises.push(where + ' unknown type');
    }
  });
});
eq(badExercises, [], 'every exercise has valid blanks, options, answers and bilingual feedback');

/* ---------- The A2 → B2 grammar handbook (second course) ---------- */
function auditCourse(data) {
  const problems = [];
  const kinds = ['p', 'h', 'list', 'table', 'formula', 'callout', 'examples'];
  data.chapters.forEach((chapter, index) => {
    const where = chapter.id;
    if (chapter.num !== index + 1) problems.push(where + ' num');
    if (!chapter.title || !chapter.subtitle || !chapter.subtitle.vi || !chapter.subtitle.en) problems.push(where + ' title');
    if (!chapter.summary || !chapter.summary.vi || !chapter.summary.en) problems.push(where + ' summary');
    if (!chapter.blocks.length) problems.push(where + ' blocks');
    if (!chapter.exercises.length) problems.push(where + ' exercises');
    if (!data.parts.some((part) => part.id === chapter.part)) problems.push(where + ' part');
    chapter.blocks.forEach((block, i) => {
      const at = where + ' block ' + (i + 1);
      if (kinds.indexOf(block.type) === -1) problems.push(at + ' type');
      if (block.type !== 'examples' && block.type !== 'table' && (!block.vi || !block.en)) problems.push(at + ' bilingual');
      if (block.type === 'table') {
        block.head.concat.apply(block.head, block.rows).forEach((cell) => {
          if (!cell || !cell.vi || !cell.en) problems.push(at + ' cell');
        });
      }
      if (block.type === 'examples') {
        block.items.forEach((item) => { if (!item.fr || !item.vi || !item.en) problems.push(at + ' example'); });
      }
    });
    chapter.exercises.forEach((ex, i) => {
      const at = where + ' ex ' + (i + 1);
      if (!ex.explain || !ex.explain.vi || !ex.explain.en) problems.push(at + ' explain');
      if (ex.type === 'fill') {
        const blanks = (String(ex.text).match(/\{\{\d+\}\}/g) || []).length;
        if (!blanks || blanks !== ex.answers.length) problems.push(at + ' blanks');
      } else if (ex.type === 'choice') {
        if (!Array.isArray(ex.options) || ex.options.length < 2 || !ex.question ||
          !Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer >= ex.options.length) problems.push(at + ' choice');
      } else if (ex.type === 'translate') {
        if (!ex.source || !ex.source.vi || !ex.source.en || !ex.answers || !ex.answers.length) problems.push(at + ' translate');
      } else {
        problems.push(at + ' unknown type');
      }
    });
  });
  return problems;
}

const hbAudit = auditCourse(GrammarHandbook);
const hbIds = GrammarHandbook.chapters.map((c) => c.id);
eq(GrammarHandbook.chapters.length, 12, 'the handbook has twelve chapters');
eq(GrammarHandbook.parts.length, 5, 'the handbook map has five parts');
eq(hbIds.length, new Set(hbIds).size, 'handbook chapter ids are unique');
ok(hbIds.every((id) => grammarIds.indexOf(id) === -1), 'handbook ids never collide with the atlas');
ok(GrammarHandbook.chapters.every((c) => c.blocks.some((b) => b.type === 'table' || b.type === 'list')),
  'every handbook chapter carries a table or a list');
ok(GrammarHandbook.chapters.reduce((n, c) => n + c.exercises.length, 0) >= 40,
  'the handbook has at least 40 exercises');
eq(hbAudit, [], 'every handbook chapter, block and exercise is complete and bilingual');
eq(GrammarHandbook.title.vi, 'Cẩm nang ngữ pháp A2–B2', 'the handbook has its own unique name');
eq(GrammarData.title.en, 'Tense Atlas', 'the tenses course is named the Tense Atlas');
ok(Grammar.courses && Grammar.courses.tenses === GrammarData && Grammar.courses.handbook === GrammarHandbook,
  'the grammar controller knows both courses');

const allTableCells = [];
GrammarData.chapters.forEach((chapter) => {
  chapter.blocks.forEach((block) => {
    if (block.type !== 'table') return;
    allTableCells.push.apply(allTableCells, block.head);
    block.rows.forEach((row) => { allTableCells.push.apply(allTableCells, row); });
  });
});
ok(allTableCells.length > 100 && allTableCells.every((cell) => cell && typeof cell === 'object' &&
  Object.prototype.hasOwnProperty.call(cell, 'vi') && Object.prototype.hasOwnProperty.call(cell, 'en')),
  'every table cell carries both Vietnamese and English text');
const firstTable = GrammarData.chapters[0].blocks.find((block) => block.type === 'table');
eq(firstTable.head.map((cell) => cell.en), ['Tense', 'Used for', 'Example'],
  'table headers follow the VI/EN toggle');
eq(firstTable.rows[0].map((cell) => cell.en),
  ['Plus-que-parfait', 'An event before another past event', 'J’avais fini.'],
  'table descriptions are translated while French examples stay French');

const badBlocks = [];
GrammarData.chapters.forEach((chapter) => {
  chapter.blocks.forEach((block, index) => {
    const where = chapter.id + ' block ' + (index + 1);
    const kinds = ['p', 'h', 'list', 'table', 'formula', 'callout', 'examples'];
    if (kinds.indexOf(block.type) === -1) { badBlocks.push(where + ' unknown'); return; }
    if (['p', 'h', 'formula', 'callout'].indexOf(block.type) !== -1 &&
      (!block.vi || !block.en)) badBlocks.push(where + ' text');
    if (block.type === 'list' && (!Array.isArray(block.vi) || !Array.isArray(block.en) ||
      block.vi.length !== block.en.length)) badBlocks.push(where + ' list');
    if (block.type === 'callout' && ['tip', 'warn', 'note', 'english'].indexOf(block.kind) === -1) {
      badBlocks.push(where + ' callout kind');
    }
    if (block.type === 'examples' && (!Array.isArray(block.items) || !block.items.length ||
      block.items.some((item) => !item.fr || !item.vi || !item.en))) {
      badBlocks.push(where + ' examples');
    }
    if (block.type === 'table' && (!Array.isArray(block.head) || !Array.isArray(block.rows) ||
      block.rows.some((row) => !Array.isArray(row) || row.length !== block.head.length))) {
      badBlocks.push(where + ' table');
    }
  });
});
eq(badBlocks, [], 'lesson blocks have the shape the reader renders');

Util.lsRemove('grammarProgress');
Util.lsRemove('grammarLast');
let gp = Grammar.progressSummary();
eq([gp.done, gp.total, gp.pct, gp.next.id], [0, 18, 0, 'map'], 'fresh progress starts at chapter 1');
Util.lsSet('grammarProgress', { map: { done: true }, basics: { done: true } });
Util.lsSet('grammarLast', 'present');
gp = Grammar.progressSummary();
eq([gp.done, gp.total, gp.pct, gp.next.id, gp.last], [2, 18, 11, 'present', 'present'],
  'progress summary counts completed lessons and resumes at the next one');
Util.lsRemove('grammarProgress');
Util.lsRemove('grammarLast');

/* The tutor is prose, not JSON: it must not send response_format and must use
   the same OpenAI-compatible transport as the rest of the app. */
section('Grammar tutor transport');
let tutorRequest = null;
aiFetch = async function (url, opts) {
  tutorRequest = { url: String(url), body: JSON.parse(opts.body || '{}') };
  return fakeResponse(JSON.stringify({ choices: [{ message: { content: 'Tutor reply' } }] }), 200);
};
const tutorReply = await Ai.askTutor({
  provider: 'openai', baseUrl: 'https://api.example.test/v1', key: 'test-key', model: 'test-model',
  system: 'SYSTEM', prompt: 'PROMPT'
});
eq(tutorReply.text, 'Tutor reply', 'the tutor returns the model prose');
eq(tutorRequest.body.messages.map((m) => m.content), ['SYSTEM', 'PROMPT'], 'system + user context are sent');
ok(!('response_format' in tutorRequest.body), 'the tutor does not request JSON mode');
eq(tutorRequest.body.temperature, 0.55, 'the tutor uses a calm temperature');
eq(tutorRequest.body.max_tokens, 1600, 'the tutor has room for a useful answer');

let geminiRequest = null;
aiFetch = async function (url, opts) {
  geminiRequest = JSON.parse(opts.body || '{}');
  return fakeResponse(JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'Gemini reply' }] } }]
  }), 200);
};
const geminiReply = await Ai.askTutor({
  provider: 'gemini', key: 'test-key', model: 'gemini-2.5-flash',
  system: 'GEMINI SYSTEM', prompt: 'GEMINI PROMPT'
});
eq(geminiReply.text, 'Gemini reply', 'the Gemini transport returns prose too');
eq(geminiRequest.systemInstruction.parts[0].text, 'GEMINI SYSTEM', 'Gemini receives the lesson context');
eq(geminiRequest.contents[0].parts[0].text, 'GEMINI PROMPT', 'Gemini receives the learner question');
eq(geminiRequest.generationConfig.responseMimeType, 'text/plain', 'Gemini asks for plain text, not JSON');

let emptyTutor = null;
try { await Ai.askTutor({ provider: 'openai', key: 'k', model: 'm', prompt: '   ' }); }
catch (e) { emptyTutor = e; }
ok(!!emptyTutor, 'an empty tutor question is rejected before a network call');

aiFetch = async function () {
  return fakeResponse(JSON.stringify({
    choices: [{ message: { content: '' }, finish_reason: 'length' }]
  }), 200);
};
let emptyReply = null;
try {
  await Ai.askTutor({
    provider: 'openai', baseUrl: 'https://api.example.test/v1', key: 'k', model: 'm',
    system: 'SYSTEM', prompt: 'PROMPT'
  });
} catch (e) { emptyReply = e; }
ok(emptyReply && emptyReply.empty, 'an empty tutor reply is tagged as empty');
ok(/AI tutor returned an empty answer/.test(emptyReply.friendly || ''),
  'an empty tutor reply gives tutor advice, not quiz fallback advice');
aiFetch = null;

section('Grammar wiring');
ok(/id="screenGrammar"/.test(htmlSrc) && /id="btnStudy"/.test(htmlSrc) && /id="studyPct"/.test(htmlSrc),
  'the shell has a Grammar screen and a Study card');
ok(htmlSrc.indexOf('js/grammar-data.js') !== -1 && htmlSrc.indexOf('js/grammar.js') !== -1 &&
  htmlSrc.indexOf('js/grammar-data.js') < htmlSrc.indexOf('js/grammar.js') &&
  htmlSrc.indexOf('js/grammar.js') < htmlSrc.indexOf('js/app.js'),
  'grammar data and controller load before app.js');
ok(/function openGrammar\(/.test(appSrc) && /E\.btnStudy\.addEventListener\('click', function \(\) \{ openGrammar\(false, 'tenses'\)/.test(appSrc),
  'the Tense Atlas card opens the tenses course');
ok(/id="btnOpenHandbook"/.test(htmlSrc) && /openGrammar\(false, 'handbook'\)/.test(appSrc),
  'the Grammar Handbook card opens its own course');
ok(htmlSrc.indexOf('js/grammar-handbook.js') !== -1 &&
  htmlSrc.indexOf('js/grammar-handbook.js') < htmlSrc.indexOf('js/grammar.js'),
  'the handbook data loads before the grammar controller');
ok(/grammar: \{ el: 'screenGrammar'/.test(appSrc), 'showScreen knows the Grammar screen');
ok(/Grammar\.init\(/.test(appSrc) && /askTutor: askTutor/.test(appSrc) &&
  /onExit: function \(\) \{ showScreen\('lessons'\)/.test(appSrc),
  'app.js gives Grammar its AI transport, progress callback and exit route');
ok(/Ai\.askTutor\(/.test(appSrc), 'the tutor uses the shared AI transport');
ok(/grammarProgress/.test(grammarSrc) && /grammarLast/.test(grammarSrc) && /grammarLang/.test(grammarSrc),
  'lesson progress, resume point and explanation language are saved locally');
ok(/\.grammar-hero \{/.test(cssSrc) && /\.lesson-layout \{/.test(cssSrc) &&
  /body\[data-screen="grammar"\] \.sidebar/.test(cssSrc) && /\.tutor-msg/.test(cssSrc),
  'the course map, lesson reader and tutor have responsive styles');
ok(/Grammar\.openCourse\(\)/.test(appSrc) && /progressSummary\(\)/.test(appSrc),
  'the app updates the Study card from the shared progress summary');
ok(/'toggle-complete'/.test(grammarSrc), 'lessons can be marked complete');
ok(/exerciseStatus/.test(grammarSrc) && /recordExercise/.test(grammarSrc),
  'exercise answers are stored per chapter');
ok(grammarDataSrc.indexOf('<script') === -1 && htmlSrc.indexOf('js/grammar-data.js') !== -1,
  'the PDF content is app data, not a published document');

section('Daily quests');
const qa = Quests.newDaily('user-a', '2026-10-23');
const qb = Quests.newDaily('user-a', '2026-10-23');
eq(qa, qb, 'the daily set is deterministic for the same user + date');
eq(qa.quests.length, 3, 'three quests a day');
eq(qa.quests.map(function (q) { return Quests.def(q.id).group; }), ['quiz', 'production', 'review'],
  'one quiz, one production and one review every day');
ok(qa.quests.every(function (q) { return q.progress === 0 && !q.done; }), 'new quests start at zero');
ok(JSON.stringify(Quests.newDaily('user-b', '2026-10-23').quests) !== JSON.stringify(qa.quests),
  'a different profile gets a different daily set');
eq(Quests.newDaily('user-a', '2026-10-24').date, '2026-10-24', 'a new date starts a new daily set');
const seenQuests = new Set();
for (let i = 0; i < 200; i++) {
  Quests.newDaily('user-a', Quests.addDays('2026-01-01', i)).quests.forEach(function (q) { seenQuests.add(q.id); });
}
eq(seenQuests.size, 7, 'all seven quest types appear across 200 days');

const dp = Quests.newDaily('user-a', '2026-10-23');
const firstQuest = dp.quests[0];
Quests.setProgress(dp, firstQuest.id, 2);
eq(firstQuest.progress, 2, 'progress is stored');
Quests.setProgress(dp, firstQuest.id, 1);
eq(firstQuest.progress, 2, 'progress never goes backwards');
Quests.setProgress(dp, firstQuest.id, firstQuest.target + 99);
eq(firstQuest.progress, firstQuest.target, 'progress is clamped to the target');
ok(firstQuest.done, 'a quest is done at its target');
ok(!Quests.isAllDone(dp), 'the day is not complete until every quest is done');
dp.quests.forEach(function (q) { Quests.setProgress(dp, q.id, q.target); });
ok(Quests.isAllDone(dp), 'all three done completes the day');
eq(Quests.addProgress(dp, 'not-a-quest', 1), null, 'an unknown quest is ignored');

const merged = Quests.mergeDaily(
  { date: '2026-10-23', quests: [{ id: 'mc30', target: 30, progress: 10, done: false }], completedAt: null },
  { date: '2026-10-23', quests: [{ id: 'mc30', target: 30, progress: 20, done: false }], completedAt: null }
);
eq(merged.quests[0].progress, 20, 'syncing keeps the larger progress');
eq(merged.quests[0].target, 30, 'syncing keeps the target');
const serverWins = Quests.mergeDaily(
  { date: '2026-10-23', quests: [{ id: 'shadow3', target: 3, progress: 1, done: false }], completedAt: null },
  { date: '2026-10-23', quests: [{ id: 'mc30', target: 30, progress: 4, done: false }], completedAt: null }
);
eq(serverWins.quests.length, 1, 'the server quest list wins over a stale offline pick');
eq(serverWins.quests[0].id, 'mc30', 'the stale offline quest is dropped');
eq(Quests.mergeDaily({ date: '2026-10-22', quests: [] }, { date: '2026-10-23', quests: [] }).date, '2026-10-23',
  'the newest day wins when merging');

eq(Quests.nextStreak({ current: 3, best: 5, lastCompletedDate: '2026-10-22' }, '2026-10-23'),
  { current: 4, best: 5, lastCompletedDate: '2026-10-23' }, 'a perfect day extends the streak');
eq(Quests.nextStreak({ current: 3, best: 5, lastCompletedDate: '2026-10-21' }, '2026-10-23'),
  { current: 4, best: 5, lastCompletedDate: '2026-10-23' }, 'one missed day is a grace day');
eq(Quests.nextStreak({ current: 3, best: 5, lastCompletedDate: '2026-10-20' }, '2026-10-23'),
  { current: 1, best: 5, lastCompletedDate: '2026-10-23' }, 'two missed days reset the streak');
eq(Quests.nextStreak({ current: 3, best: 5, lastCompletedDate: '2026-10-23' }, '2026-10-23').current, 3,
  'completing the same day twice does not double-count');
eq(Quests.nextStreak({ current: 3, best: 5, lastCompletedDate: '2026-10-23' }, '2026-10-22').current, 3,
  'a date in the past cannot farm the streak');
eq(Quests.nextStreak({ current: 2, best: 2, lastCompletedDate: '2026-10-22' }, '2026-10-23').best, 3,
  'the best streak follows the current one');

const risk = Quests.streakView({ current: 3, best: 5, lastCompletedDate: '2026-10-21' }, '2026-10-23', false);
eq(risk.current, 3, 'the streak is still shown after one missed day');
eq(risk.atRisk, true, 'one missed day flags the flame with “!”');
eq(Quests.streakView({ current: 3, best: 5, lastCompletedDate: '2026-10-21' }, '2026-10-23', true).atRisk, false,
  'finishing today clears the warning');
eq(Quests.streakView({ current: 3, best: 5, lastCompletedDate: '2026-10-20' }, '2026-10-23', false).current, 0,
  'two missed days show a reset streak');
eq(Quests.streakView({ current: 3, best: 5, lastCompletedDate: '2026-10-22' }, '2026-10-23', false).atRisk, false,
  'yesterday completed is a normal day');

ok(Quests.isDateKey('2026-10-23'), 'a real date key is valid');
ok(!Quests.isDateKey('2026-02-30'), 'an impossible date is rejected');
ok(Quests.isDateKey('2028-02-29'), 'a leap day is valid');
ok(!Quests.isDateKey('23/10/2026'), 'a non-ISO date is rejected');
eq(Quests.addDays('2026-12-31', 1), '2027-01-01', 'addDays crosses the year');
eq(Quests.daysBetween('2026-10-23', '2026-10-26'), 3, 'daysBetween counts calendar days');
eq(Quests.daysBetween('2026-10-26', '2026-10-23'), -3, 'daysBetween is signed');
eq(Quests.targetText('mc30'), '30 questions', 'quest targets have human labels');
eq(Quests.targetText('grammar1'), '1 lesson', 'a lesson target reads as one lesson');

section('Accounts & security');
const Crypto = require('../lib/crypto.js');
const H = require('../lib/http.js');
const Auth = require('../lib/auth.js');
const Daily = require('../lib/daily.js');
const passwordHash = await Crypto.hashPassword('correct horse battery');
ok(passwordHash.indexOf('scrypt$') === 0, 'passwords are stored as scrypt hashes');
ok(await Crypto.verifyPassword('correct horse battery', passwordHash), 'the right password verifies');
ok(!(await Crypto.verifyPassword('wrong password', passwordHash)), 'a wrong password fails');
ok(!(await Crypto.verifyPassword('anything', 'garbage')), 'a malformed hash fails closed');
const recovery = Crypto.recoveryCode();
ok(/^[A-HJ-KM-NP-TV-Z2-9]{5}-[A-HJ-KM-NP-TV-Z2-9]{5}$/.test(recovery),
  'recovery codes are 10 unambiguous characters');
eq(Crypto.normalizeRecovery(' abcde-fghjk '), 'ABCDEFGHJK', 'recovery input ignores case and dashes');
ok(Crypto.randomToken(32) !== Crypto.randomToken(32), 'session tokens are random');
eq(Crypto.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'session tokens are stored by SHA-256');

eq(H.parseCookies({ headers: { cookie: 'a=1; vl_session=hello%20world' } }),
  { a: '1', vl_session: 'hello world' }, 'cookies are parsed and decoded');
ok(/HttpOnly/.test(H.cookie('vl_session', 'x', { maxAge: 60, secure: true })), 'session cookies are HttpOnly');
ok(/Secure/.test(H.cookie('vl_session', 'x', { maxAge: 60, secure: true })), 'session cookies are Secure on HTTPS');
ok(!/Secure/.test(H.cookie('vl_session', 'x', { maxAge: 60, secure: false })), 'localhost sessions stay on HTTP');

eq(Auth.normalizeEmail(' Me@Example.COM '), 'me@example.com', 'emails are normalised');
ok(Auth.validEmail('me@example.co.uk'), 'a normal email is accepted');
ok(!Auth.validEmail('me@example'), 'an email without a dot is rejected');
eq(Auth.cleanName('  Khoi\n '), 'Khoi', 'names are trimmed');
eq(Auth.checkPassword('12345678'), '', 'eight characters is enough');
ok(Auth.checkPassword('1234567').length > 0, 'seven characters is too short');

eq(Daily.checkDate('2026-13-01'), 'Invalid date.', 'the API rejects impossible dates');
eq(Daily.checkDate('2000-01-01'), 'Date is out of range.', 'the API rejects old dates');
eq(Daily.checkDate(Quests.dateKey(new Date())), '', 'today is accepted');

section('Home, auth and quest wiring');
ok(/id="authScreen"/.test(htmlSrc) && /id="authForm"/.test(htmlSrc) && /id="authEmail"/.test(htmlSrc),
  'the page has a sign-in gate');
ok(/id="homeDate"/.test(htmlSrc) && /id="homeName"/.test(htmlSrc) && /id="streakChip"/.test(htmlSrc),
  'home has a date, a name and a streak chip');
ok(/id="questList"/.test(htmlSrc) && /id="questCount"/.test(htmlSrc) && /id="questAllDone"/.test(htmlSrc),
  'home has a daily quest card with progress and an all-done state');
ok(htmlSrc.indexOf('js/quests.js') !== -1 && htmlSrc.indexOf('js/quests.js') < htmlSrc.indexOf('js/app.js'),
  'the quest engine loads before the app');
ok(htmlSrc.indexOf('js/account.js') !== -1 && htmlSrc.indexOf('js/account.js') < htmlSrc.indexOf('js/app.js'),
  'the account/sync layer loads before the app');
ok(/questEvent\('mc30'/.test(appSrc) && /questEvent\('mixed20'/.test(appSrc) &&
  /questEvent\('correct10'/.test(appSrc), 'quiz answers update every quiz quest');
ok(/questEvent\('paragraph1'/.test(appSrc) && /questEvent\('cards20'/.test(appSrc) &&
  /questEvent\('shadow3'/.test(appSrc), 'paragraph, flashcards and shadowing update their quests');
ok(/questEvent\('grammar1'/.test(appSrc) && /onChapterDone/.test(grammarSrc) && /notifyChapterDone/.test(grammarSrc),
  'finishing a grammar lesson updates the grammar quest');
ok(/function startQuest\(/.test(appSrc) && /setPracticeTypes\(\['mc'\]\)/.test(appSrc) &&
  /setPracticeCount\(30\)/.test(appSrc) && /setPracticeTypes\(\['mc', 'blank', 'translate'\]\)/.test(appSrc),
  'a quest Start preconfigures the exact quiz and count');
ok(/openNextLesson/.test(grammarSrc) && /openGrammar\(true\)/.test(appSrc),
  'the grammar quest opens the next unfinished lesson');
ok(/initAuth\(\)/.test(appSrc) && /auth-locked/.test(appSrc) && /showAuth\(\)/.test(appSrc),
  'the app starts behind the account gate');
ok(/Account\.flush/.test(appSrc) && /Account\.queueProgress/.test(appSrc) && /navigator\.onLine/.test(appSrc),
  'quest progress is queued locally and retried when online');
ok(/quests-dropped/.test(accountSrc) && /too old to sync/.test(appSrc),
  'progress that is too old to sync is dropped with a visible warning');
ok(/showRecovery\(/.test(appSrc) && /recoveryDialog/.test(htmlSrc), 'the recovery code is shown once at signup');
ok(/streakWarn/.test(appSrc) && /is-at-risk/.test(cssSrc), 'the “!” warning has markup and a style');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
ok(pkg.dependencies && pkg.dependencies.mongodb, 'the API uses the official MongoDB driver');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
ok(/^\.env$/m.test(ignore) && /^\.env\.\*$/m.test(ignore) && /node_modules\//.test(ignore),
  'secrets and node_modules are git-ignored');

section('Account API (in-memory Mongo)');

function createFakeDb() {
  const store = { users: [], sessions: [], daily: [], throttle: [] };
  let seq = 0;
  function nextId(prefix) { seq += 1; return prefix + seq; }
  function matches(doc, filter) {
    return Object.keys(filter || {}).every(function (key) {
      if (filter[key] === null) return doc[key] == null;
      if (key === '_id') return String(doc[key]) === String(filter[key]);
      return doc[key] === filter[key];
    });
  }
  function applySet(doc, update) {
    const set = (update && update.$set) || {};
    let changed = false;
    Object.keys(set).forEach(function (key) {
      if (JSON.stringify(doc[key]) !== JSON.stringify(set[key])) changed = true;
      doc[key] = set[key];
    });
    return changed;
  }
  function collection(name) {
    const rows = store[name];
    return {
      createIndex: async function () { return 'ok'; },
      insertOne: async function (doc) {
        if (doc._id == null) doc._id = nextId(name === 'users' ? 'u' : name.charAt(0));
        rows.push(doc);
        return { insertedId: doc._id };
      },
      findOne: async function (filter) {
        return rows.find(function (doc) { return matches(doc, filter); }) || null;
      },
      findOneAndUpdate: async function (filter, update) {
        if (name !== 'throttle') return null;
        let doc = rows.find(function (d) { return d._id === filter._id; });
        if (!doc) { doc = { _id: filter._id, count: 0 }; rows.push(doc); }
        doc.count += (update.$inc && update.$inc.count) || 1;
        if (update.$setOnInsert) Object.assign(doc, update.$setOnInsert);
        return doc;
      },
      updateOne: async function (filter, update) {
        const doc = rows.find(function (d) { return matches(d, filter); });
        if (!doc) return { modifiedCount: 0 };
        return { modifiedCount: applySet(doc, update) ? 1 : 0 };
      },
      deleteOne: async function (filter) {
        const i = rows.findIndex(function (d) { return matches(d, filter); });
        if (i < 0) return { deletedCount: 0 };
        rows.splice(i, 1);
        return { deletedCount: 1 };
      },
      deleteMany: async function (filter) {
        let n = 0;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (matches(rows[i], filter)) { rows.splice(i, 1); n += 1; }
        }
        return { deletedCount: n };
      }
    };
  }
  return { store: store, collection: collection, databaseName: 'vocablab-test' };
}

const dbPath = require.resolve('../lib/db.js');
const fakeDb = createFakeDb();
const fakeDbModule = {
  ready: async function () { return fakeDb; },
  getDb: async function () { return fakeDb; },
  close: async function () {}
};
// Inject the fake before the API handlers load, so the logic suite does not
// need the `mongodb` package (or a real database) to run.
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  children: [],
  paths: [],
  exports: fakeDbModule
};

const signupApi = require('../api/auth/signup.js');
const loginApi = require('../api/auth/login.js');
const logoutApi = require('../api/auth/logout.js');
const meApi = require('../api/auth/me.js');
const resetApi = require('../api/auth/reset.js');
const profileApi = require('../api/profile.js');
const homeApi = require('../api/home.js');
const progressApi = require('../api/daily/progress.js');

async function apiCall(handler, method, url, opts) {
  const options = opts || {};
  const req = {
    method: method,
    url: url,
    headers: Object.assign({ host: 'localhost' }, options.headers || {}),
    body: options.body,
    socket: {}
  };
  const res = {
    statusCode: 0, headers: {}, body: '', headersSent: false,
    setHeader: function (key, value) { this.headers[String(key).toLowerCase()] = value; },
    end: function (chunk) { this.body += chunk == null ? '' : String(chunk); this.headersSent = true; }
  };
  await handler(req, res);
  let data = null;
  try { data = res.body ? JSON.parse(res.body) : null; } catch (e) { data = null; }
  return { status: res.statusCode, data: data, headers: res.headers };
}

const apiDate = Quests.dateKey(new Date());
const apiEmail = 'api-test-' + Date.now() + '@example.com';
const signupRes = await apiCall(signupApi, 'POST', '/api/auth/signup', {
  body: { name: 'Test User', email: apiEmail, password: 'longpassword' }
});
eq(signupRes.status, 201, 'signup creates an account');
eq(signupRes.data.user.name, 'Test User', 'signup returns the public user');
ok(signupRes.data.user.id && signupRes.data.user.email === apiEmail, 'signup returns the id and email');
ok(/^[A-HJ-KM-NP-TV-Z2-9]{5}-[A-HJ-KM-NP-TV-Z2-9]{5}$/.test(signupRes.data.recoveryCode),
  'signup returns a one-time recovery code');
const rawCookie = String(signupRes.headers['set-cookie'] || '');
ok(/vl_session=/.test(rawCookie) && /HttpOnly/.test(rawCookie) && /SameSite=Lax/.test(rawCookie),
  'signup sets an HttpOnly session cookie');
const apiCookie = rawCookie.split(';')[0];

const meRes = await apiCall(meApi, 'GET', '/api/auth/me', { headers: { cookie: apiCookie } });
eq(meRes.status, 200, 'the session cookie identifies the user');
eq(meRes.data.user.email, apiEmail, 'me returns the signed-in account');

const homeRes = await apiCall(homeApi, 'GET', '/api/home?date=' + apiDate, { headers: { cookie: apiCookie } });
eq(homeRes.status, 200, 'home loads for a signed-in user');
eq(homeRes.data.daily.quests.length, 3, 'home returns three daily quests');
eq(homeRes.data.streak.current, 0, 'a new account starts at a 0-day streak');

let lastProgress = null;
for (const quest of homeRes.data.daily.quests) {
  lastProgress = await apiCall(progressApi, 'POST', '/api/daily/progress', {
    headers: { cookie: apiCookie },
    body: { date: apiDate, questId: quest.id, progress: quest.target }
  });
  eq(lastProgress.status, 200, 'progress is accepted for ' + quest.id);
}
eq(lastProgress.data.completedNow, true, 'the last quest marks the day complete');
eq(lastProgress.data.streak.current, 1, 'a completed day starts the streak');
ok(!!lastProgress.data.daily.completedAt, 'the daily document records its completion time');
const repeatProgress = await apiCall(progressApi, 'POST', '/api/daily/progress', {
  headers: { cookie: apiCookie },
  body: { date: apiDate, questId: lastProgress.data.daily.quests[0].id,
    progress: lastProgress.data.daily.quests[0].target }
});
eq(repeatProgress.data.streak.current, 1, 'a repeated sync does not add a second streak day');

const profileRes = await apiCall(profileApi, 'PATCH', '/api/profile', {
  headers: { cookie: apiCookie }, body: { name: 'Renamed User' }
});
eq(profileRes.status, 200, 'the profile can be updated');
eq(profileRes.data.user.name, 'Renamed User', 'the new name is returned');
const evilRes = await apiCall(profileApi, 'PATCH', '/api/profile', {
  headers: { cookie: apiCookie, origin: 'https://evil.example' }, body: { name: 'Evil' }
});
eq(evilRes.status, 403, 'cross-site writes are rejected');
const noCookieRes = await apiCall(homeApi, 'GET', '/api/home?date=' + apiDate, {});
eq(noCookieRes.status, 401, 'daily data needs a session');

const logoutRes = await apiCall(logoutApi, 'POST', '/api/auth/logout', { headers: { cookie: apiCookie } });
eq(logoutRes.status, 200, 'logout succeeds');
const afterLogout = await apiCall(meApi, 'GET', '/api/auth/me', { headers: { cookie: apiCookie } });
eq(afterLogout.status, 401, 'logout destroys the session cookie');

const badLogin = await apiCall(loginApi, 'POST', '/api/auth/login', {
  body: { email: apiEmail, password: 'wrong-password' }
});
eq(badLogin.status, 401, 'a wrong password is rejected');
const goodLogin = await apiCall(loginApi, 'POST', '/api/auth/login', {
  body: { email: apiEmail, password: 'longpassword' }
});
eq(goodLogin.status, 200, 'the right password signs in');
const loginCookie = String(goodLogin.headers['set-cookie'] || '').split(';')[0];

const badReset = await apiCall(resetApi, 'POST', '/api/auth/reset', {
  body: { email: apiEmail, code: 'WRONG-CODE9', password: 'newpassword' }
});
eq(badReset.status, 400, 'a wrong recovery code cannot reset the password');
const resetRes = await apiCall(resetApi, 'POST', '/api/auth/reset', {
  body: { email: apiEmail, code: signupRes.data.recoveryCode, password: 'newpassword' }
});
eq(resetRes.status, 200, 'the recovery code resets the password');
ok(resetRes.data.recoveryCode && resetRes.data.recoveryCode !== signupRes.data.recoveryCode,
  'the recovery code is rotated after use');
const resetCookie = String(resetRes.headers['set-cookie'] || '').split(';')[0];
const oldPassword = await apiCall(loginApi, 'POST', '/api/auth/login', {
  body: { email: apiEmail, password: 'longpassword' }
});
eq(oldPassword.status, 401, 'the old password no longer works');
const newPassword = await apiCall(loginApi, 'POST', '/api/auth/login', {
  body: { email: apiEmail, password: 'newpassword' }
});
eq(newPassword.status, 200, 'the new password works');
const oldSession = await apiCall(meApi, 'GET', '/api/auth/me', { headers: { cookie: loginCookie } });
eq(oldSession.status, 401, 'a reset signs out the other sessions');
const newSession = await apiCall(meApi, 'GET', '/api/auth/me', { headers: { cookie: resetCookie } });
eq(newSession.status, 200, 'the reset session stays signed in');

const duplicate = await apiCall(signupApi, 'POST', '/api/auth/signup', {
  body: { name: 'Someone Else', email: apiEmail, password: 'longpassword' }
});
eq(duplicate.status, 409, 'one account per email address');

section('Local account store (no MongoDB)');

ok(!process.env.MONGODB_URI, 'the logic suite runs without a MongoDB connection string');

const localFile = path.join(root, '.data', 'test-local-db-' + process.pid + '.json');
process.env.VOCABLAB_LOCAL_DB = localFile;
const localDbPath = require.resolve('../lib/local-db.js');
delete require.cache[localDbPath];
const localStore = require('../lib/local-db.js');

/* Load the real lib/db.js with MONGODB_URI unset, and reload the handlers
   against it, so this exercises the exact code path a machine with no
   database uses — including the fallback itself. */
const fakeDbExports = require.cache[dbPath].exports;
delete require.cache[dbPath];
const realDbModule = require('../lib/db.js');
ok(realDbModule.isLocal(), 'lib/db.js reports local mode when MONGODB_URI is missing');
eq(localStore.file, localFile, 'the local store writes to the configured file');
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, children: [], paths: [],
  exports: realDbModule
};
const localApiFiles = [
  '../api/auth/signup.js', '../api/auth/login.js', '../api/auth/logout.js',
  '../api/auth/me.js', '../api/home.js', '../api/daily/progress.js', '../api/health.js'
];
localApiFiles.forEach(function (file) { delete require.cache[require.resolve(file)]; });
const lSignup = require('../api/auth/signup.js');
const lLogin = require('../api/auth/login.js');
const lLogout = require('../api/auth/logout.js');
const lMe = require('../api/auth/me.js');
const lHome = require('../api/home.js');
const lProgress = require('../api/daily/progress.js');
const lHealth = require('../api/health.js');

const localEmail = 'local-test-' + Date.now() + '@example.com';
const localDate = Quests.dateKey(new Date());
const localSignup = await apiCall(lSignup, 'POST', '/api/auth/signup', {
  body: { name: 'Local Learner', email: localEmail, password: 'longpassword' }
});
eq(localSignup.status, 201, 'signup works with no MongoDB configured');
const localCookie = String(localSignup.headers['set-cookie'] || '').split(';')[0];
ok(/vl_session=/.test(localCookie), 'a session cookie is set in local mode');

const localMe = await apiCall(lMe, 'GET', '/api/auth/me', { headers: { cookie: localCookie } });
eq(localMe.status, 200, 'the cookie identifies the local account');
eq(localMe.data.user.email, localEmail, 'me returns the local account');

const localHome = await apiCall(lHome, 'GET', '/api/home?date=' + localDate, { headers: { cookie: localCookie } });
eq(localHome.status, 200, 'home loads from the local store');
eq(localHome.data.daily.quests.length, 3, 'a local account gets three daily quests');

let localLast = null;
for (const quest of localHome.data.daily.quests) {
  localLast = await apiCall(lProgress, 'POST', '/api/daily/progress', {
    headers: { cookie: localCookie },
    body: { date: localDate, questId: quest.id, progress: quest.target }
  });
  eq(localLast.status, 200, 'local progress is accepted for ' + quest.id);
}
eq(localLast.data.completedNow, true, 'the local store records a completed day');
eq(localLast.data.streak.current, 1, 'the local store advances the streak');

const localLogin = await apiCall(lLogin, 'POST', '/api/auth/login', {
  body: { email: localEmail, password: 'longpassword' }
});
eq(localLogin.status, 200, 'the account signs in again from disk');
const localLogout = await apiCall(lLogout, 'POST', '/api/auth/logout', { headers: { cookie: localCookie } });
eq(localLogout.status, 200, 'logout works in local mode');

const localHealth = await apiCall(lHealth, 'GET', '/api/health');
eq(localHealth.status, 200, 'health reports the account service as usable without MongoDB');
eq(localHealth.data.mode, 'local', 'health names the local mode');
eq(localHealth.data.connected, true, 'the local store counts as connected');

ok(fs.existsSync(localFile), 'accounts are written to a local file');
const localRaw = fs.readFileSync(localFile, 'utf8');
ok(localRaw.indexOf(localEmail) !== -1, 'the signed-up account is stored on disk');
eq((localRaw.match(/"emailNorm"/g) || []).length, 1, 'exactly one account exists locally');
const dupSignup = await apiCall(lSignup, 'POST', '/api/auth/signup', {
  body: { name: 'Copy', email: localEmail, password: 'longpassword' }
});
eq(dupSignup.status, 409, 'the unique email rule is enforced in local mode too');

/* Back on the injected fake db for everything that follows. */
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true, children: [], paths: [], exports: fakeDbExports
};
localApiFiles.forEach(function (file) { delete require.cache[require.resolve(file)]; });
try { fs.rmSync(localFile, { force: true }); } catch (e) { /* ignore */ }
delete process.env.VOCABLAB_LOCAL_DB;

section('Local dev server (app + api, no Vercel)');

const devServer = await import('../scripts/dev-server.mjs');
ok(typeof devServer.isBlocked === 'function', 'the dev server exposes its path filter');
[
  '.env.local', '.env', '.data/local-db.json', '.git/config', 'my-sheet.txt',
  'my-sheet.txt.example', 'Cam_nang_ngu_phap_tieng_Phap_A2_B2.pdf',
  'Cac_thi_tieng_Phap.pdf', 'AGENTS.md', 'node_modules/mongodb/index.js'
].forEach(function (p) {
  ok(devServer.isBlocked(p), 'the dev server refuses to serve ' + p);
});
[
  'index.html', 'css/styles.css', 'js/app.js', 'api/health.js', 'lib/db.js',
  'README.md', 'package.json', 'scripts/dev-server.mjs'
].forEach(function (p) {
  ok(!devServer.isBlocked(p), 'the dev server still serves ' + p);
});

function walkApi(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).reduce(function (acc, entry) {
    const rel = dir + '/' + entry.name;
    if (entry.isDirectory()) return acc.concat(walkApi(rel));
    if (entry.name.endsWith('.js')) acc.push(rel);
    return acc;
  }, []);
}
const missingRoutes = walkApi('api').filter(function (file) {
  const route = '/api/' + file.replace(/^api\//, '').replace(/\.js$/, '');
  return !devServer.HANDLERS[route];
});
eq(missingRoutes, [], 'every serverless function has a route in the local dev server');
ok(fs.existsSync(path.join(root, 'package.json')) &&
  /"dev:local": "node scripts\/dev-server\.mjs"/.test(fs.readFileSync(path.join(root, 'package.json'), 'utf8')),
  'npm run dev:local points at the local server');

section('Offline quest queue');

const queueStore = new Map();
const queueEvents = [];
const queueSandbox = {
  window: null,
  Util: {
    lsGet: function (key, fallback) {
      const raw = queueStore.get('vocablab.' + key);
      if (raw == null) return fallback;
      try { return JSON.parse(raw); } catch (e) { return fallback; }
    },
    lsSet: function (key, value) { queueStore.set('vocablab.' + key, JSON.stringify(value)); return true; },
    lsRemove: function (key) { queueStore.delete('vocablab.' + key); }
  },
  CustomEvent: class QueueEvent {
    constructor(type, init) { this.type = type; this.detail = (init || {}).detail || null; }
  },
  AbortController: globalThis.AbortController,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date, JSON: JSON, Object: Object, Array: Array, String: String,
  Number: Number, Boolean: Boolean, Math: Math, Promise: Promise, Error: Error,
  isFinite: isFinite
};
queueSandbox.window = queueSandbox;
queueSandbox.window.dispatchEvent = function (event) { queueEvents.push(event); };
vm.createContext(queueSandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'js/account.js'), 'utf8'), queueSandbox,
  { filename: 'js/account.js' });
const QAccount = queueSandbox.Account;

let qMode = 'ok';
let qGate = null;
let qLastBody = null;
queueSandbox.fetch = async function (url, opts) {
  qLastBody = opts && opts.body ? JSON.parse(opts.body) : null;
  if (qGate) await qGate;
  if (qMode === 'offline') {
    const err = new Error('network down');
    err.name = 'TypeError';
    throw err;
  }
  if (qMode === 'unauthorized') {
    return { ok: false, status: 401, json: async function () { return { error: 'Please sign in.' }; } };
  }
  if (qMode === 'drop') {
    return { ok: false, status: 400, json: async function () { return { error: 'Date is out of range.' }; } };
  }
  return {
    ok: true, status: 200,
    json: async function () {
      return { daily: { date: qLastBody.date, quests: [] }, streak: null, completedNow: false };
    }
  };
};

QAccount.queueProgress('u1', '2026-10-23', 'mc30', 3);
eq(QAccount.queueCount('u1'), 1, 'quest progress is queued locally');

let releaseFlush;
qGate = new Promise(function (resolve) { releaseFlush = resolve; });
const inFlight = QAccount.flush('u1');
await new Promise(function (resolve) { setTimeout(resolve, 0); });
QAccount.queueProgress('u1', '2026-10-23', 'mc30', 7);
releaseFlush();
qGate = null;
const firstFlush = await inFlight;
eq(firstFlush.results.length, 1, 'the in-flight update reaches the API');
eq(QAccount.queueCount('u1'), 1, 'progress queued during a flush is not lost');
const queuedAfterRace = queueSandbox.Util.lsGet('questQueue', []);
eq(queuedAfterRace[0].progress, 7, 'the newer, higher progress is kept');

const secondFlush = await QAccount.flush('u1');
eq(secondFlush.results.length, 1, 'the kept update is retried');
eq(qLastBody.progress, 7, 'the retry sends the newer progress');
eq(QAccount.queueCount('u1'), 0, 'a successful flush clears the queue');

QAccount.queueProgress('u1', '2026-10-23', 'shadow3', 1);
qMode = 'offline';
const offlineFlush = await QAccount.flush('u1');
eq(offlineFlush.offline, true, 'a network failure is reported');
eq(QAccount.queueCount('u1'), 1, 'offline progress stays queued');
qMode = 'ok';

qMode = 'drop';
const dropFlush = await QAccount.flush('u1');
eq(dropFlush.results.length, 0, 'a rejected update is not reported as applied');
eq(QAccount.queueCount('u1'), 0, 'a permanently rejected update is removed');
ok(queueEvents.some(function (e) { return e.type === 'vocablab:quests-dropped'; }),
  'a dropped update announces itself');
qMode = 'ok';

QAccount.queueProgress('u1', '2026-10-23', 'cards20', 2);
qMode = 'unauthorized';
const expiredFlush = await QAccount.flush('u1');
eq(expiredFlush.unauthorized, true, 'an expired session is reported');
eq(QAccount.queueCount('u1'), 1, 'an expired session keeps the unsent queue');
qMode = 'ok';

QAccount.queueProgress('u2', '2026-10-23', 'grammar1', 1);
await QAccount.flush('u1'); // clear the signed-in user's remaining entry
const otherFlush = await QAccount.flush('u1');
eq(otherFlush.results.length, 0, 'another account’s updates are not sent');
eq(QAccount.queueCount('u2'), 1, 'another account’s queue is untouched');

QAccount.queueProgress('u3', '2026-10-23', 'mc30', 1);
qMode = 'offline';
let offlineLogoutFailed = false;
try { await QAccount.logout(); } catch (e) { offlineLogoutFailed = true; }
eq(offlineLogoutFailed, true, 'a network failure stops a local-only sign-out');
eq(QAccount.queueCount('u3'), 1, 'the queue survives a failed sign-out');
qMode = 'unauthorized';
await QAccount.logout();
eq(QAccount.queueCount('u3'), 0, 'an already-expired session can still clear local data');
qMode = 'ok';

/* ---------- summary ---------- */
console.log('\n' + '─'.repeat(46));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) {
  console.log('\nFailures:\n' + failures.map((f) => ' · ' + f).join('\n'));
  process.exit(1);
}
