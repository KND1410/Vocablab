/* =========================================================
   VocabLab — browser smoke test (node tests/browser-smoke.mjs [--live|--discover])
   Drives the real UI in headless Chrome and checks that the
   quiz actually reacts to clicks and keys.

   Needs Chrome/Chromium (set CHROME=/path/to/chrome to override).
   --live      also loads the sheet from my-sheet.txt (needs network)
   --discover  loads only the sheet *link* (no tab names) and checks
               that every tab is auto-detected — needs http, not file://
   ========================================================= */
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const discover = process.argv.includes('--discover');
const live = process.argv.includes('--live') || discover;

// --live / --discover read my-sheet.txt, which holds YOUR sheet link and tab
// names and is not part of the repo. Copy my-sheet.txt.example to create it.
if (live && !fs.existsSync(path.join(root, 'my-sheet.txt'))) {
  console.log('Browser smoke test skipped — no my-sheet.txt.');
  console.log('Copy my-sheet.txt.example to my-sheet.txt and add your sheet link + tab names.');
  process.exit(0);
}

/* ---------- find a browser ---------- */
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = ['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser', 'brave-browser',
    '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const c of candidates) {
    if (c.indexOf('/') === 0) { if (fs.existsSync(c)) return c; continue; }
    for (const dir of (process.env.PATH || '').split(':')) {
      const p = path.join(dir, c);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

/* ---------- tiny static server ---------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.csv': 'text/csv' };
function startServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(file));
  });
  return server;
}

/* ---------- a local “Ollama” that answers but sends no CORS headers ---------- */
function startFakeProvider() {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push(req.method + ' ' + req.url);
    res.writeHead(200, { 'content-type': 'application/json' }); // deliberately no Access-Control-Allow-Origin
    res.end(JSON.stringify(req.url.indexOf('/models') !== -1
      ? { object: 'list', data: [{ id: 'llama3.2', object: 'model' }] }
      : { choices: [{ message: { content: '{}' }, finish_reason: 'stop' }] }));
  });
  return { server: server, seen: seen };
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

/* ---------- a local AI that answers like a cloud provider (CORS on) ---------- */
/* It writes a paragraph out of the words in the request, and a correction when
   the request is a correction prompt — enough to drive the whole exercise. */
function startParaProvider() {
  const seen = [];
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS'
  };
  const server = http.createServer((req, res) => {
    seen.push(req.method + ' ' + req.url);
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }
    if (req.url.indexOf('/models') !== -1) {
      res.writeHead(200, Object.assign({ 'content-type': 'application/json' }, cors));
      res.end(JSON.stringify({ object: 'list', data: [{ id: 'test-model', object: 'model' }] }));
      return;
    }
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      // The prompt lists the sheet words as pretty-printed JSON. Read the user
      // message (the body is an envelope) and echo three of those words back, so
      // the exercise's own keyword check always accepts them.
      let promptText = body;
      try {
        const parsed = JSON.parse(body);
        promptText = (parsed.messages || []).map((m) => String(m.content || '')).join('\n');
      } catch (e) { /* not an envelope — use the raw body */ }
      const picks = [];
      const rx = /"term":\s*"((?:[^"\\]|\\.)*)",\s*"meaning":\s*"((?:[^"\\]|\\.)*)"/g;
      let m;
      while ((m = rx.exec(promptText)) && picks.length < 3) {
        picks.push({ term: JSON.parse('"' + m[1] + '"'), meaning: JSON.parse('"' + m[2] + '"') });
      }
      const keywords = picks.map((p, i) => ({
        term: p.term, meaning: p.meaning, note: i === 0 ? 'note for the first word' : ''
      }));
      const content = promptText.indexOf("LEARNER'S TRANSLATION") !== -1
        ? JSON.stringify({
          score: 82,
          corrected: 'Les habitants constatent que la pollution augmente.',
          notes: [{ text: 'les habittants', fix: 'les habitants', why: 'plural takes -s' }],
          used: keywords.map((k) => k.term),
          comment: 'Close — mind the plural.'
        })
        : JSON.stringify({
          paragraph: 'Les habitants constatent que la pollution augmente chaque année.',
          reference: 'Người dân nhận thấy ô nhiễm gia tăng mỗi năm.',
          keywords: keywords
        });
      res.writeHead(200, Object.assign({ 'content-type': 'application/json' }, cors));
      res.end(JSON.stringify({ choices: [{ message: { content: content }, finish_reason: 'stop' }] }));
    });
  });
  return { server: server, seen: seen };
}

