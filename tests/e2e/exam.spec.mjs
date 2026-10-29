import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute, fakeAi } from './helpers.mjs';

const SESSION_KEY = 'vocablab.exam.blanc-1';
let lastTutorPrompt = '';

test.beforeEach(async ({ request, page }) => {
  lastTutorPrompt = '';
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { overwrite: true });
  await fakeAi(page, {
    tutor: function (ctx) {
      lastTutorPrompt = ctx.user;
      return 'Respect de la consigne : bonne prise en compte du sujet.\n' +
        'Organisation : trois parties claires.\n' +
        'Langue : attention aux accords du participe passé.\n' +
        'Estimation : 15/25.\n' +
        'Conseil : ajoutez un exemple chiffré.';
    }
  });
});

async function openCatalogue(page) {
  await openRoute(page, 'exam');
  await expect(page.locator('.exam-choice')).toHaveCount(2);
  await expect(page.locator('#routeExam h1')).toHaveText('Exam papers');
}

async function openDetail(page) {
  await openCatalogue(page);
  await page.locator('.exam-choice').first().locator('[data-act="open"]').click();
  await expect(page.locator('.exam-detail')).toBeVisible();
}

async function openExam(page) {
  await openDetail(page);
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
}

test('a paper is chosen from the list and only starts after Start', async ({ page }) => {
  await openCatalogue(page);
  await expect(page.locator('.exam-choice').first()).toContainText('Examen blanc n°1');
  await expect(page.locator('.exam-status').first()).toHaveText('Not started');
  await expect(page.locator('.exam-q')).toHaveCount(0);

  const beforeStart = await page.evaluate(function () {
    return Object.keys(localStorage).filter(function (k) { return k.indexOf('vocablab.exam.') === 0; });
  });
  expect(beforeStart).toEqual([]);

  await page.locator('.exam-choice').first().locator('[data-act="open"]').click();
  await expect(page.locator('.exam-detail')).toBeVisible();
  await expect(page.locator('.exam-detail [data-act="start"]')).toHaveText('Start exam');
  await expect(page.locator('.exam-detail-note')).toContainText('Wattier');
  await expect(page.locator('.exam-q')).toHaveCount(0);

  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
  const afterStart = await page.evaluate(function (key) { return JSON.parse(localStorage.getItem(key)); }, SESSION_KEY);
  expect(afterStart.expiresAt).toBeGreaterThan(Date.now());
});

test('the catalogue grows when another exam is installed', async ({ page }) => {
  await openCatalogue(page);
  await page.evaluate(function () {
    const copy = JSON.parse(JSON.stringify(window.ExamData.list[0]));
    copy.id = 'blanc-3';
    copy.number = 3;
    copy.title = 'Examen blanc n°3';
    copy.subtitle = 'Troisième sujet';
    window.ExamData.list.push(copy);
    window.ExamData.byId[copy.id] = copy;
    window.Exam.render();
  });
  await expect(page.locator('.exam-choice')).toHaveCount(3);
  await expect(page.locator('.exam-choice').nth(2)).toContainText('Examen blanc n°3');

  // The whole card is a click target, not only its button.
  await page.locator('.exam-choice').nth(2).locator('h2').click();
  await expect(page.locator('.exam-detail h1')).toHaveText('Examen blanc n°3');
});

test('a second paper opens with its own pistes and a letter essay', async ({ page }) => {
  await openCatalogue(page);
  const second = page.locator('.exam-choice').nth(1);
  await expect(second).toContainText('Examen blanc n°2');
  await expect(second).toContainText('3 audio tracks');
  await expect(second.locator('.exam-status')).toHaveText('Not started');

  await second.locator('h2').click();
  await expect(page.locator('.exam-detail h1')).toHaveText('Examen blanc n°2');
  await expect(page.locator('.exam-detail [data-act="start"]')).toHaveText('Start exam');
  await page.locator('.exam-detail [data-act="start"]').click();

  await expect(page.locator('.exam-part')).toHaveCount(3);
  await expect(page.locator('.exam-q')).toHaveCount(40);
  const sources = await page.locator('audio.exam-player').evaluateAll(function (els) {
    return els.map(function (el) { return el.getAttribute('src'); });
  });
  expect(sources).toEqual([
    'exam/No.2/delf_b2_ibk_28.mp3',
    'exam/No.2/delf_b2_ibk_29.mp3',
    'exam/No.2/delf_b2_ibk_30.mp3'
  ]);
  await expect(page.locator('#examPart-production')).toContainText('taxi');
  await expect(page.locator('#examPart-production')).toContainText('lettre');
});

