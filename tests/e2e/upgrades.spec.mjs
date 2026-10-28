import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute, fakeAi, fakeDictionary, MEANING_TO_TERM, TERM_TO_MEANING } from './helpers.mjs';

const FRENCH_TEXT = "Aujourd'hui, la gare, le bureau, la valise, la réunion, le fromage et le billet comptent beaucoup.";
const VIETNAMESE_TEXT = 'Hôm nay, nhà ga, văn phòng, va li, cuộc họp, phô mai và vé đều quan trọng với tôi.';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
});

async function openParagraph(page, settings) {
  await seedApp(page, {
    overwrite: true,
    settings: Object.assign({ practiceMode: 'paragraph', paragraphDirection: 'vi2fr' }, settings || {})
  });
  await openRoute(page, 'practice');
  await expect(page.locator('#btnStartParagraph')).toBeEnabled();
  await page.locator('#btnStartParagraph').click();
  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qParagraph')).toBeVisible();
  await expect(page.locator('#paraText')).not.toHaveText('');
}

/** The four upgrade kinds used by the paragraph tests. */
function paragraphUpgrades(ctx) {
  const terms = ctx.words.map(function (w) { return w.term; });
  return [
    { from: terms[0], to: 'halte', level: 'B2', scope: 'word', meaning: 'arrêt', why: 'more precise', example: 'La halte est proche.' },
    { from: terms[1], to: 'station', level: 'B1', scope: 'word', meaning: 'lieu', why: 'common collocation', example: 'La station est ouverte.' },
    { from: terms[2], to: 'zzznotaword', level: 'B2', scope: 'word', meaning: '?', why: 'unknown', example: '' },
    { from: ctx.userText, to: ctx.userText + ' Vraiment.', level: 'B2', scope: 'sentence', meaning: 'emphasis', why: 'flows better', example: '' }
  ];
}

function perfectCorrection(upgrades) {
  return function (ctx) {
    return {
      score: 100,
      verdict: 'good',
      corrected: ctx.userText,
      notes: [],
      used: ctx.words.map(function (w) { return w.term; }),
      comment: 'Clear and correct.',
      upgrades: upgrades(ctx)
    };
  };
}

async function submitParagraph(page, text) {
  await page.locator('#paraInput').fill(text);
  await page.locator('#btnParaSubmit').click();
  // A perfect paragraph opens the level-up tab, an imperfect one the
  // corrections tab; the inspector becoming visible marks either result.
  await expect(page.locator('#paraInspector')).toBeVisible();
}

/** Locked upgrades live on their own tab. */
async function openLevelUpTab(page) {
  await page.locator('#tabLevelUp').click();
  await expect(page.locator('#paraLevelUp')).toBeVisible();
}

test('a perfect paragraph shows optional upgrades and never applies them by itself', async ({ page }) => {
  await fakeAi(page, { correction: perfectCorrection(paragraphUpgrades) });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page);

  await submitParagraph(page, FRENCH_TEXT);

  // The perfect score opens the level-up tab automatically.
  await expect(page.locator('#paraLevelUp')).toBeVisible();
  await expect(page.locator('#upgradeCount')).toHaveText('4');
  await expect(page.locator('#paraLevelUp .upgrade-card')).toHaveCount(4);
  await expect(page.locator('#paraInput')).toHaveValue(FRENCH_TEXT);

  // Dictionary badges settle: two verified, one not found, one AI-only sentence.
  await expect(page.locator('#paraLevelUp .dict-badge.ok')).toHaveCount(2);
  await expect(page.locator('#paraLevelUp .dict-badge.ai')).toHaveCount(1);
  await expect(page.locator('#paraLevelUp .dict-badge.warn')).toHaveCount(1);
});

test('an individual upgrade can be applied to the finished paragraph', async ({ page }) => {
  await fakeAi(page, { correction: perfectCorrection(paragraphUpgrades) });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page);
  await submitParagraph(page, FRENCH_TEXT);

  const first = page.locator('#paraLevelUp .upgrade-card').first();
  await expect(first.locator('.upgrade-level')).toHaveText('B2');
  const replaced = await first.locator('.upgrade-from').textContent();
  await first.getByRole('button', { name: 'Apply' }).click();

  await expect(page.locator('#paraInput')).toHaveValue(/halte/);
  await expect(page.locator('#paraInput')).not.toHaveValue(new RegExp(replaced));
});

test('apply all safe skips sentence rewrites and dictionary rejects', async ({ page }) => {
  await fakeAi(page, { correction: perfectCorrection(paragraphUpgrades) });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page);
  await submitParagraph(page, FRENCH_TEXT);
  await expect(page.locator('#paraLevelUp .dict-badge.warn')).toHaveCount(1);

  await page.locator('#paraLevelUp .levelup-apply-all').click();

  const value = await page.locator('#paraInput').inputValue();
  expect(value).toContain('halte');
  expect(value).toContain('station');
  expect(value).not.toContain('zzznotaword');
  expect(value).not.toContain('Vraiment');
  await expect(page.locator('#toasts .toast').last()).toContainText('skipped');
});

