/* Every UI string must follow the interface language.
   This walks all seven routes plus the Settings and Help dialogs in English,
   then again in Vietnamese and French, and fails if a visible string is still
   byte-identical to English. Values that are data, not UI copy (the brand, a
   seeded deck name, a learner's own name/email, sample placeholders, language
   codes and URLs) are allow-listed below. */
import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

const ROUTES = ['home', 'files', 'lessons', 'practice', 'exam', 'community', 'progress'];

/* Strings that are correctly the same in every language. */
const ALLOWED = [
  'VocabLab',
  'B1/B2',
  'DELF B2',
  'E2E Learner',
  'e2e@local.test',
  'E2E deck (French)',
  'E2E deck (French) · 6 words',
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
  /^[a-z]{2}(-[A-Z]{2})?$/
];

function allowed(text) {
  return ALLOWED.indexOf(text) !== -1 || ALLOWED_PATTERNS.some(function (re) { return re.test(text); });
}

/** Visible leaf text plus placeholder/title/aria-label values, deduplicated. */
function collect(page) {
  return page.evaluate(function () {
    const skip = 'script, style, textarea, code, pre, #selUiLang, [data-i18n-skip], .code-block, #toasts, #scriptCode';
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

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { settings: { uiLang: 'en' } });
});

for (const lang of ['vi', 'fr']) {
  test('every visible UI string follows the ' + lang + ' interface language', async ({ page }) => {
    const views = [];
    for (const route of ROUTES) {
      await openRoute(page, route);
      views.push(['route:' + route, await collect(page)]);
    }
    await openRoute(page, 'home');
    for (const dialog of ['settingsDialog', 'helpDialog']) {
      await page.locator(dialog === 'helpDialog' ? '#btnHelp' : '#btnSettings').click();
      await page.locator('#' + dialog).waitFor({ state: 'visible' });
      views.push(['dialog:' + dialog, await collect(page)]);
      await page.locator('#' + dialog + ' button[value="close"]').click();
    }

    await page.locator('#selUiLang').selectOption(lang);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);

    const leftovers = [];
    for (const [label, english] of views) {
      const now = new Set(await collect(page));
      for (const text of english) {
        if (now.has(text) && !allowed(text) && leftovers.indexOf(label + ' :: ' + text) === -1) {
          leftovers.push(label + ' :: ' + text);
        }
      }
    }
    expect(leftovers).toEqual([]);
  });
}
