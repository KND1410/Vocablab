import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute, BASE_SETTINGS } from './helpers.mjs';

/* Providers retire models (the free service does it regularly). A saved id that
   no longer exists would fail every request, so the app has to notice, ask what
   the provider serves now, and carry on — with no trip to Settings. */

const SERVED = 'openai-fast';
const GONE = 'mistral';

/** The ITEMS block of a question prompt, so the reply matches what was asked. */
function itemsFrom(user) {
  const at = user.indexOf('ITEMS (JSON):');
  if (at === -1) return [];
  const open = user.indexOf('[', at);
  if (open === -1) return [];
  const end = user.indexOf('\n\nRules:', open);
  const raw = end === -1 ? user.slice(open) : user.slice(open, end);
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function replyFor(items) {
  return {
    questions: items.map(function (it) {
      const others = items.filter(function (x) { return x.term !== it.term; }).map(function (x) { return x.term; });
      const options = [it.term].concat(others.slice(0, 3));
      while (options.length < 4) options.push('other' + options.length);
      const meaning2term = it.direction === 'meaning2term';
      return {
        type: it.type, direction: it.direction, term: it.term,
        prompt: meaning2term ? it.meaning : it.term, hint: '',
        options: it.type === 'mc' ? options : [],
        answer: meaning2term || it.type !== 'translate' ? it.term : it.meaning,
        explanation: 'recovery test'
      };
    })
  };
}

function chatOk(body) {
  const user = String(((body.messages || []).filter(function (m) { return m.role === 'user'; })[0] || {}).content || '');
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      choices: [{ message: { role: 'assistant', content: JSON.stringify(replyFor(itemsFrom(user))) }, finish_reason: 'stop' }]
    })
  };
}

function modelGone(model) {
  return {
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ error: { message: 'Model "' + model + '" isn\'t on the Classic API.' } })
  };
}

function savedSettings(page) {
  return page.evaluate(function () { return JSON.parse(localStorage.getItem('vocablab.settings') || '{}'); });
}

/** A paragraph reply the app accepts for the E2E deck: the Vietnamese text
    avoids the target terms, the French reference uses them all. */
function paragraphReply() {
  return JSON.stringify({
    paragraph: 'Buổi sáng, tôi ra nhà ga, xếp va li vào văn phòng và mua một tấm vé.',
    reference: 'Le matin, je vais à la gare, je range la valise au bureau et j’achète un billet.',
    keywords: [
      { term: 'gare', meaning: 'nhà ga', note: '' },
      { term: 'bureau', meaning: 'văn phòng', note: '' },
      { term: 'valise', meaning: 'va li', note: '' },
      { term: 'billet', meaning: 'vé', note: '' }
    ]
  });
}

test('Simple mode: a free model that is gone is replaced and the quiz still runs', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiMode: 'simple', simpleModel: GONE, source: 'ai', quizTypes: ['translate'], direction: 't2m'
    })
  });

  const models = [];
  await page.route('**/text.pollinations.ai/models', function (route) {
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([{ name: SERVED, tier: 'anonymous' }, { name: 'seeded-only', tier: 'seed' }])
    });
  });
  await page.route('**/text.pollinations.ai/openai/chat/completions', function (route) {
    const body = route.request().postDataJSON() || {};
    models.push(body.model);
    if (body.model !== SERVED) return route.fulfill(modelGone(body.model));
    return route.fulfill(chatOk(body));
  });

  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qPrompt')).not.toHaveText('');
  expect(models[0], 'the saved model is tried first').toBe(GONE);
  expect(models, 'the model the service does serve is used instead').toContain(SERVED);
  expect((await savedSettings(page)).simpleModel, 'the replacement is saved for next time').toBe(SERVED);
  await expect(page.locator('.toast.warn')).toContainText('no longer offers');
});

test('Advanced mode: a model the provider dropped is replaced too', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiProvider: 'groq', oaiBase: 'https://api.groq.com/openai/v1', oaiKey: 'gsk_test_key',
      source: 'ai', oaiModel: 'retired-model', quizTypes: ['translate'], direction: 't2m'
    })
  });

  const models = [];
  await page.route('**/api.groq.com/openai/v1/models', function (route) {
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: [{ id: 'e2e-model' }] })
    });
  });
  await page.route('**/api.groq.com/openai/v1/chat/completions', function (route) {
    const body = route.request().postDataJSON() || {};
    models.push(body.model);
    if (body.model !== 'e2e-model') return route.fulfill(modelGone(body.model));
    return route.fulfill(chatOk(body));
  });

  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qPrompt')).not.toHaveText('');
  expect(models[0], 'the saved model is tried first').toBe('retired-model');
  expect(models, 'the served model is used instead').toContain('e2e-model');
  expect((await savedSettings(page)).oaiModel, 'the replacement is saved').toBe('e2e-model');
  await expect(page.locator('.toast.warn')).toContainText('not served any more');
});

/* A “thinking” Gemini model reasons for minutes before writing a paragraph —
   which is exactly what a frozen-looking dialog looks like. The app must ask
   the model for as little thinking as its family allows, and count the seconds
   out loud while it waits. */