/* ---------- build the probe page ---------- */
function buildProbe(deadPort, blockedPort, paraPort) {
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  const early = [
    '<script>',
    'window.__log = [];',
    'window.addEventListener("error", function (e) {',
    '  var t = e.target;',
    '  if (t && t.tagName === "SCRIPT") { window.__log.push("RESOURCE-ERROR: " + (t.src || "")); return; }',
    '  window.__log.push("JS-ERROR: " + e.message + " @ " + (e.filename || "?") + ":" + e.lineno + " " + ((e.error && e.error.stack) || ""));',
    '}, true);',
    'window.addEventListener("unhandledrejection", function (e) {',
    '  window.__log.push("JS-REJECT: " + (e.reason && (e.reason.stack || e.reason.message) || e.reason));',
    '});',
    '</script>'
  ].join('\n');

  // How the deck gets loaded: demo (offline), the real sheet link (--live),
  // or only the bare sheet link so auto-detection must find the tabs (--discover).
  const sheetText = live ? fs.readFileSync(path.join(root, 'my-sheet.txt'), 'utf8') : '';
  const sheetLinkOnly = sheetText.split('\n').map((l) => l.trim())
    .find((l) => /^https?:\/\//.test(l) && l[0] !== '#') || '';
  const setup = live
    ? [
        '    var links = ' + JSON.stringify(discover ? sheetLinkOnly : sheetText) + ';',
        '    var radios = document.querySelectorAll(\'input[name="sheetMode"]\');',
        '    for (var i = 0; i < radios.length; i++) if (radios[i].value === "links") radios[i].checked = true;',
        '    byId("inpLinks").value = links;',
        '    byId("btnLoadLinks").click();',
        '    await waitFor(function () { return /Loaded|Error/.test(byId("sheetStatus").textContent); }, 60000, "sheet deck");'
      ].join('\n')
    : [
        '    byId("btnDemo").click();',
        '    await waitFor(function () { return /Loaded/.test(byId("sheetStatus").textContent); }, 10000, "demo deck");'
      ].join('\n');

  const driver = [
    '<script>',
    '(function () {',
    '  var NL = String.fromCharCode(10);',
    '  var log = window.__log || (window.__log = []);',
    '  function flush() {',
    '    var pre = document.getElementById("probeOut");',
    '    if (!pre) { pre = document.createElement("pre"); pre.id = "probeOut"; document.documentElement.appendChild(pre); }',
    '    pre.textContent = "===PROBE===" + NL + log.join(NL) + NL + "===END===";',
    '  }',
    '  function out(m) { log.push(m); flush(); }',
    '  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }',
    '  function byId(id) { return document.getElementById(id); }',
    '  function vis(el) { return !!el && !el.hidden; }',
    '  function opts() { return Array.prototype.slice.call(document.querySelectorAll("#qOptions .option")); }',
    '  function feedback() { return vis(byId("qFeedback")); }',
    '  function screen(n) { return vis(byId("screen" + n)); }',
    '  function waitFor(fn, ms, label) {',
    '    var t0 = Date.now();',
    '    return (function loop() {',
    '      if (fn()) return Promise.resolve(true);',
    '      if (Date.now() - t0 > ms) { out("TIMEOUT: " + label); return Promise.resolve(false); }',
    '      return wait(40).then(loop);',
    '    })();',
    '  }',
    '  function setTypes(mc, blank, tr) {',
    '    byId("typeMc").checked = mc; byId("typeBlank").checked = blank; byId("typeTranslate").checked = tr;',
    '    ["typeMc", "typeBlank", "typeTranslate"].forEach(function (id) {',
    '      byId(id).dispatchEvent(new Event("change", { bubbles: true }));',
    '    });',
    '  }',
    '  /* The app caches the loaded deck in localStorage, so the probe knows the words. */',
    '  function deckWords() {',
    '    var out = [];',
    '    try {',
    '      var d = JSON.parse(localStorage.getItem("vocablab.deck") || "null");',
    '      (d.topics || []).forEach(function (t) { (t.words || []).forEach(function (w) { out.push(w); }); });',
    '    } catch (e) { /* ignore */ }',
    '    return out;',
    '  }',
    '  /* term ↔ meaning, but only for keys the sheet defines once: a sheet that gives',
    '     two words the same meaning cannot be answered from this map. */',
    '  function deckMap() {',
    '    var map = {}, dup = {};',
    '    deckWords().forEach(function (w) {',
    '      [[w.term, w.meaning], [w.meaning, w.term]].forEach(function (pair) {',
    '        if (!pair[0] || !pair[1]) return;',
    '        if (map[pair[0]] === undefined) map[pair[0]] = pair[1];',
    '        else if (map[pair[0]] !== pair[1]) dup[pair[0]] = true;',
    '      });',
    '    });',
    '    Object.keys(dup).forEach(function (k) { delete map[k]; });',
    '    return map;',
    '  }',
    '  function expectedFor(prompt) { return deckMap()[prompt] || null; }',
    '  /* What the app itself would say a picked option means. */',
    '  function counterparts(text, direction) {',
    '    var from = direction === "meaning2term" ? "term" : "meaning";',
    '    var to = from === "term" ? "meaning" : "term";',
    '    var out = [];',
    '    deckWords().forEach(function (w) {',
    '      if (out.length >= 2 || !w[from]) return;',
    '      if (!Quiz.sameAnswer(w[from], text)) return;',
    '      if (out.indexOf(w[to]) === -1) out.push(w[to]);',
    '    });',
    '    return out;',
    '  }',
    '  /* Answer-and-skip any multiple-choice question the probe cannot score, until',
    '     one with a computable answer is on screen. */',
    '  async function reachKnownMc(tries) {',
    '    for (var i = 0; i < tries; i++) {',
    '      if (!screen("Quiz") || !opts().length) return false;',
    '      if (expectedFor(byId("qPrompt").textContent) !== null) return true;',
    '      opts()[0].click();',
    '      await wait(120);',
    '      if (vis(byId("btnNext"))) byId("btnNext").click();',
    '      await wait(150);',
    '    }',
    '    return screen("Quiz") && opts().length > 0 && expectedFor(byId("qPrompt").textContent) !== null;',
    '  }',
    '  function sameText(a, b) {',
    '    var norm = function (s) { return String(s || "").toLowerCase().replace(/[.!?,;:()\\[\\]{}]/g, " ").replace(/\\s+/g, " ").trim(); };',
    '    return norm(a) === norm(b);',
    '  }',
    '  function optionTexts() {',
    '    return opts().map(function (b) {',
    '      var s = b.querySelector(".opt-text") || b.querySelector("span:last-child");',
    '      return s ? s.textContent : b.textContent;',
    '    });',
    '  }',
    '  function pickIndex(expected) {',
    '    var texts = optionTexts();',
    '    for (var i = 0; i < texts.length; i++) if (sameText(texts[i], expected)) return i;',
    '    return -1;',
    '  }',
    '  function firstItem(s) {',
    '    var parts = String(s || "").replace(/[\\[\\u005b][^\\]\\u005d]*[\\]\\u005d]/g, " ").split(/[\\/;|\\u002c]/);',
    '    for (var i = 0; i < parts.length; i++) if (parts[i].trim()) return parts[i].trim();',
    '    return String(s || "").trim();',
    '  }',
    '',
    '  async function main() {',
    '    if (document.readyState === "loading") {',
    '      await new Promise(function (r) { document.addEventListener("DOMContentLoaded", r); });',
    '    }',
    '    await wait(30);',
    '    if (!' + String(live) + ') localStorage.clear();',
    '    out("loaded: " + document.title);',
    setup,
    '    out("deck: " + byId("sheetStatus").textContent);',
    '    out("topics: " + document.querySelectorAll("#topicList .topic-item").length + " topics, " + byId("statWords").textContent + " words");',
    '    out("toasts: " + document.querySelectorAll("#toasts .toast").length + " notes=" + !byId("sheetWarnings").hidden);',
    '',
    '    /* Setup pills write through to the hidden select the quiz reads. */',
    '    document.querySelector("#segDifficulty .seg-btn[data-value=hard]").click();',
    '    byId("inpRequirement").value = "short sentences";',
    '    byId("inpRequirement").dispatchEvent(new Event("input", { bubbles: true }));',
    '    document.querySelector("#reqChips .req-chip[data-fill=\\"travel situations\\"]").click();',
    '    await wait(30);',
    '    var savedSetup = JSON.parse(localStorage.getItem("vocablab.settings"));',
    '    out("setup: difficulty=" + byId("selDifficulty").value +',
    '        " on=" + document.querySelector("#segDifficulty .seg-btn.is-on").getAttribute("data-value") +',
    '        " req=" + JSON.stringify(byId("inpRequirement").value) + " count=" + byId("reqCount").textContent +',
    '        " saved=" + savedSetup.difficulty + "/" + JSON.stringify(savedSetup.requirement));',
    '    document.querySelector("#segDifficulty .seg-btn[data-value=standard]").click();',
    '    byId("btnClearRequirement").click();',
    '    await wait(20);',
    '',
    '    setTypes(true, false, false);',
    '    byId("selCount").value = "15";',
    '    byId("selSource").value = "builtin";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && opts().length >= 2; }, 15000, "first mc question");',
    '    out("mc: options=" + opts().length + " badge=" + byId("qTypeBadge").textContent);',
    '    await reachKnownMc(4);',
    '',
    '    var opt = opts()[0];',
    '    opt.scrollIntoView({ block: "center" });',
    '    await wait(60);',
    '    var r = opt.getBoundingClientRect();',
    '    var top = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));',
    '    out("mc hittable=" + (opt === top || opt.contains(top)));',
    '    out("mc translations hidden=" + (document.querySelectorAll("#qOptions .opt-sub").length === 0));',
    '    var want = expectedFor(byId("qPrompt").textContent);',
    '    var idx = want === null ? -1 : pickIndex(want);',
    '    out("mc correct option found=" + (idx !== -1) + " (expected=" + JSON.stringify(want) + ")");',
    '    var wantBtn = idx === -1 ? opt : opts()[idx];',
    '    var wantRelated = counterparts(optionTexts()[idx === -1 ? 0 : idx], "term2meaning")',
    '      .concat(counterparts(optionTexts()[idx === -1 ? 0 : idx], "meaning2term"));',
    '    wantBtn.click();',
    '    await wait(150);',
    '    var wantSub = wantBtn.querySelector(".opt-sub");',
    '    out("mc after click: feedback=" + feedback() + " correct=" + document.querySelectorAll("#qOptions .option.correct").length +',
    '        " disabled=" + document.querySelectorAll("#qOptions .option:disabled").length + " nextVisible=" + vis(byId("btnNext")) +',
    '        " subs=" + document.querySelectorAll("#qOptions .opt-sub").length +',
    '        " answer-translated=" + (!!wantSub && wantRelated.some(function (t) { return wantSub.textContent.indexOf(t) !== -1; })) +',
    '        " title=" + JSON.stringify(byId("fbTitle").textContent));',
    '',
    '    /* Every option, including the one you picked wrongly, shows its translation. */',
    '    byId("btnNext").click();',
    '    await wait(150);',
    '    await reachKnownMc(4);',
    '    var texts = optionTexts();',
    '    var want3 = expectedFor(byId("qPrompt").textContent);',
    '    var okIdx = want3 === null ? -1 : pickIndex(want3);',
    '    var badIdx = okIdx === 0 ? 1 : 0;',
    '    var badText = texts[badIdx];',
    '    var related = counterparts(badText, "term2meaning").concat(counterparts(badText, "meaning2term"));',
    '    var before = document.querySelectorAll("#qOptions .opt-sub").length;',
    '    opts()[badIdx].click();',
    '    await wait(150);',
    '    var body = byId("fbBody").textContent;',
    '    var badSub = opts()[badIdx].querySelector(".opt-sub");',
    '    out("wrong pick: feedback=" + feedback() + " title=" + JSON.stringify(byId("fbTitle").textContent) +',
    '        " picked=" + JSON.stringify(badText) + " related=" + JSON.stringify(related) +',
    '        " hidden-before=" + (before === 0) +',
    '        " picked-translated=" + (!!badSub && related.length > 0 && related.some(function (t) { return badSub.textContent.indexOf(t) !== -1; })) +',
    '        " all-translated=" + (document.querySelectorAll("#qOptions .opt-sub").length === opts().length) +',
    '        " body-has-answer=" + (want3 === null || body.indexOf(want3) !== -1));',
    '',
    '    byId("btnNext").click();',
    '    await wait(150);',
    '    await reachKnownMc(4);',
    '    var want2 = expectedFor(byId("qPrompt").textContent);',
    '    var idx2 = want2 === null ? -1 : pickIndex(want2);',
    '    if (idx2 < 0) idx2 = 0;',
    '    document.dispatchEvent(new KeyboardEvent("keydown", { key: String(idx2 + 1), bubbles: true, cancelable: true }));',
    '    await wait(150);',
    '    out("keyboard answer: feedback=" + feedback() + " title=" + JSON.stringify(byId("fbTitle").textContent) + " subs=" + document.querySelectorAll("#qOptions .opt-sub").length + " score=" + byId("qScore").textContent);',
    '',
    '    var guard = 0;',
    '    while (screen("Quiz") && guard++ < 60) {',
    '      if (feedback()) byId("btnNext").click();',
    '      else if (opts().length) {',
    '        var w = expectedFor(byId("qPrompt").textContent);',
    '        var k = w === null ? -1 : pickIndex(w);',
    '        opts()[k === -1 ? 0 : k].click();',
    '      } else {',
    '        var w2 = expectedFor(byId("qPrompt").textContent);',
    '        if (w2 !== null) { byId("qInput").value = firstItem(w2); byId("btnSubmit").click(); }',
    '        else byId("btnDontKnow").click();',
    '      }',
    '      await wait(50);',
    '    }',
    '    out("finished quiz: results=" + screen("Results") + " fraction=" + byId("resFraction").textContent);',
    '',
    '    /* typed answers, incl. meanings that are comma lists */',
    '    setTypes(false, false, true);',
    '    byId("selCount").value = "10";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && vis(byId("qInputRow")); }, 15000, "first typed question");',
    '    out("typed question: badge=" + byId("qTypeBadge").textContent + " prompt=" + JSON.stringify(byId("qPrompt").textContent));',
    '    var answer = expectedFor(byId("qPrompt").textContent);',
    '    var skips = 0;',
    '    while (answer === null && skips++ < 4 && screen("Quiz")) {',
    '      byId("btnDontKnow").click();',
    '      await wait(150);',
    '      if (vis(byId("btnNext"))) byId("btnNext").click();',
    '      await wait(150);',
    '      answer = screen("Quiz") && vis(byId("qInputRow")) ? expectedFor(byId("qPrompt").textContent) : null;',
    '      out("typed question skipped=" + skips);',
    '    }',
    '    out("typed answer known=" + (answer !== null));',
    '    var used = answer === null ? "zzz" : String(answer);',
    '    var wasList = /[,;|\\/]/.test(used);',
    '    used = firstItem(used);',
    '    out("typed answer=" + JSON.stringify(used) + " was-list=" + wasList);',
    '    byId("qInput").value = used;',
    '    byId("btnSubmit").click();',
    '    await wait(150);',
    '    out("typed submit: feedback=" + feedback() + " title=" + JSON.stringify(byId("fbTitle").textContent));',
    '    byId("btnDontKnow").click();',
    '    await wait(150);',
    '    out("typed dont-know: feedback=" + feedback() + " shows=XXXX");',
    '    byId("btnExitQuiz").click();',
    '    await wait(200);',
    '',
    '    out("Quiz.grade(user case)=" + Quiz.grade({ type: "translate", answer: "làm tổn hại, đe dọa (kết quả, sự công bằng)" }, "làm tổn hại").verdict);',
    '    out("Quiz.sameAnswer(variant)=" + Quiz.sameAnswer("làm tổn hại", "làm tổn hại, đe dọa"));',
    '',
    '    /* The provider picker offers the whole list, fills in the base URL and',
    '       model of the provider picked, and remembers a key per provider. */',
    '    byId("btnSettings").click();',
    '    await wait(60);',
    '    out("simple mode: on=" + byId("modeSimple").classList.contains("is-on") +',
    '        " pane=" + !byId("paneSimple").hidden + " advanced-hidden=" + byId("aiAdvanced").hidden +',
    '        " models=" + byId("selSimpleModel").options.length +',
    '        " free-model=" + JSON.stringify(byId("selSimpleModel").value));',
    '    byId("modeAdvanced").click();',
    '    await wait(40);',
    '    out("advanced mode: on=" + byId("modeAdvanced").classList.contains("is-on") +',
    '        " advanced-visible=" + !byId("aiAdvanced").hidden + " simple-hidden=" + byId("paneSimple").hidden);',
    '    var providerIds = Array.prototype.map.call(byId("selProvider").options, function (o) { return o.value; });',
    '    out("providers: ids=" + JSON.stringify(providerIds) + " hint=" + JSON.stringify(byId("providerHint").textContent.slice(0, 60)));',
    '    byId("selProvider").value = "deepseek";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    await wait(40);',
    '    out("deepseek picked: base=" + byId("inpOaiBase").value + " model=" + byId("inpModel").value +',
    '        " gemini-pane=" + !byId("paneGemini").hidden + " oai-pane=" + !byId("paneOai").hidden +',
    '        " hint-has-link=" + /platform\\.deepseek\\.com/.test(byId("providerHint").innerHTML));',
    '    byId("inpOaiKey").value = "sk-deepseek-test";',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    byId("selProvider").value = "groq";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    await wait(40);',
    '    out("groq picked: base=" + byId("inpOaiBase").value + " key=" + JSON.stringify(byId("inpOaiKey").value));',
    '    byId("selProvider").value = "deepseek";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    await wait(40);',
    '    out("deepseek again: key=" + JSON.stringify(byId("inpOaiKey").value) +',
    '        " stored=" + JSON.stringify(Object.keys(JSON.parse(localStorage.getItem("vocablab.settings")).aiConns)));',
    '    byId("selProvider").value = "gemini";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    await wait(40);',
    '    out("back to gemini: gemini-pane=" + !byId("paneGemini").hidden + " oai-pane=" + !byId("paneOai").hidden);',
    '',
    '    /* A key copied from another provider is why a 401 happens; the app has to',
    '       say that at paste time, not after a failed round trip. */',
    '    byId("selProvider").value = "groq";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    await wait(40);',
    '    byId("inpOaiKey").value = "sk-or-v1-" + "0".repeat(64);',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    await wait(40);',
    '    out("wrong key: hidden=" + byId("aiIssue").hidden + " names=" + /OpenRouter/.test(byId("aiIssue").textContent) +',
    '        "/" + /Groq/.test(byId("aiIssue").textContent));',
    '    byId("inpOaiKey").value = "gsk_" + "0".repeat(52);',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    await wait(40);',
    '    out("right key: hidden=" + byId("aiIssue").hidden +',
    '        " saved=" + JSON.parse(localStorage.getItem("vocablab.settings")).oaiKey.length);',
    '    byId("inpOaiKey").value = "Bearer " + "gsk_" + "0".repeat(52);',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    await wait(40);',
    '    out("bearer key: saved=" + JSON.stringify(JSON.parse(localStorage.getItem("vocablab.settings")).oaiKey.slice(0, 12)));',
    '    byId("inpOaiKey").value = "grok_" + "1".repeat(32) + "_" + "2".repeat(64);',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    await wait(40);',
    '    out("grok key: names=" + /gsk_/.test(byId("aiIssue").textContent) + "/" + /56/.test(byId("aiIssue").textContent) +',
    '        "/" + /102/.test(byId("aiIssue").textContent));',
    '',
    '    /* Ollama (or any local server) with nothing listening: no key needed, but the',
    '       failure has to say what to do — and the quiz must still run. */',
    '    byId("selProvider").value = "openai";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("inpOaiBase").value = "http://127.0.0.1:' + deadPort + '/v1";',
    '    byId("inpOaiBase").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("inpOaiKey").value = "";',
    '    byId("inpOaiKey").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("settingsDialog").close();',
    '    setTypes(true, false, false);',
    '    byId("selCount").value = "10";',
    '    byId("selSource").value = "ai";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && opts().length >= 2; }, 25000, "quiz with a dead AI provider");',
    '    out("dead AI: toast=" + JSON.stringify(Array.prototype.map.call(',
    '      document.querySelectorAll("#toasts .toast"), function (t) { return t.textContent; }).join(" | ")));',
    '    out("dead AI: issue-shown=" + !byId("aiIssue").hidden + " issue=" + JSON.stringify(byId("aiIssue").textContent));',
    '    out("dead AI: still-quizzing=" + (opts().length >= 2 && Quiz && byId("qPrompt").textContent.length > 0));',
    '    var switchBtn = byId("btnAiUseKey");',
    '    out("dead AI: offers-switch=" + !!switchBtn);',
    '    if (switchBtn) { switchBtn.click(); await wait(60); }',
    '    out("dead AI: switched-to=" + byId("selProvider").value + " gemini-pane=" + !byId("paneGemini").hidden +',
    '        " issue-hidden=" + byId("aiIssue").hidden);',
    '    byId("btnExitQuiz").click();',
    '    await wait(200);',
    '',
    '    /* A server that answers but refuses this page (CORS): say which half is broken. */',
    '    byId("btnSettings").click();',
    '    await wait(60);',
    '    byId("selProvider").value = "openai";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("inpOaiBase").value = "http://127.0.0.1:' + blockedPort + '/v1";',
    '    byId("inpOaiBase").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("settingsDialog").close();',
    '    byId("selSource").value = "ai";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && opts().length >= 2; }, 25000, "quiz with a blocked AI provider");',
    '    var toastList = document.querySelectorAll("#toasts .toast");',
    '    out("blocked AI: toast=" + JSON.stringify(toastList.length ? toastList[toastList.length - 1].textContent : ""));',
    '    out("blocked AI: issue=" + JSON.stringify(byId("aiIssue").textContent));',
    '    out("blocked AI: still-quizzing=" + (opts().length >= 2));',
    '    byId("btnExitQuiz").click();',
    '    await wait(200);',
    '',
    '    /* Paragraph translation is its own practice mode: no quiz type, its own',
    '       direction/count and start button, and an AI correction that keeps the',
    '       learner’s wording. */',
    '    byId("btnSettings").click();',
    '    await wait(60);',
    '    byId("selProvider").value = "openai";',
    '    byId("selProvider").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("inpOaiBase").value = "http://127.0.0.1:' + paraPort + '/v1";',
    '    byId("inpOaiBase").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("inpOaiKey").value = "gsk_" + "0".repeat(52);',
    '    byId("inpOaiKey").dispatchEvent(new Event("input", { bubbles: true }));',
    '    byId("settingsDialog").close();',
    '    await wait(80);',
    '    document.querySelector("#segPractice .seg-btn[data-value=paragraph]").click();',
    '    await wait(40);',
    '    var paraSaved = JSON.parse(localStorage.getItem("vocablab.settings"));',
    '    out("paragraph: mode=" + byId("selPractice").value + " pane=" + !byId("paraSetupPane").hidden +',
    '        " quiz-pane-hidden=" + byId("quizSetupPane").hidden + " start-enabled=" + !byId("btnStartParagraph").disabled +',
    '        " saved=" + paraSaved.practiceMode);',
    '    byId("selParaDir").value = "fr2vi";',
    '    byId("selParaDir").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("selParaCount").value = "1";',
    '    byId("selParaCount").dispatchEvent(new Event("change", { bubbles: true }));',
    '    byId("btnStartParagraph").click();',
    '    await waitFor(function () { return screen("Quiz") && vis(byId("qParagraph")); }, 25000, "paragraph card");',
    '    out("paragraph start: issue=" + JSON.stringify(byId("aiIssue").textContent.slice(0, 100)));',
    '    out("paragraph card: dir=" + byId("paraDir").textContent +',
    '        " text=" + (byId("paraText").textContent.length > 40) +',
    '        " words=" + document.querySelectorAll("#paraKeywords .pw").length +',
    '        " prompt-hidden=" + byId("qPrompt").hidden + " textarea=" + vis(byId("paraInput")));',
    '    byId("paraInput").value = "Les habittants constatent que la pollution augmente.";',
    '    byId("paraInput").dispatchEvent(new Event("input", { bubbles: true }));',
    '    out("paragraph count=" + byId("paraCount").textContent);',
    '    byId("btnParaSubmit").click();',
    '    await waitFor(function () { return !byId("paraFeedback").hidden; }, 20000, "paragraph feedback");',
    '    var pfScore = document.querySelector("#paraFeedback .pf-score");',
    '    out("paragraph feedback: score=" + (pfScore ? pfScore.textContent : "none") +',
    '        " notes=" + document.querySelectorAll("#paraFeedback .pf-note").length +',
    '        " used=" + document.querySelectorAll("#paraFeedback .pf-words li.ok").length +',
    '        " corrected=" + !!document.querySelector("#paraFeedback .pf-fixed") +',
    '        " next=" + !!document.querySelector("#paraFeedback .pf-actions button"));',
    '    document.querySelector("#paraFeedback .pf-actions button").click();',
    '    await waitFor(function () { return screen("Results"); }, 20000, "results after a paragraph");',
    '    out("paragraph results=" + screen("Results") + " fraction=" + byId("resFraction").textContent +',
    '        " title=" + JSON.stringify(byId("resTitle").textContent) +',
    '        " new=" + JSON.stringify(byId("btnNewQuiz").textContent) +',
    '        " back=" + !byId("btnBackSetup").hidden);',
    '',
    '    byId("btnFlashcards").click();',
    '    await waitFor(function () { return screen("Flashcards"); }, 8000, "flashcards");',
    '    out("flashcards: first=" + JSON.stringify(byId("fcTerm").textContent.slice(0, 20)) + " progress=" + byId("fcProgress").textContent);',
    '    byId("fcCard").click();',
    '    await wait(150);',
    '    out("flashcard flipped=" + /flipped/.test(byId("fcCard").className));',
    '    byId("btnFcGood").click();',
    '    await wait(150);',
    '    out("flashcard next=" + byId("fcProgress").textContent);',
    '',
    '    /* Grammar course: course map, lesson, exercise, progress and tutor. */',
    '    out("grammar study: pct=" + byId("studyPct").textContent + " btn=" + JSON.stringify(byId("btnStudy").textContent));',
    '    byId("btnStudy").click();',
    '    await waitFor(function () { return screen("Grammar") && document.querySelectorAll("#screenGrammar .grammar-lesson-card").length === 18; }, 8000, "grammar course");',
    '    var viToggle = document.querySelector("#screenGrammar [data-action=set-lang][data-lang=vi]");',
    '    if (viToggle) viToggle.click();',
    '    await wait(50);',
    '    out("grammar course: visible=" + screen("Grammar") + " cards=" + document.querySelectorAll("#screenGrammar .grammar-lesson-card").length +',
    '        " parts=" + document.querySelectorAll("#screenGrammar .grammar-part").length +',
    '        " title=" + JSON.stringify(document.querySelector("#screenGrammar .grammar-title").textContent) +',
    '        " back=" + !!document.querySelector("#screenGrammar [data-action=exit]"));',
    '    document.querySelector("#screenGrammar .grammar-lesson-card[data-id=present]").click();',
    '    await waitFor(function () { return document.querySelector("#screenGrammar .lesson-title"); }, 8000, "grammar lesson");',
    '    out("grammar lesson: title=" + JSON.stringify(document.querySelector("#screenGrammar .lesson-title").textContent) +',
    '        " subtitle=" + JSON.stringify(document.querySelector("#screenGrammar .lesson-subtitle").textContent) +',
    '        " exercises=" + document.querySelectorAll("#screenGrammar .exercise").length +',
    '        " tutor=" + !!document.querySelector("#screenGrammar .lesson-tutor") +',
    '        " tables=" + document.querySelectorAll("#screenGrammar .lesson-table").length);',
    '    var gex = document.querySelector("#screenGrammar .exercise");',
    '    var ginput = gex.querySelector(".blank-input");',
    '    ginput.value = "prenons";',
    '    gex.querySelector("[data-action=check]").click();',
    '    await wait(80);',
    '    out("grammar exercise: correct=" + gex.classList.contains("is-correct") +',
    '        " feedback=" + JSON.stringify(gex.querySelector("[data-feedback]").textContent).slice(0, 70) +',
    '        " stored=" + /"present"/.test(localStorage.getItem("vocablab.grammarProgress") || ""));',
    '    var completeBtn = document.querySelector("#screenGrammar [data-action=toggle-complete]");',
    '    if (completeBtn.classList.contains("is-done")) { completeBtn.click(); await wait(40); }',
    '    document.querySelector("#screenGrammar [data-action=toggle-complete]").click();',
    '    await wait(60);',
    '    out("grammar complete: study=" + byId("studyPct").textContent +',
    '        " button=" + JSON.stringify(document.querySelector("#screenGrammar [data-action=toggle-complete]").textContent) +',
    '        " badge=" + JSON.stringify(document.querySelector("#screenGrammar [data-status-badge]").textContent));',
    '    document.querySelector("#screenGrammar [data-action=course]").click();',
    '    await wait(60);',
    '    out("grammar course done: done=" + document.querySelectorAll("#screenGrammar .grammar-lesson-card.is-done").length +',
    '        " pct=" + JSON.stringify(byId("studyPct").textContent));',
    '',
    '    /* A translation answer must reveal the sentence, not just its first letter. */',
    '    document.querySelector("#screenGrammar .grammar-lesson-card[data-id=revision]").click();',
    '    await waitFor(function () { return document.querySelector("#screenGrammar .exercise[data-ex=\\"26\\"]"); }, 5000, "revision exercise");',
    '    var revealBox = document.querySelector("#screenGrammar .exercise[data-ex=\\"26\\"]");',
    '    revealBox.querySelector("[data-action=show-answer]").click();',
    '    await wait(40);',
    '    out("grammar reveal: " + JSON.stringify(revealBox.querySelector("[data-feedback]").textContent).slice(0, 120));',
    '    document.querySelector("#screenGrammar [data-action=course]").click();',
    '    await wait(40);',
    '',
    '    /* Stub the transport so the tutor UI can be tested without a network call. */',
    '    var originalAskTutor = Ai.askTutor;',
    '    Ai.askTutor = async function () { return { text: "TUTOR-OK" }; };',
    '    document.querySelector("#screenGrammar .grammar-lesson-card[data-id=present]").click();',
    '    await waitFor(function () { return document.querySelector("#screenGrammar .lesson-tutor"); }, 5000, "tutor lesson");',
    '    document.querySelector("#screenGrammar [data-action=tutor-preset][data-preset=explain]").click();',
    '    await wait(120);',
    '    var tutorMsgs = document.querySelectorAll("#screenGrammar .tutor-msg");',
    '    out("grammar tutor: messages=" + tutorMsgs.length +',
    '        " last=" + JSON.stringify(tutorMsgs.length ? tutorMsgs[tutorMsgs.length - 1].textContent : ""));',
    '    Ai.askTutor = originalAskTutor;',
    '    document.querySelector("#screenGrammar [data-action=set-lang][data-lang=en]").click();',
    '    await wait(60);',
    '    out("grammar lang: subtitle=" + JSON.stringify(document.querySelector("#screenGrammar .lesson-subtitle").textContent) +',
    '        " on=" + document.querySelector("#screenGrammar [data-action=set-lang].is-on").getAttribute("data-lang"));',
    '    document.querySelector("#screenGrammar [data-action=set-lang][data-lang=vi]").click();',
    '    await wait(40);',
    '    document.querySelector("#screenGrammar [data-action=exit]").click();',
    '    await wait(50);',
    '    out("grammar exit: welcome=" + screen("Welcome") + " grammar-hidden=" + !screen("Grammar"));',
    '    out("DONE");',
    '  }',
    '',
    '  main().catch(function (e) { out("DRIVER-THROW: " + ((e && e.stack) || e)); }).then(function () { out("PROBE-END"); });',
    '})();',
    '</script>'
  ].join('\n');

  html = html.replace('<body>', '<body>\n' + early).replace('</body>', driver + '\n</body>');
  fs.writeFileSync(path.join(root, '_probe.html'), html);
}

/* ---------- run ---------- */
function runChrome(chrome, url) {
  const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--window-size=1280,1800', '--virtual-time-budget=60000', '--dump-dom', url];
  return new Promise((resolve) => {
    execFile(chrome, args, { maxBuffer: 64 * 1024 * 1024, timeout: 180000 }, (err, stdout) => resolve(stdout || ''));
  });
}

let passed = 0, failed = 0;
const failures = [];
function check(cond, label, extra) {
  if (cond) { passed++; console.log('  ✓ ' + label); }
  else { failed++; failures.push(label); console.log('  ✕ ' + label + (extra ? '  [' + extra + ']' : '')); }
}

const chrome = findChrome();
if (!chrome) {
  console.log('Browser smoke test skipped — no Chrome/Chromium found (set CHROME=/path/to/chrome).');
  process.exit(0);
}

const server = startServer();
const port = await freePort();
const deadPort = await freePort(); // nothing listens here: models the “Ollama is not running” case
const blockedPort = await freePort(); // answers, but sends no CORS headers: models “Ollama is running, page refused”
const blocked = startFakeProvider();
const para = startParaProvider(); // a working provider (CORS on) for the paragraph exercise
const paraPort = await freePort();
await new Promise((r) => server.listen(port, '127.0.0.1', r));
await new Promise((r) => blocked.server.listen(blockedPort, '127.0.0.1', r));
await new Promise((r) => para.server.listen(paraPort, '127.0.0.1', r));
buildProbe(deadPort, blockedPort, paraPort);

console.log('Browser smoke test (' + (discover ? 'bare link, auto-discovery' : live ? 'live sheet' : 'demo deck') + ') → ' + chrome);
const dom = await runChrome(chrome, 'http://127.0.0.1:' + port + '/_probe.html');
fs.rmSync(path.join(root, '_probe.html'), { force: true });
server.close();
blocked.server.close();
para.server.close();

const pre = dom.match(/<pre id="probeOut">([\s\S]*?)<\/pre>/);
const block = pre ? pre[1].match(/===PROBE===([\s\S]*?)===END===/) : null;
const log = block ? block[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
if (process.env.PROBE_LOG) console.log('\n--- probe log ---\n' + log + '\n--- end probe log ---\n');
if (!block) {
  console.log(dom.slice(0, 800));
  console.log('Could not read the probe output from the page.');
  process.exit(1);
}
console.log(log.trim().split('\n').map((l) => '    ' + l).join('\n'));

check(/^loaded: /m.test(log), 'app boots (scripts load, init runs)');
check(/^deck: Loaded/m.test(log), 'deck loads', (log.match(/^deck: .*/m) || [''])[0]);
check(/^toasts: [01] notes=/m.test(log), 'one load message, not a success toast plus a warning');
check(/^setup: difficulty=hard on=hard req="short sentences, travel situations" count=\d+\/600 saved=hard\/"short sentences, travel situations"/m.test(log),
  'difficulty pills and the optional focus are saved and fed to the quiz',
  (log.match(/^setup: .*/m) || [''])[0]);
// The welcome card promises "Just paste the sheet link — every tab becomes a topic".
if (discover) {
  check(/^topics: ([2-9]|\d\d+) topics/m.test(log), 'a bare sheet link auto-detects every tab',
    (log.match(/^topics: .*/m) || [''])[0]);
}
check(/^mc: options=[2-9]/m.test(log), 'multiple choice renders options');
check(/mc hittable=true/m.test(log), 'options are clickable (nothing covers them)');
check(/mc translations hidden=true/m.test(log), 'translations are hidden until the answer is in');
check(/mc correct option found=true/m.test(log), 'the correct option is among the choices');
check(/mc after click: feedback=true correct=1[^\n]*answer-translated=true/m.test(log),
  'clicking an option reveals its translation', (log.match(/^mc after click: .*/m) || [''])[0]);
check(/mc after click: feedback=true correct=1[^\n]*title="Correct!"/m.test(log), 'clicking the correct option is graded correct');
check(/keyboard answer: feedback=true title="Correct!" subs=[1-9]/m.test(log), 'digit keys answer correctly and translate the options');
check(/wrong pick: feedback=true title="Not quite"[^\n]*hidden-before=true[^\n]*picked-translated=true[^\n]*all-translated=true[^\n]*body-has-answer=true/m.test(log),
  'every option shows its translation after a wrong pick', (log.match(/^wrong pick: .*/m) || [''])[0]);
check(/finished quiz: results=true fraction=\d+\/\d+/m.test(log), 'quiz reaches the results screen');
check(/typed answer known=true/m.test(log), 'the probe found a typed question it can score');
check(/typed question: badge=Translate/m.test(log), 'typed questions render an input');
check(/typed submit: feedback=true title="Correct!"/m.test(log), 'a correct typed answer is graded correct');
check(/typed dont-know: feedback=true/m.test(log), '"I don\'t know" reveals the answer');
check(/Quiz\.grade\(user case\)=correct/m.test(log), 'comma-list meaning accepts one of its items');
check(/Quiz\.sameAnswer\(variant\)=true/m.test(log), 'an alternative option matches the answer');
check(/^providers: ids=\["pollinations","gemini","groq","cerebras","openrouter","mistral","deepseek","xai","cloudflare","ollama","openai"\]/m.test(log),
  'Settings → AI lists the whole provider list, not just Gemini', (log.match(/^providers: .*/m) || [''])[0]);
check(/^simple mode: on=true pane=true advanced-hidden=true models=[1-9]\d* free-model="[^"]+"/m.test(log),
  'Settings starts in Simple mode — free AI with no key to paste', (log.match(/^simple mode: .*/m) || [''])[0]);
check(/^advanced mode: on=true advanced-visible=true simple-hidden=true/m.test(log),
  'Advanced reveals the provider list and key fields', (log.match(/^advanced mode: .*/m) || [''])[0]);
check(/^deepseek picked: base=https:\/\/api\.deepseek\.com\/v1 model=deepseek-flash gemini-pane=false oai-pane=true hint-has-link=true/m.test(log),
  'picking DeepSeek fills in its base URL, model and key link', (log.match(/^deepseek picked: .*/m) || [''])[0]);
check(/^groq picked: base=https:\/\/api\.groq\.com\/openai\/v1 key=""$/m.test(log),
  'picking another provider loads its own base URL', (log.match(/^groq picked: .*/m) || [''])[0]);
check(/^deepseek again: key="sk-deepseek-test" stored=\["deepseek","groq"\]/m.test(log),
  'each provider keeps its own key, so switching back needs no retyping',
  (log.match(/^deepseek again: .*/m) || [''])[0]);
check(/^back to gemini: gemini-pane=true oai-pane=false/m.test(log),
  'switching back to Gemini shows the Gemini key field', (log.match(/^back to gemini: .*/m) || [''])[0]);
check(/^wrong key: hidden=false names=true\/true/m.test(log),
  'a key belonging to another provider is identified at paste time',
  (log.match(/^wrong key: .*/m) || [''])[0]);
check(/^right key: hidden=true saved=56/m.test(log),
  'a matching key clears the warning and is what gets saved',
  (log.match(/^right key: .*/m) || [''])[0]);
check(/^bearer key: saved="gsk_00000000"/m.test(log),
  'a key pasted with “Bearer ” in front is stored as the bare key',
  (log.match(/^bearer key: .*/m) || [''])[0]);
check(/^grok key: names=true\/true\/true/m.test(log),
  'a “grok_” key on Groq says which console it must come from instead',
  (log.match(/^grok key: .*/m) || [''])[0]);
check(/^dead AI: toast="[^"]*AI generation issue — built-in questions cover the rest\.[^"]*nothing is running there[^"]*not a web service[^"]*ollama serve/m.test(log),
  'a local AI server with nothing listening explains how to start it',
  (log.match(/^dead AI: toast=.*/m) || [''])[0]);
check(/^dead AI: issue-shown=true issue="[^"]*ollama serve/m.test(log),
  'the same how-to-fix text is kept in Settings → AI');
