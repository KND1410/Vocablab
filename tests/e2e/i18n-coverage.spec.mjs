/* Every UI string must follow the interface language.
   This walks all routes and the Settings and Help dialogs in English, then in
   Vietnamese and French, failing if a visible string in a given view is still
   byte-identical to English. Values that are data, not UI copy (the brand, a
   seeded deck or topic name, a learner's own name/email, sample placeholders,
   language codes and URLs) are allow-listed below. */
import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

const ROUTES = ['home', 'files', 'lessons', 'practice', 'exam', 'community', 'progress'];
const DIALOGS = [
  { id: 'settingsDialog', opener: '#btnSettings' },
  { id: 'helpDialog', opener: '#btnHelp' }
];

/* Strings that are correctly the same in every language. */
const ALLOWED = [
  'VocabLab',
  'B1/B2',
  'DELF B2',
  'Source',
  // Product and method names stay as they are in every language.
  'Shadowing',
  '(AI)',
  '✨ AI',
  '📊 Google Sheet',
  'Google Gemini',
  'Groq',
  'console.groq.com/keys',
  'Cerebras',
  'OpenRouter',
  'Mistral',
  'DeepSeek',
  'Ollama',
  'Azure Speech',
  // A menu path inside Google Sheets, whose own UI language is not ours.
  'Extensions → Apps Script',
  // Keyboard keys and the VI/EN example of the explanation language.
  'VI / EN',
  'Enter',
  'Ctrl',
  'Space',
  // Column aliases from the sheet: the same list in every language.
  'Vocab / Français / French',
  'Vietnamese / Tiếng Việt / Nghĩa / Vietnamien',
  'Vocab / Từ vựng / Word',
  'Vietnamese / Nghĩa / Meaning',
  'Pronunciation / Phát âm / Pinyin',
  'Example / Ví dụ',
  // French words that are spelled exactly like their English label.
  'Quiz',
  'Questions',
  'Standard',
  'Simple',
  'E2E Learner',
  'e2e@local.test',
  'E2E deck (French)',
  'E2E deck (French) · 6 words',
  'E2E topic',
  'Khoi',
  'you@example.com',
  'XXXXX-XXXXX',
  'AIza…',
  'fr-FR',
  'southeastasia',
  'https://api.groq.com/openai/v1',
  'gsk_… or sk-…',
  'https://docs.google.com/spreadsheets/d/…',
  'https://script.google.com/macros/s/…/exec'
];

const ALLOWED_PATTERNS = [
  /^(https?|wss?):\/\//,
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /^(AIza|gsk_|sk-|sk-or-|xai-)[….]/,
  /^[a-z]{2}(-[A-Z]{2})?$/,
  /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i
];

function allowed(text) {
  return ALLOWED.indexOf(text) !== -1 || ALLOWED_PATTERNS.some(function (re) { return re.test(text); });
}

/** Visible leaf text plus placeholder/title/aria-label values, deduplicated. */
function collect(page) {
  return page.evaluate(function () {
    // The sheet-format card documents the multilingual column aliases and shows
    // sample French/Vietnamese words: content, not UI copy.
    const skip = 'script, style, textarea, code, pre, #selUiLang, [data-i18n-skip], .code-block, #toasts, #scriptCode, #sheetFormatCard table';
    const seen = new Set();
    const out = [];
    function push(raw) {
      const text = String(raw || '').replace(/\s+/g, ' ').trim();
      if (text.length < 3 || !/[A-Za-zÀ-ÿ]/.test(text) || seen.has(text)) return;
      seen.add(text);
      out.push(text);
    }
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.children.length || el.closest(skip)) return;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      push(el.textContent);
    });
    document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(function (el) {
      if (el.closest(skip)) return;
      ['placeholder', 'title', 'aria-label'].forEach(function (attr) { push(el.getAttribute(attr)); });
    });
    return out;
  });
}

async function open(page, view) {
  if (view.route) { await openRoute(page, view.route); return; }
  await page.locator(view.opener).click();
  await page.locator('#' + view.id).waitFor({ state: 'visible' });
}

async function close(page, view) {
  if (!view.id) return;
  await page.locator('#' + view.id + ' button[value="close"]').click();
}

const VIEWS = ROUTES.map(function (route) { return { route: route }; })
  .concat(DIALOGS.map(function (d) { return { id: d.id, opener: d.opener }; }));

function label(view) {
  return view.route ? 'route:' + view.route : 'dialog:' + view.id;
}

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { settings: { uiLang: 'en' } });
});

for (const lang of ['vi', 'fr']) {
  test('every visible UI string follows the ' + lang + ' interface language', async ({ page }) => {
    const english = {};
    for (const view of VIEWS) {
      await open(page, view);
      english[label(view)] = await collect(page);
      await close(page, view);
    }

    await page.locator('#selUiLang').selectOption(lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);

    const leftovers = [];
    for (const view of VIEWS) {
      await open(page, view);
      const now = new Set(await collect(page));
      for (const text of english[label(view)] || []) {
        if (now.has(text) && !allowed(text)) leftovers.push(label(view) + ' :: ' + text);
      }
      await close(page, view);
    }
    expect(leftovers).toEqual([]);
  });
}
