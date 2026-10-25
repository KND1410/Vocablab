import { test, expect } from '@playwright/test';
import { fakeDictionary } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await page.goto('/');
});

function lookup(page, word, lang) {
  return page.evaluate(function (args) {
    return Dict.lookup(args.word, args.lang);
  }, { word: word, lang: lang || 'French' });
}

test('FreeDictionaryAPI verifies a single word', async ({ page }) => {
  await fakeDictionary(page, { verified: ['halte'] });

  const result = await lookup(page, 'halte');
  expect(result.status).toBe('verified');
  expect(result.source).toBe('freedictionaryapi');
  expect(result.partOfSpeech).toBe('noun');
  expect(result.definition).toBe('definition of halte');
  expect(result.license).toContain('CC BY-SA');
});

test('Wiktionary answers when FreeDictionaryAPI has no entry', async ({ page }) => {
  await fakeDictionary(page, { wiki: { halte: 'Lieu où l’on s’arrête pendant un trajet.' } });

  const result = await lookup(page, 'halte');
  expect(result.status).toBe('verified');
  expect(result.source).toBe('wiktionary');
  expect(result.sourceUrl).toContain('fr.wiktionary.org/wiki/halte');
  expect(result.definition).toContain('Lieu');
});

test('a word neither provider knows is reported as not found', async ({ page }) => {
  await fakeDictionary(page, {});

  const result = await lookup(page, 'zzznotaword');
  expect(result.status).toBe('not-found');
  expect(result.source).toBe('');
});

test('both providers failing is reported as unavailable, not as a missing word', async ({ page }) => {
  await fakeDictionary(page, { fail: true });

  const result = await lookup(page, 'halte');
  expect(result.status).toBe('unavailable');
  expect(result.error).toBeTruthy();
});

test('a phrase or sentence is not a dictionary headword', async ({ page }) => {
  // No route at all: an unsupported lookup must not touch the network.
  const result = await lookup(page, 'bonne journée');
  expect(result.status).toBe('unsupported');
});

test('sentence suggestions are labelled AI, without a dictionary lookup', async ({ page }) => {
  await fakeDictionary(page, { verified: ['halte'] });

  const checked = await page.evaluate(function () {
    return Dict.verifyUpgrades([
      { from: 'la gare', to: 'halte', level: 'B2', scope: 'word' },
      { from: 'la gare est loin', to: 'La gare se trouve à distance.', level: 'B2', scope: 'sentence' }
    ], 'French');
  });

  expect(checked[0].dict.status).toBe('verified');
  expect(checked[1].dict.status).toBe('ai');
});
