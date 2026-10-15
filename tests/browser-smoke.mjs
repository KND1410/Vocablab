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

/* ---------- build the probe page ---------- */
function buildProbe() {
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
    '  function deckMap() {',
    '    var map = {};',
    '    try {',
    '      var d = JSON.parse(localStorage.getItem("vocablab.deck") || "null");',
    '      (d.topics || []).forEach(function (t) {',
    '        (t.words || []).forEach(function (w) { map[w.term] = w.meaning; map[w.meaning] = w.term; });',
    '      });',
    '    } catch (e) { /* ignore */ }',
    '    return map;',
    '  }',
    '  function expectedFor(prompt) { return deckMap()[prompt] || null; }',
    '  function sameText(a, b) {',
    '    var norm = function (s) { return String(s || "").toLowerCase().replace(/[.!?,;:()\\[\\]{}]/g, " ").replace(/\\s+/g, " ").trim(); };',
    '    return norm(a) === norm(b);',
    '  }',
    '  function optionTexts() {',
    '    return opts().map(function (b) { var s = b.querySelector("span:last-child"); return s ? s.textContent : b.textContent; });',
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
    '    setTypes(true, false, false);',
    '    byId("selCount").value = "10";',
    '    byId("selSource").value = "builtin";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && opts().length >= 2; }, 15000, "first mc question");',
    '    out("mc: options=" + opts().length + " badge=" + byId("qTypeBadge").textContent);',
    '',
    '    var opt = opts()[0];',
    '    opt.scrollIntoView({ block: "center" });',
    '    await wait(60);',
    '    var r = opt.getBoundingClientRect();',
    '    var top = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));',
    '    out("mc hittable=" + (opt === top || opt.contains(top)));',
    '    var want = expectedFor(byId("qPrompt").textContent);',
    '    var idx = want === null ? -1 : pickIndex(want);',
    '    out("mc correct option found=" + (idx !== -1) + " (expected=" + JSON.stringify(want) + ")");',
    '    (idx === -1 ? opt : opts()[idx]).click();',
    '    await wait(150);',
    '    out("mc after click: feedback=" + feedback() + " correct=" + document.querySelectorAll("#qOptions .option.correct").length +',
    '        " disabled=" + document.querySelectorAll("#qOptions .option:disabled").length + " nextVisible=" + vis(byId("btnNext")) +',
    '        " title=" + JSON.stringify(byId("fbTitle").textContent));',
    '',
    '    byId("btnNext").click();',
    '    await wait(150);',
    '    var want2 = expectedFor(byId("qPrompt").textContent);',
    '    var idx2 = want2 === null ? 0 : pickIndex(want2);',
    '    if (idx2 < 0) idx2 = 0;',
    '    document.dispatchEvent(new KeyboardEvent("keydown", { key: String(idx2 + 1), bubbles: true, cancelable: true }));',
    '    await wait(150);',
    '    out("keyboard answer: feedback=" + feedback() + " title=" + JSON.stringify(byId("fbTitle").textContent) + " score=" + byId("qScore").textContent);',
    '',
    '    var guard = 0;',
    '    while (screen("Quiz") && guard++ < 40) {',
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
    '    byId("selCount").value = "5";',
    '    byId("btnStart").click();',
    '    await waitFor(function () { return screen("Quiz") && vis(byId("qInputRow")); }, 15000, "first typed question");',
    '    out("typed question: badge=" + byId("qTypeBadge").textContent + " prompt=" + JSON.stringify(byId("qPrompt").textContent));',
    '    var answer = expectedFor(byId("qPrompt").textContent);',
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
    '    byId("btnFlashcards").click();',
    '    await waitFor(function () { return screen("Flashcards"); }, 8000, "flashcards");',
    '    out("flashcards: first=" + JSON.stringify(byId("fcTerm").textContent.slice(0, 20)) + " progress=" + byId("fcProgress").textContent);',
    '    byId("fcCard").click();',
    '    await wait(150);',
    '    out("flashcard flipped=" + /flipped/.test(byId("fcCard").className));',
    '    byId("btnFcGood").click();',
    '    await wait(150);',
    '    out("flashcard next=" + byId("fcProgress").textContent);',
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
await new Promise((r) => server.listen(port, '127.0.0.1', r));
buildProbe();

console.log('Browser smoke test (' + (discover ? 'bare link, auto-discovery' : live ? 'live sheet' : 'demo deck') + ') → ' + chrome);
const dom = await runChrome(chrome, 'http://127.0.0.1:' + port + '/_probe.html');
fs.rmSync(path.join(root, '_probe.html'), { force: true });
server.close();

const pre = dom.match(/<pre id="probeOut">([\s\S]*?)<\/pre>/);
const block = pre ? pre[1].match(/===PROBE===([\s\S]*?)===END===/) : null;
const log = block ? block[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
if (!block) {
  console.log(dom.slice(0, 800));
  console.log('Could not read the probe output from the page.');
  process.exit(1);
}
console.log(log.trim().split('\n').map((l) => '    ' + l).join('\n'));

check(/^loaded: /m.test(log), 'app boots (scripts load, init runs)');
check(/^deck: Loaded/m.test(log), 'deck loads', (log.match(/^deck: .*/m) || [''])[0]);
check(/^toasts: [01] notes=/m.test(log), 'one load message, not a success toast plus a warning');
// The welcome card promises "Just paste the sheet link — every tab becomes a topic".
if (discover) {
  check(/^topics: ([2-9]|\d\d+) topics/m.test(log), 'a bare sheet link auto-detects every tab',
    (log.match(/^topics: .*/m) || [''])[0]);
}
check(/^mc: options=[2-9]/m.test(log), 'multiple choice renders options');
check(/mc hittable=true/m.test(log), 'options are clickable (nothing covers them)');
check(/mc correct option found=true/m.test(log), 'the correct option is among the choices');
check(/mc after click: feedback=true correct=1[^\n]*title="Correct!"/m.test(log), 'clicking the correct option is graded correct');
check(/keyboard answer: feedback=true title="Correct!"/m.test(log), 'digit keys answer correctly');
check(/finished quiz: results=true fraction=\d+\/\d+/m.test(log), 'quiz reaches the results screen');
check(/typed question: badge=Translate/m.test(log), 'typed questions render an input');
check(/typed submit: feedback=true title="Correct!"/m.test(log), 'a correct typed answer is graded correct');
check(/typed dont-know: feedback=true/m.test(log), '"I don\'t know" reveals the answer');
check(/Quiz\.grade\(user case\)=correct/m.test(log), 'comma-list meaning accepts one of its items');
check(/Quiz\.sameAnswer\(variant\)=true/m.test(log), 'an alternative option matches the answer');
check(/flashcard flipped=true/m.test(log), 'flashcard flips');
check(/flashcard next=\d+\s*\/\s*\d+/m.test(log), 'flashcard advances');
check(/DONE/m.test(log), 'probe ran to the end');
check(!/JS-ERROR|JS-REJECT|RESOURCE-ERROR|DRIVER-THROW|TIMEOUT/m.test(log), 'no JavaScript errors or timeouts',
  (log.match(/^(JS-ERROR|JS-REJECT|RESOURCE-ERROR|DRIVER-THROW|TIMEOUT).*/m) || [''])[0]);

console.log('\n' + '─'.repeat(46));
console.log(passed + ' passed, ' + failed + ' failed');
if (failed) { console.log('Failures:\n · ' + failures.join('\n · ')); process.exit(1); }
