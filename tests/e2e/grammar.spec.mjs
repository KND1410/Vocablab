import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { settings: { uiLang: 'vi' } });
});

test('the lessons page shows both courses with their own progress', async ({ page }) => {
  await openRoute(page, 'lessons');

  await expect(page.locator('.study-card h2')).toHaveText('Bản đồ thì tiếng Pháp');
  await expect(page.locator('#handbookCard h2')).toHaveText('Grammaire progressive du français');
  await expect(page.locator('#btnStudy')).toContainText('Mở bản đồ thì tiếng Pháp');
  await expect(page.locator('#btnOpenHandbook')).toContainText('Mở khoá ngữ pháp');
  await expect(page.locator('#studyPct')).toHaveText('0 / 18');
  await expect(page.locator('#handbookPct')).toHaveText('0 / 52');
});

test('the handbook opens its own 52-chapter map and saves progress separately', async ({ page }) => {
  await openRoute(page, 'lessons');
  await page.locator('#btnOpenHandbook').click();

  await expect(page.locator('body')).toHaveAttribute('data-screen', 'grammar');
  await expect(page.locator('#screenGrammar .grammar-title')).toHaveText('Grammaire progressive du français');
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(52);

  // Open the first chapter and complete it.
  await page.locator('#screenGrammar .grammar-lesson-card[data-id="gp-etre"]').click();
  await expect(page.locator('#screenGrammar .lesson-title')).toBeVisible();
  await expect(page.locator('#screenGrammar .exercise')).toHaveCount(3);
  await page.locator('#screenGrammar [data-action=toggle-complete]').click();

  // The handbook card counts 1 / 52; the atlas is untouched.
  await page.locator('#screenGrammar [data-action=course]').click();
  await expect(page.locator('#screenGrammar .grammar-lesson-card.is-done')).toHaveCount(1);
  await page.locator('#screenGrammar [data-action=exit]').click();
  // Exit lands back on the Lessons listing; the course cards live there.
  await openRoute(page, 'lessons');
  await expect(page.locator('#handbookPct')).toHaveText('1 / 52');
  await expect(page.locator('#studyPct')).toHaveText('0 / 18');

  const keys = await page.evaluate(function () {
    return {
      handbook: localStorage.getItem('vocablab.grammarProgress:handbook'),
      tenses: localStorage.getItem('vocablab.grammarProgress')
    };
  });
  expect(keys.handbook).toContain('gp-etre');
  expect(keys.tenses).toBeNull();
});

test('an English interface opens the course in English by default', async ({ page }) => {
  await seedApp(page, { settings: { uiLang: 'en' }, overwrite: true });
  await openRoute(page, 'lessons');

  await expect(page.locator('.study-card h2')).toHaveText('French Tenses Atlas');
  await page.locator('#btnStudy').click();
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'grammar');
  await expect(page.locator('#screenGrammar .grammar-title')).toHaveText('French Tenses Atlas');
  await expect(page.locator('#screenGrammar .grammar-part').first()).toContainText('Getting started');
  await expect(page.locator('#screenGrammar [data-action=exit]').first()).toContainText('Lessons');
});

test('the atlas still opens its 18 chapters after visiting the handbook', async ({ page }) => {
  await openRoute(page, 'lessons');
  await page.locator('#btnOpenHandbook').click();
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(52);
  await page.locator('#screenGrammar [data-action=exit]').click();

  await openRoute(page, 'lessons');
  await page.locator('#btnStudy').click();
  await expect(page.locator('#screenGrammar .grammar-title')).toHaveText('Bản đồ thì tiếng Pháp');
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(18);
});