check(/^dead AI: still-quizzing=true/m.test(log), 'the quiz still runs on built-in questions');
check(/^dead AI: offers-switch=true/m.test(log), 'the dead-provider error offers a way out that needs no install');
check(/^dead AI: switched-to=gemini gemini-pane=true issue-hidden=true/m.test(log),
  'one click switches to a key-based provider and clears the error');
check(/^blocked AI: toast="AI generation issue[^"]*a server answered, but it blocked this page[^"]*OLLAMA_ORIGINS/m.test(log),
  'a server that answers but refuses the page is reported as a CORS block',
  (log.match(/^blocked AI: toast=.*/m) || [''])[0]);
check(/^blocked AI: still-quizzing=true/m.test(log), 'the quiz still runs when the provider blocks the page');
check(blocked.seen.some((r) => /\/v1\/models/.test(r)), 'the reachability probe really reached the local server');
check(blocked.seen.some((r) => /\/v1\/chat\/completions/.test(r)), 'the provider really was called before the fallback');
check(/^paragraph: mode=paragraph pane=true quiz-pane-hidden=true start-enabled=true saved=paragraph/m.test(log),
  'paragraph translation is its own practice mode, not a quiz type',
  (log.match(/^paragraph: .*/m) || [''])[0]);
check(/^paragraph card: dir=French → Vietnamese text=true words=[3-9] prompt-hidden=true textarea=true/m.test(log),
  'the paragraph card shows the text, the words to use and a textarea',
  (log.match(/^paragraph card: .*/m) || [''])[0]);