test('upgrades stay locked below a perfect score', async ({ page }) => {
  await fakeAi(page, {
    correction: function (ctx) {
      return {
        score: 85,
        verdict: 'good',
        corrected: ctx.userText.replace('beaucoup', 'vraiment beaucoup'),
        notes: [{ text: 'beaucoup', fix: 'vraiment beaucoup', why: 'stronger' }],
        used: ctx.words.map(function (w) { return w.term; }),
        comment: 'One small fix.',
        upgrades: paragraphUpgrades(ctx)
      };
    }
  });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page);

  await submitParagraph(page, FRENCH_TEXT);
  await openLevelUpTab(page);

  await expect(page.locator('#paraLevelUp .levelup-locked')).toBeVisible();
  await expect(page.locator('#paraLevelUp .upgrade-card')).toHaveCount(0);
  await expect(page.locator('#upgradeCount')).toHaveText('0');
});

test('upgrades stay locked when a required word is missing, even at score 100', async ({ page }) => {
  const withoutBillet = FRENCH_TEXT.replace(' et le billet', '');
  await fakeAi(page, {
    correction: function (ctx) {
      return {
        score: 100,
        verdict: 'good',
        // A different text keeps the model's score instead of recomputing it.
        corrected: ctx.userText + ' Vraiment.',
        notes: [],
        used: ctx.words.map(function (w) { return w.term; }).filter(function (t) { return t !== 'billet'; }),
        comment: 'Almost perfect.',
        upgrades: paragraphUpgrades(ctx)
      };
    }
  });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page);

  await submitParagraph(page, withoutBillet);
  await openLevelUpTab(page);

  await expect(page.locator('#paraLevelUp .levelup-locked')).toBeVisible();
  await expect(page.locator('#paraLevelUp .upgrade-card')).toHaveCount(0);
});

test('a French → Vietnamese paragraph never offers upgrades', async ({ page }) => {
  await fakeAi(page, {
    correction: function (ctx) {
      return {
        score: 100,
        verdict: 'good',
        corrected: ctx.userText,
        notes: [],
        used: ctx.words.map(function (w) { return w.term; }),
        comment: 'Clear and correct.',
        upgrades: paragraphUpgrades(ctx)
      };
    }
  });
  await fakeDictionary(page, { verified: ['halte', 'station'] });
  await openParagraph(page, { paragraphDirection: 'fr2vi' });
  await expect(page.locator('#paraDir')).toHaveText('French → Vietnamese');

  await submitParagraph(page, VIETNAMESE_TEXT);

  await expect(page.locator('#paraLevelUp .upgrade-card')).toHaveCount(0);
  await expect(page.locator('#upgradeCount')).toHaveText('0');
  await expect(page.locator('#paraLevelUp')).toContainText('No safe B1/B2 upgrade');
});

test('a paragraph can be checked without limit and lists every error at once', async ({ page }) => {
  await fakeAi(page, {
    correction: function (ctx) {
      const notes = [];
      for (let i = 0; i < 12; i++) {
        notes.push({ text: 'mot' + i, fix: 'mot' + (i + 1), why: 'fix ' + i });
      }
      return {
        score: 60,
        verdict: 'fair',
        corrected: ctx.userText + ' Encore.',
        notes: notes,
        used: ctx.words.map(function (w) { return w.term; }),
        comment: 'Several fixes.',
        upgrades: []
      };
    }
  });
  await openParagraph(page);

  let text = FRENCH_TEXT;
  for (let i = 0; i < 4; i++) {
    text += ' mot' + i;
    await page.locator('#paraInput').fill(text);
    await page.locator('#btnParaSubmit').click();
    await expect(page.locator('#btnParaSubmit')).toHaveText('Check again', { timeout: 15_000 });
  }

  // Four checks — more than the old three — and a fifth is still allowed.
  await expect(page.locator('#btnParaSubmit')).toBeEnabled();
  await expect(page.locator('#paraFeedback .pf-note')).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Finish anyway' })).toBeVisible();
});

/* ---------- Quiz upgrades ---------- */

async function openQuiz(page, settings) {
  await seedApp(page, { overwrite: true, settings: Object.assign({ practiceMode: 'quiz' }, settings || {}) });
  await openRoute(page, 'practice');
  await expect(page.locator('#btnStart')).toBeEnabled();
  await page.locator('#btnStart').click();
  await expect(page.locator('#screenQuiz')).toBeVisible();
  await expect(page.locator('#qPrompt')).not.toHaveText('');
}