test('the second paper grades its réclamation against letter rules', async ({ page }) => {
  await openCatalogue(page);
  await page.locator('.exam-choice').nth(1).locator('[data-act="open"]').click();
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-q')).toHaveCount(40);

  const essay = page.locator('#examEssay');
  const text = Array.from({ length: 250 }, function (_, i) { return 'mot' + (i + 1); }).join(' ');
  await essay.fill(text);
  await page.getByRole('button', { name: 'AI feedback' }).first().click();
  await expect(page.locator('#examFeedback')).toBeVisible();
  expect(lastTutorPrompt).toContain('Wattier');
  expect(lastTutorPrompt).toContain('EXIGENCES DE LA LETTRE');
  expect(lastTutorPrompt).not.toContain('EXIGENCES DE L’ARTICLE');
  expect(lastTutorPrompt).toContain('remboursement');
});

test('the DELF paper renders with all questions, tick boxes and three audio tracks', async ({ page, request }) => {
  await openExam(page);
  await expect(page.locator('#routeExam h1')).toHaveText('Examen blanc n°1');
  await expect(page.locator('.exam-q')).toHaveCount(40);
  await expect(page.locator('.exam-questions input[type="radio"]')).toHaveCount(120);
  await expect(page.locator('.exam-q').first().locator('.exam-opt')).toHaveCount(3);
  await expect(page.locator('.exam-part').nth(0)).toContainText('Compréhension de l’oral');
  await expect(page.locator('.exam-part').nth(1)).toContainText('small talk');
  await expect(page.locator('.exam-part').nth(2)).toContainText('250 mots');

  const sources = await page.locator('audio.exam-player').evaluateAll(function (els) {
    return els.map(function (el) { return el.getAttribute('src'); });
  });
  expect(sources).toEqual([
    'exam/No.1/delf_b2_ibk_25.mp3',
    'exam/No.1/delf_b2_ibk_26.mp3',
    'exam/No.1/delf_b2_ibk_27.mp3'
  ]);

  const audio = await request.get('/exam/No.1/delf_b2_ibk_26.mp3', { headers: { range: 'bytes=0-99' } });
  expect(audio.status()).toBe(206);
  expect(audio.headers()['content-type']).toContain('audio/mpeg');
});

test('the first listening track actually plays in the page', async ({ page }) => {
  await openExam(page);
  const played = await page.locator('audio.exam-player').first().evaluate(async function (el) {
    el.muted = true;
    try { await el.play(); } catch (err) { return { error: String(err && err.message || err) }; }
    await new Promise(function (resolve) { setTimeout(resolve, 800); });
    const out = { paused: el.paused, time: el.currentTime, ready: el.readyState, code: el.error && el.error.code };
    el.pause();
    return out;
  });
  expect(played.error).toBeUndefined();
  expect(played.code).toBeFalsy();
  expect(played.time).toBeGreaterThan(0);
});

test('a missing audio file says so instead of staying silent', async ({ page }) => {
  // Reproduces any device that cannot reach the exam folder (404 on the track).
  await page.route('**/*.mp3', function (route) {
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' });
  });
  await openExam(page);
  const outcome = await page.locator('audio.exam-player').first().evaluate(function (el) {
    return el.play().then(function () { return 'played'; }, function (err) { return String(err && err.name || err); });
  });
  expect(outcome).not.toBe('played');
  const note = page.locator('.exam-audio-missing').first();
  await expect(note).toBeVisible();
  await expect(note).toContainText('did not load');
});