check(/^paragraph count=\d+ words/m.test(log), 'the textarea counts what you type',
  (log.match(/^paragraph count=.*/m) || [''])[0]);
check(/^paragraph feedback: score=82\/100 notes=1 used=3 corrected=true next=true/m.test(log),
  'the AI correction shows a score, the fixes, the words used and a way on',
  (log.match(/^paragraph feedback: .*/m) || [''])[0]);
check(/^paragraph results=true fraction=1\/1 title="[^"]*translation[^"]*" new="New paragraph" back=true/m.test(log),
  'a paragraph result is a practice result with its own restart and setup button',
  (log.match(/^paragraph results=.*/m) || [''])[0]);
check(/flashcard flipped=true/m.test(log), 'flashcard flips');
check(/flashcard next=\d+\s*\/\s*\d+/m.test(log), 'flashcard advances');
check(/^grammar course: visible=true cards=18 parts=7 title="Các thì tiếng Pháp" back=true/m.test(log),
  'the Study card opens a course map with all 18 chapters and a way back',
  (log.match(/^grammar course: .*/m) || [''])[0]);
check(/^grammar lesson: title="Présent" subtitle="Thì hiện tại" exercises=6 tutor=true tables=[1-9]/m.test(log),
  'a chapter opens as a full lesson with tables, exercises and the AI tutor',
  (log.match(/^grammar lesson: .*/m) || [''])[0]);
