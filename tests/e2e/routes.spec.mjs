import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page);
});

const ROUTES = [
  { route: 'home', screen: 'welcome', el: '#screenWelcome' },
  { route: 'files', screen: 'files', el: '#routeFiles' },
  { route: 'lessons', screen: 'lessons', el: '#routeLessons' },
  { route: 'practice', screen: 'practice', el: '#routePractice' },
  { route: 'exam', screen: 'exam', el: '#routeExam' },
  { route: 'community', screen: 'community', el: '#routeCommunity' },
  { route: 'progress', screen: 'progress', el: '#routeProgress' }
];

test('every route opens its page and marks the matching nav item', async ({ page }) => {
  for (const item of ROUTES) {
    await openRoute(page, item.route);
    await expect(page.locator('body'), item.route).toHaveAttribute('data-screen', item.screen);
    await expect(page.locator(item.el), item.route).toBeVisible();
    await expect(page.locator('.nav-item[data-route="' + item.route + '"]')).toHaveAttribute('aria-current', 'page');
    // Only one route page is visible at a time (home is a `.screen`).
    if (item.route !== 'home') {
      await expect(page.locator('main .route-page:visible'), item.route).toHaveCount(1);
    }
  }
});

test('a deep link survives a reload', async ({ page }) => {
  await openRoute(page, 'progress');
  await expect(page.locator('#routeProgress')).toBeVisible();

  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'progress');
  await expect(page.locator('#routeProgress')).toBeVisible();
  await expect(page.locator('.nav-item[data-route="progress"]')).toHaveAttribute('aria-current', 'page');
});

test('exam and community are finished placeholders with a way back', async ({ page }) => {
  await openRoute(page, 'exam');
  await expect(page.locator('#routeExam h1')).toHaveText('Exam room');
  await expect(page.locator('#routeExam a[href="#/practice"]')).toBeVisible();

  await openRoute(page, 'community');
  await expect(page.locator('#routeCommunity h1')).toHaveText('Community');
});

test('the in-app nav links change the route without a page load', async ({ page }) => {
  await openRoute(page, 'home');
  await page.locator('.nav-item[data-route="lessons"]').click();
  await expect(page).toHaveURL(/#\/lessons$/);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'lessons');
});
