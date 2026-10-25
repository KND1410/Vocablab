import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { settings: { uiLang: 'vi' } });
});

test('the lessons page shows both courses with their own progress', async ({ page }) => {
  await openRoute(page, 'lessons');

  await expect(page.locator('.study-card h2')).toHaveText('Bản đồ các thì');
  await expect(page.locator('#handbookCard h2')).toHaveText('Cẩm nang ngữ pháp A2–B2');
  await expect(page.locator('#btnStudy')).toContainText('Mở bản đồ các thì');
  await expect(page.locator('#btnOpenHandbook')).toContainText('Mở cẩm nang');
  await expect(page.locator('#studyPct')).toHaveText('0 / 18');
  await expect(page.locator('#handbookPct')).toHaveText('0 / 12');
});

test('the handbook opens its own 12-chapter map and saves progress separately', async ({ page }) => {
  await openRoute(page, 'lessons');
  await page.locator('#btnOpenHandbook').click();

  await expect(page.locator('body')).toHaveAttribute('data-screen', 'grammar');
  await expect(page.locator('#screenGrammar .grammar-title')).toHaveText('Cẩm nang ngữ pháp A2–B2');
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(12);

  // Open the first chapter and complete it.
  await page.locator('#screenGrammar .grammar-lesson-card[data-id="hb-map"]').click();
  await expect(page.locator('#screenGrammar .lesson-title')).toBeVisible();
  await expect(page.locator('#screenGrammar .exercise')).toHaveCount(3);
  await page.locator('#screenGrammar [data-action=toggle-complete]').click();

  // The handbook card counts 1 / 12; the atlas is untouched.
  await page.locator('#screenGrammar [data-action=course]').click();
  await expect(page.locator('#screenGrammar .grammar-lesson-card.is-done')).toHaveCount(1);
  await page.locator('#screenGrammar [data-action=exit]').click();
  // Exit lands on the home page; the course cards live on Lessons.
  await openRoute(page, 'lessons');
  await expect(page.locator('#handbookPct')).toHaveText('1 / 12');
  await expect(page.locator('#studyPct')).toHaveText('0 / 18');

  const keys = await page.evaluate(function () {
    return {
      handbook: localStorage.getItem('vocablab.grammarProgress:handbook'),
      tenses: localStorage.getItem('vocablab.grammarProgress')
    };
  });
  expect(keys.handbook).toContain('hb-map');
  expect(keys.tenses).toBeNull();
});

test('the atlas still opens its 18 chapters after visiting the handbook', async ({ page }) => {
  await openRoute(page, 'lessons');
  await page.locator('#btnOpenHandbook').click();
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(12);
  await page.locator('#screenGrammar [data-action=exit]').click();

  await openRoute(page, 'lessons');
  await page.locator('#btnStudy').click();
  await expect(page.locator('#screenGrammar .grammar-title')).toHaveText('Bản đồ các thì');
  await expect(page.locator('#screenGrammar .grammar-lesson-card')).toHaveCount(18);
});