check(/^grammar exercise: correct=true feedback="Chính xác!/m.test(log) &&
  /stored=true/m.test(log),
  'a correct answer is graded and saved in this browser',
  (log.match(/^grammar exercise: .*/m) || [''])[0]);
check(/^grammar complete: study=\d+ \/ 18 button="Đã học xong ✓" badge="Đã xong"/m.test(log),
  'marking a lesson complete updates the lesson and the Study card',
  (log.match(/^grammar complete: .*/m) || [''])[0]);
check(/^grammar course done: done=[1-9]\d* pct="\d+ \/ 18"/m.test(log),
  'the course map shows completed chapters',
  (log.match(/^grammar course done: .*/m) || [''])[0]);
check(/^grammar reveal: .*J’habite ici depuis trois ans/m.test(log),
  'revealing a translation answer shows the whole sentence',
  (log.match(/^grammar reveal: .*/m) || [''])[0]);
check(/^grammar tutor: messages=2 last="[^"]*TUTOR-OK[^"]*"/m.test(log),
  'the AI tutor sends the lesson context and renders the reply',
  (log.match(/^grammar tutor: .*/m) || [''])[0]);
check(/^grammar lang: subtitle="The present" on=en/m.test(log),
  'the explanation language can switch between Vietnamese and English',
  (log.match(/^grammar lang: .*/m) || [''])[0]);
check(/^grammar exit: welcome=true grammar-hidden=true/m.test(log),
  'the course has a working route back to vocabulary');
check(/DONE/m.test(log), 'probe ran to the end');
check(!/JS-ERROR|JS-REJECT|RESOURCE-ERROR|DRIVER-THROW|TIMEOUT/m.test(log), 'no JavaScript errors or timeouts',
  (log.match(/^(JS-ERROR|JS-REJECT|RESOURCE-ERROR|DRIVER-THROW|TIMEOUT).*/m) || [''])[0]);

console.log('\n' + '─'.repeat(46));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) { console.log('Failures:\n · ' + failures.join('\n · ')); process.exit(1); }
