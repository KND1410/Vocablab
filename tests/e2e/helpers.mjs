/* Shared fixtures for the Playwright suite.
   The app is static + an in-memory API (tests/e2e/server.mjs), so a test
   signs in through that API and seeds browser state before the app boots. */
import { expect } from '@playwright/test';

export const PASSWORD = 'local-test-password';

/** French → Vietnamese deck: enough words for a paragraph (6 candidates). */
export const DECK_WORDS = [
  ['gare', 'nhà ga'],
  ['bureau', 'văn phòng'],
  ['valise', 'va li'],
  ['réunion', 'cuộc họp'],
  ['fromage', 'phô mai'],
  ['billet', 'vé']
];

export const DECK = {
  source: { mode: 'demo', label: 'E2E deck (French)', detail: '1 topic · 6 words' },
  loadedAt: 0,
  topics: [{
    id: 'e2e-topic',
    name: 'E2E topic',
    words: DECK_WORDS.map(function (w) {
      return { term: w[0], meaning: w[1], pron: '', example: '', pos: 'noun' };
    })
  }],
  wordCount: DECK_WORDS.length
};

/** Meaning → term, for driving typed quiz answers deterministically. */
export const MEANING_TO_TERM = Object.fromEntries(DECK_WORDS.map(function (w) {
  return [w[1], w[0]];
}));
export const TERM_TO_MEANING = Object.fromEntries(DECK_WORDS.map(function (w) {
  return [w[0], w[1]];
}));

/** Advanced mode pointed at the intercepted fake provider. */
export const BASE_SETTINGS = {
  aiMode: 'advanced',
  aiProvider: 'groq',
  oaiBase: 'http://127.0.0.1:4173/fake-ai/v1',
  oaiKey: 'e2e-key',
  oaiModel: 'e2e-model',
  targetLang: 'French',
  targetCode: 'fr-FR',
  scoreEngine: 'auto',
  uiLang: 'en',
  quizTypes: ['translate'],
  direction: 'm2t',
  count: 10,
  source: 'builtin',
  difficulty: 'standard',
  requirement: '',
  practiceMode: 'quiz',
  paragraphDirection: 'vi2fr',
  paragraphCount: 1
};

/**
 * Sign up through the API. The in-memory server keeps the session, so the
 * page load that follows goes straight into the app.
 */
export async function signIn(request) {
  const res = await request.post('/api/auth/signup', {
    data: { name: 'E2E Learner', email: 'e2e@local.test', password: PASSWORD }
  });
  expect(res.ok(), 'signup through the e2e API').toBeTruthy();
}

/**
 * Seed localStorage before any app script runs. Values are only written when
 * the key is missing, so a reload after an in-app change keeps that change.
 */
export async function seedApp(page, opts) {
  const options = opts || {};
  const settings = Object.assign({}, BASE_SETTINGS, options.settings || {});
  const deck = options.deck === null ? null : (options.deck || DECK);
  await page.addInitScript(function (payload) {
    if (payload.overwrite || !localStorage.getItem('vocablab.settings')) {
      localStorage.setItem('vocablab.settings', JSON.stringify(payload.settings));
    }
    if (payload.deck && (payload.overwrite || !localStorage.getItem('vocablab.deck'))) {
      localStorage.setItem('vocablab.deck', JSON.stringify(payload.deck));
    }
  }, { settings: settings, deck: deck, overwrite: !!options.overwrite });
  // Fake providers answer instantly, but the keyless provider paces real calls
  // to one per 30 s. Shrink that window to nothing once the scripts load, or a
  // second AI call in the same test would sleep a real half-minute.
  await page.addInitScript(function () {
    let tries = 0;
    const timer = setInterval(function () {
      if (window.Ai && window.Ai.freeSlot) {
        clearInterval(timer);
        window.Ai.freeSlot.configure({ windowMs: 0, floors: [50, 50, 50] });
      } else if (++tries > 2000) clearInterval(timer);
    }, 5);
  });
}

/** Open a route and wait until the app has routed to its screen. */
export async function openRoute(page, route) {
  await page.goto('/#/' + route);
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
}

/* ---------- Fake AI provider ---------- */