/** 14 suggestions: 10 B1 then 4 B2, so the B2-first ranking and the 12 cap both show. */
function manyUpgrades(ctx) {
  const out = [];
  for (let i = 0; i < 10; i++) {
    out.push({ from: ctx.userText, to: 'b1word' + i, level: 'B1', scope: 'word', meaning: 'x', why: 'y', example: '' });
  }
  for (let i = 0; i < 4; i++) {
    out.push({ from: ctx.userText, to: 'b2word' + i, level: 'B2', scope: 'word', meaning: 'x', why: 'y', example: '' });
  }
  return { upgrades: out };
}

test('a correct typed VI → target answer shows B2-first upgrades, capped at 12', async ({ page }) => {
  await fakeAi(page, { upgrade: manyUpgrades });
  await fakeDictionary(page, {});
  await openQuiz(page, { quizTypes: ['translate'], direction: 'm2t' });

  const prompt = await page.locator('#qPrompt').textContent();
  await page.locator('#qInput').fill(MEANING_TO_TERM[prompt]);
  await page.locator('#btnSubmit').click();

  await expect(page.locator('#fbTitle')).toHaveText('Correct!');
  await expect(page.locator('#fbUpgrades')).toBeVisible();
  await expect(page.locator('#fbUpgrades .upgrade-card')).toHaveCount(12);
  await expect(page.locator('#fbUpgrades .upgrade-card').first().locator('.upgrade-level')).toHaveText('B2');

  const levels = await page.locator('#fbUpgrades .upgrade-level').allTextContents();
  expect(levels.every(function (l) { return l === 'B1' || l === 'B2'; })).toBe(true);
  expect(levels.slice(0, 4)).toEqual(['B2', 'B2', 'B2', 'B2']);

  // Suggestions are target-language only: no Vietnamese-only letters.
  const suggestions = await page.locator('#fbUpgrades .upgrade-to').allTextContents();
  const vietnameseOnly = /[ơưđạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  expect(suggestions.filter(function (s) { return vietnameseOnly.test(s); })).toEqual([]);
});

test('upgrade cards follow the interface language', async ({ page }) => {
  await fakeAi(page, { upgrade: manyUpgrades });
  await fakeDictionary(page, {});
  await openQuiz(page, { quizTypes: ['translate'], direction: 'm2t' });

  const prompt = await page.locator('#qPrompt').textContent();
  const answer = MEANING_TO_TERM[prompt];
  await page.locator('#selUiLang').selectOption('vi');
  await page.locator('#qInput').fill(answer);
  await page.locator('#btnSubmit').click();

  await expect(page.locator('#fbUpgrades .fb-upgrades-title')).toHaveText('Nâng cấp');
  await expect(page.locator('#fbUpgrades .upgrade-card')).toHaveCount(12);
});

test('multiple choice answers get no upgrades', async ({ page }) => {
  await fakeAi(page, {});
  await openQuiz(page, { quizTypes: ['mc'], direction: 'mixed' });

  await expect(page.locator('#qOptions .option').first()).toBeVisible();
  await page.locator('#qOptions .option').first().click();

  await expect(page.locator('#qFeedback')).toBeVisible();
  await expect(page.locator('#fbUpgrades')).toBeHidden();
});

test('fill-in-the-blank answers get no upgrades', async ({ page }) => {
  await fakeAi(page, {});
  await openQuiz(page, { quizTypes: ['blank'], direction: 'mixed' });

  await expect(page.locator('#qInputRow')).toBeVisible();
  await page.locator('#qInput').fill('quelquechose');
  await page.locator('#btnSubmit').click();

  await expect(page.locator('#qFeedback')).toBeVisible();
  await expect(page.locator('#fbUpgrades')).toBeHidden();
});

test('a correct target → VI answer gets no upgrades', async ({ page }) => {
  await fakeAi(page, {});
  await openQuiz(page, { quizTypes: ['translate'], direction: 't2m' });

  const term = await page.locator('#qPrompt').textContent();
  await page.locator('#qInput').fill(TERM_TO_MEANING[term]);
  await page.locator('#btnSubmit').click();

  await expect(page.locator('#fbTitle')).toHaveText('Correct!');
  await expect(page.locator('#fbUpgrades')).toBeHidden();
});

test('a wrong typed answer gets no upgrades', async ({ page }) => {
  await fakeAi(page, {});
  await openQuiz(page, { quizTypes: ['translate'], direction: 'm2t' });

  await page.locator('#qInput').fill('complètement faux');
  await page.locator('#btnSubmit').click();

  await expect(page.locator('#fbTitle')).toHaveText('Not quite');
  await expect(page.locator('#fbUpgrades')).toBeHidden();
});