test('a Gemini paragraph asks for little thinking, and the wait counts itself out', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiMode: 'advanced', aiProvider: 'gemini', geminiKey: 'AIza-test-key',
      geminiModel: 'gemini-flash-latest', source: 'ai', practiceMode: 'paragraph'
    })
  });

  const bodies = [];
  await page.route('**/generativelanguage.googleapis.com/**', async function (route) {
    bodies.push(route.request().postDataJSON() || {});
    await new Promise(function (resolve) { setTimeout(resolve, 7000); });
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: paragraphReply() }], role: 'model' }, finishReason: 'STOP' }]
      })
    });
  });

  await openRoute(page, 'practice');
  const started = Date.now();
  await page.locator('#btnStartParagraph').click();

  // While it is writing, the dialog says how long it has been waiting.
  await expect(page.locator('#loadMsg')).toContainText(/\d+ s/, { timeout: 15000 });
  await expect(page.locator('#qParagraph')).toContainText('nhà ga', { timeout: 30000 });

  expect(bodies.length, 'one paragraph, one request').toBe(1);
  const thinking = bodies[0].generationConfig && bodies[0].generationConfig.thinkingConfig;
  expect(thinking, 'the newest Flash family is asked for minimal thinking, not a budget it ignores')
    .toEqual({ thinkingLevel: 'minimal' });
  expect(Date.now() - started, 'no multi-minute stall').toBeLessThan(30000);
});

/* The provider refuses browser pages opened as “localhost” — 403 “Missing
   Turnstile token”, which no fetch can solve. The same anonymous call through
   this site's own server is accepted, so that is where the app retries. */
test('the free provider refusing the page still produces a quiz, via this site’s own server', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiMode: 'simple', simpleModel: SERVED, source: 'ai', quizTypes: ['translate'], direction: 't2m'
    })
  });

  const direct = [];
  const relayed = [];
  await page.route('**/text.pollinations.ai/**', function (route) {
    direct.push(route.request().url());
    return route.fulfill({
      status: 403, contentType: 'application/json',
      body: JSON.stringify({ error: 'Missing Turnstile token' })
    });
  });
  await page.route('**/api/ai-free*', function (route) {
    const url = route.request().url();
    relayed.push(url);
    if (url.indexOf('what=models') !== -1) {
      return route.fulfill({
        status: 200, headers: { 'x-vocablab-relay': '1' }, contentType: 'application/json',
        body: JSON.stringify([{ name: SERVED, tier: 'anonymous' }])
      });
    }
    const body = route.request().postDataJSON() || {};
    const user = String(((body.messages || []).filter(function (m) { return m.role === 'user'; })[0] || {}).content || '');
    return route.fulfill({
      status: 200, headers: { 'x-vocablab-relay': '1' }, contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { role: 'assistant', content: JSON.stringify(replyFor(itemsFrom(user))) }, finish_reason: 'stop' }]
      })
    });
  });

  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qPrompt')).not.toHaveText('');
  expect(direct.length, 'the direct call is tried first').toBe(1);
  expect(relayed.length, '…and the same request goes through this site’s server').toBeGreaterThan(0);
  expect(relayed[relayed.length - 1], 'through the relay’s chat endpoint').toContain('what=chat');
  await expect(page.locator('.toast.warn')).toHaveCount(0);
});

/* No server behind the page (a plain host, or an older dev server): the learner
   must be told what happened, never told to paste a key this mode has not. */
test('a refusal with no relay explains itself instead of asking for a key', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiMode: 'simple', simpleModel: SERVED, source: 'ai', quizTypes: ['translate'], direction: 't2m'
    })
  });

  await page.route('**/text.pollinations.ai/**', function (route) {
    return route.fulfill({
      status: 403, contentType: 'application/json',
      body: JSON.stringify({ error: 'Missing Turnstile token' })
    });
  });
  await page.route('**/api/ai-free*', function (route) {
    // An endpoint that does not exist: no relay marker, so the app keeps the
    // original answer.
    return route.fulfill({ status: 404, contentType: 'text/html', body: 'Not found' });
  });

  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('.toast.warn')).toContainText('Missing Turnstile token');
  await expect(page.locator('.toast.warn')).toContainText('No key is involved');
  await expect(page.locator('.toast.warn')).not.toContainText('rejected this key');
  await expect(page.locator('#screenQuiz')).toBeVisible();
});

test('a quiz keeps working while the free service says the slot is busy', async ({ page, request }) => {
  await signIn(request);
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({}, BASE_SETTINGS, {
      aiMode: 'simple', simpleModel: SERVED, source: 'ai', quizTypes: ['translate'], direction: 't2m'
    })
  });

  let calls = 0;
  await page.route('**/text.pollinations.ai/openai/chat/completions', function (route) {
    calls++;
    // One reply per IP every 30 s: the first attempts are refused, with the wait
    // in the body exactly as the real service words it.
    if (calls <= 2) {
      return route.fulfill({
        status: 402, contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Free limit reached: 1 reply every 30 seconds per IP. Retry after 1s, or get unlimited replies.' }
        })
      });
    }
    return route.fulfill(chatOk(route.request().postDataJSON() || {}));
  });

  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qPrompt')).not.toHaveText('');
  expect(calls, 'the same request is retried after waiting').toBeGreaterThan(2);
  await expect(page.locator('.toast.warn')).toHaveCount(0);
});