const JSON_ESCAPED = /"term":\s*"((?:[^"\\]|\\.)*)",\s*"meaning":\s*"((?:[^"\\]|\\.)*)"/g;

function unquote(text) {
  try { return JSON.parse('"' + text + '"'); } catch (e) { return text; }
}

/** The vocabulary block of a paragraph prompt, in the order the app sent it. */
export function vocabularyFrom(user) {
  const out = [];
  let m;
  JSON_ESCAPED.lastIndex = 0;
  while ((m = JSON_ESCAPED.exec(user))) {
    out.push({ term: unquote(m[1]), meaning: unquote(m[2]) });
  }
  return out;
}

/** The learner's text between """ markers after a given heading. */
function quotedAfter(user, heading) {
  const at = user.indexOf(heading);
  if (at === -1) return '';
  const open = user.indexOf('"""', at);
  if (open === -1) return '';
  const close = user.indexOf('"""', open + 3);
  if (close === -1) return '';
  return user.slice(open + 3, close);
}

function viSentence(meanings) {
  return 'Hôm nay, ' + meanings.join(', ') + ' đều rất quan trọng với tôi.';
}

function frSentence(terms) {
  return 'Aujourd’hui, ' + terms.join(', ') + ' comptent beaucoup pour moi.';
}

/** Default paragraph reply built from whatever vocabulary the prompt listed. */
export function defaultParagraphReply(user, direction) {
  const words = vocabularyFrom(user);
  const terms = words.map(function (w) { return w.term; });
  const meanings = words.map(function (w) { return w.meaning; });
  const vi2fr = direction === 'vi2fr';
  return {
    paragraph: vi2fr ? viSentence(meanings) : frSentence(terms),
    reference: vi2fr ? frSentence(terms) : viSentence(meanings),
    keywords: words.map(function (w) {
      return { term: w.term, meaning: w.meaning, note: '' };
    })
  };
}

/**
 * Install the fake provider. `handlers` may override any reply:
 *   paragraph({ user, direction, words })
 *   correction({ user, userText, words })
 *   upgrade({ user, userText })
 * Each returns the JSON object the model would have written.
 */
export async function fakeAi(page, handlers) {
  const h = handlers || {};
  await page.route('**/fake-ai/v1/chat/completions', async function (route) {
    const body = route.request().postDataJSON ? (route.request().postDataJSON() || {}) : {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const user = String((messages.filter(function (m) { return m.role === 'user'; })[0] || {}).content || '');
    let payload;
    if (user.indexOf('Write ONE coherent') !== -1) {
      const direction = user.indexOf('The paragraph MUST be written entirely in Vietnamese') !== -1
        ? 'vi2fr' : 'fr2vi';
      const words = vocabularyFrom(user);
      payload = h.paragraph
        ? h.paragraph({ user: user, direction: direction, words: words })
        : defaultParagraphReply(user, direction);
    } else if (user.indexOf('The learner translated a') !== -1) {
      const userText = quotedAfter(user, 'LEARNER\'S TRANSLATION');
      const words = vocabularyFrom(user);
      payload = h.correction
        ? h.correction({ user: user, userText: userText, words: words })
        : {
            score: 100,
            verdict: 'good',
            corrected: userText,
            notes: [],
            used: words.map(function (w) { return w.term; }),
            comment: 'Clear and correct.',
            upgrades: []
          };
    } else if (user.indexOf('Suggest up to 12 optional upgrades') !== -1) {
      const userText = quotedAfter(user, 'LEARNER\'S CORRECT ANSWER');
      payload = h.upgrade ? h.upgrade({ user: user, userText: userText }) : { upgrades: [] };
    } else {
      payload = {};
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e',
        object: 'chat.completion',
        model: body.model || 'e2e-model',
        choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(payload) }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
      })
    });
  });
}

/* ---------- Fake dictionary ---------- */

/**
 * Intercept the dictionary chain. `verified` words answer from
 * FreeDictionaryAPI, `wiki` words only from Wiktionary, everything else is
 * a stable not-found. `fail: true` makes both providers return HTTP 500.
 */
export async function fakeDictionary(page, opts) {
  const options = opts || {};
  const verified = new Set(options.verified || []);
  const wiki = options.wiki || {};
  const fail = !!options.fail;

  await page.route('**/freedictionaryapi.com/api/v1/entries/**', async function (route) {
    if (fail) return route.fulfill({ status: 500, body: 'down' });
    const parts = new URL(route.request().url()).pathname.split('/');
    const word = decodeURIComponent(parts[parts.length - 1] || '');
    if (!verified.has(word)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: word, entries: [] })
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        word: word,
        entries: [{
          partOfSpeech: 'noun',
          senses: [{ definition: 'definition of ' + word }]
        }]
      })
    });
  });

  await page.route('**/w/api.php**', async function (route) {
    if (fail) return route.fulfill({ status: 500, body: 'down' });
    const word = new URL(route.request().url()).searchParams.get('titles') || '';
    if (!wiki[word]) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ query: { pages: { '-1': { title: word, missing: '' } } } })
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        query: { pages: { 1: { title: word, extract: wiki[word] } } }
      })
    });
  });
}