test('ticking an answer saves it and survives a reload', async ({ page }) => {
  await openExam(page);
  const first = page.locator('.exam-q').first();
  await first.locator('.exam-opt').nth(1).click();
  await expect(first.locator('input[type="radio"]').nth(1)).toBeChecked();
  await expect(page.locator('#examAnswered')).toHaveText('1 / 40 answered');

  await page.reload();
  await expect(page.locator('.exam-choice')).toHaveCount(2);
  await expect(page.locator('.exam-status.is-active')).toBeVisible();
  await page.locator('.exam-choice[data-exam-card="blanc-1"]').locator('[data-act="open"]').click();
  await expect(page.locator('.exam-detail [data-act="start"]')).toHaveText('Continue exam');
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
  await expect(page.locator('.exam-q').first().locator('input[type="radio"]').nth(1)).toBeChecked();
  await expect(page.locator('#examAnswered')).toHaveText('1 / 40 answered');
});

test('the essay autosaves, counts words and can ask for AI feedback', async ({ page }) => {
  await openExam(page);
  const essay = page.locator('#examEssay');
  const text = Array.from({ length: 250 }, function (_, i) { return 'mot' + (i + 1); }).join(' ');
  await essay.fill(text);
  await expect(page.locator('#examWordCount')).toHaveText('250 / 250 words');

  await page.getByRole('button', { name: 'AI feedback' }).first().click();
  const feedback = page.locator('#examFeedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText('Estimation : 15/25');
  expect(lastTutorPrompt).toContain('Wattier');
  expect(lastTutorPrompt).toContain('Respect de la consigne');
  expect(lastTutorPrompt).toContain('225');
  expect(lastTutorPrompt).toContain('PRODUCTION DU CANDIDAT');

  await page.reload();
  await expect(page.locator('.exam-choice')).toHaveCount(2);
  await page.locator('.exam-choice[data-exam-card="blanc-1"]').locator('[data-act="open"]').click();
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
  await expect(page.locator('#examEssay')).toHaveValue(text);
  await expect(page.locator('#examWordCount')).toHaveText('250 / 250 words');
});

test('the AI reads the examiner’s brief when correcting an essay', async ({ page, request }) => {
  await request.post('/__e2e__/script', {
    data: { examId: 'blanc-1', text: 'SCRIPT — Ludivine ouvre un café pour chats à Tours.' }
  });
  await openExam(page);

  const text = Array.from({ length: 250 }, function (_, i) { return 'mot' + (i + 1); }).join(' ');
  await page.locator('#examEssay').fill(text);
  await page.getByRole('button', { name: 'AI feedback' }).first().click();
  await expect(page.locator('#examFeedback')).toBeVisible();

  expect(lastTutorPrompt).toContain('DOCUMENT DE RÉFÉRENCE');
  expect(lastTutorPrompt).toContain('café pour chats');
  expect(lastTutorPrompt).toContain('ne le recopie pas');
});

test('review lists every answer and marks the unanswered ones', async ({ page }) => {
  await openExam(page);
  const first = page.locator('.exam-q').first();
  const chosen = await first.locator('.exam-opt-label').first().innerText();
  await first.locator('.exam-opt').first().click();
  await page.getByRole('button', { name: 'Review answers' }).first().click();

  await expect(page.locator('.exam-review-row')).toHaveCount(40);
  await expect(page.locator('.exam-review-row').first()).toContainText(chosen);
  await expect(page.locator('.exam-review-row.is-empty')).toHaveCount(39);
  await expect(page.getByText('No official answer key')).toBeVisible();

  await page.getByRole('button', { name: 'Back to the paper' }).click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
});

test('after 24 hours the exam restarts with empty answers', async ({ page }) => {
  await openExam(page);
  await page.locator('.exam-q').first().locator('.exam-opt').first().click();
  await expect(page.locator('#examAnswered')).toHaveText('1 / 40 answered');

  await page.evaluate(function (key) {
    const saved = JSON.parse(localStorage.getItem(key));
    saved.expiresAt = Date.now() - 1000;
    localStorage.setItem(key, JSON.stringify(saved));
  }, SESSION_KEY);
  await page.reload();
  await expect(page.locator('.exam-choice')).toHaveCount(2);
  await expect(page.locator('.exam-status.is-expired')).toHaveText('Session expired');

  await page.locator('.exam-choice[data-exam-card="blanc-1"]').locator('[data-act="open"]').click();
  await expect(page.locator('.exam-status.is-expired')).toHaveText('Session expired');
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-part')).toHaveCount(3);
  await expect(page.locator('#examAnswered')).toHaveText('0 / 40 answered');
  await expect(page.locator('.exam-questions input[type="radio"]:checked')).toHaveCount(0);

  const fresh = await page.evaluate(function (key) { return JSON.parse(localStorage.getItem(key)); }, SESSION_KEY);
  expect(fresh.expiresAt).toBeGreaterThan(Date.now());
});

test('part shortcuts scroll to the section without leaving the exam', async ({ page }) => {
  await openExam(page);
  await page.locator('.exam-jump-link').last().click();
  await expect(page).toHaveURL(/#\/exam$/);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'exam');
  await expect(page.locator('#examPart-production')).toBeInViewport();
  await expect(page.locator('.exam-part')).toHaveCount(3);
});

test('an attempt can be ended early and the paper closes', async ({ page }) => {
  await openExam(page);
  await page.locator('.exam-q').first().locator('.exam-opt').nth(1).click();
  await page.locator('#examEssay').fill('Mon article sur le café de chats.');

  page.on('dialog', function (dialog) { dialog.accept(); });
  await page.locator('.exam-hero [data-act="end"]').click();

  await expect(page.locator('.exam-review')).toBeVisible();
  await expect(page.locator('.exam-ended-note')).toContainText('has ended');
  await expect(page.locator('.exam-paper')).toHaveCount(0);
  await expect(page.locator('.exam-review-row:not(.is-empty)')).toHaveCount(1);

  // The answers survive the end, and so does the essay.
  const saved = await page.evaluate(function (key) { return JSON.parse(localStorage.getItem(key)); }, SESSION_KEY);
  expect(saved.endedAt).toBeGreaterThan(0);
  expect(saved.essay).toContain('café de chats');

  // There is no way back into the paper: only a fresh session.
  await expect(page.locator('[data-act="paper"]')).toHaveCount(0);
  await expect(page.locator('.exam-review [data-act="reset"]')).toBeVisible();
});

test('a saved attempt that was ended says so and only opens for review', async ({ page }) => {
  await openCatalogue(page);
  await page.evaluate(function (key) {
    const now = Date.now();
    localStorage.setItem(key, JSON.stringify({
      examId: 'blanc-1', startedAt: now - 3600000, expiresAt: now + 3600000,
      answers: {}, essay: '', feedback: '', endedAt: now - 60000, savedAt: now - 60000
    }));
  }, SESSION_KEY);

  await page.reload();
  const first = page.locator('.exam-choice').first();
  await expect(first.locator('.exam-status')).toHaveText('Ended');
  await expect(first.locator('[data-act="open"]')).toHaveText('Review attempt');

  await first.locator('[data-act="open"]').click();
  await expect(page.locator('.exam-detail [data-act="start"]')).toHaveText('Review attempt');
  await page.locator('.exam-detail [data-act="start"]').click();
  await expect(page.locator('.exam-review')).toBeVisible();
  await expect(page.locator('.exam-paper')).toHaveCount(0);
});

test('the exam chrome follows the interface language', async ({ page }) => {
  await openExam(page);
  await page.evaluate(function () { window.I18n.setLang('vi'); });
  await expect(page.getByRole('button', { name: 'Xem lại câu trả lời' }).first()).toBeVisible();
  await expect(page.locator('#examAnswered')).toHaveText('Đã trả lời 0 / 40');

  await page.evaluate(function () { window.I18n.setLang('fr'); });
  await expect(page.getByRole('button', { name: 'Voir mes réponses' }).first()).toBeVisible();
  await expect(page.locator('.exam-audio-label').first()).toHaveText('Piste 25');
});
