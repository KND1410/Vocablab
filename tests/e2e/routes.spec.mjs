import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page);
});

/* The Files route has no sidebar entry any more — the class file is shown on
   the home page — so it is covered by its own test below. */
const ROUTES = [
  { route: 'home', screen: 'welcome', el: '#screenWelcome' },
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

test('the home page shows the class file itself, with no setup shortcuts', async ({ page }) => {
  await openRoute(page, 'home');

  // The Source and Topics cards are the class file, live on the home page.
  await expect(page.locator('#homeFilesSlot #srcName')).toBeVisible();
  await expect(page.locator('#homeFilesSlot #topicList')).toBeVisible();

  // The three onboarding cards are gone, and so is the sidebar entry.
  await expect(page.locator('#btnDemo')).toHaveCount(0);
  await expect(page.locator('#btnQuickSheet')).toHaveCount(0);
  await expect(page.locator('#btnQuickAi')).toHaveCount(0);
  await expect(page.locator('.nav-item[data-route="files"]')).toHaveCount(0);
  await expect(page.locator('.nav-item')).toHaveCount(6);
});

test('the files page still opens by URL and borrows the class file', async ({ page }) => {
  await openRoute(page, 'files');
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'files');
  await expect(page.locator('#routeFiles')).toBeVisible();
  await expect(page.locator('#filesSourceSlot #srcName')).toBeVisible();
  await expect(page.locator('#filesTopicsSlot #topicList')).toBeVisible();
  // No nav entry means nothing is marked current, and home takes the cards back.
  await expect(page.locator('.nav-item[aria-current="page"]')).toHaveCount(0);

  await openRoute(page, 'home');
  await expect(page.locator('#homeFilesSlot #srcName')).toBeVisible();
});

test('the practice page repeats the chosen topics before Start', async ({ page }) => {
  await openRoute(page, 'practice');
  await expect(page.locator('#practiceTopicChips .topic-chip')).toHaveText(['E2E topic']);
  await expect(page.locator('#practiceTopicCount')).toHaveText('1 topic selected · 6 words');
  await expect(page.locator('#btnStart')).toBeEnabled();

  // Changing the topics really changes this block, not just the class file.
  await page.locator('#practiceTopics a[href="#/home"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'welcome');
  await page.locator('#homeFilesSlot #topicList .topic-item').click();
  await expect(page.locator('#selectedSummary')).toHaveText('No topics selected');

  await openRoute(page, 'practice');
  await expect(page.locator('#practiceTopicChips .topic-chip')).toHaveCount(0);
  await expect(page.locator('#practiceTopicCount')).toContainText('pick at least one to start');
  await expect(page.locator('#btnStart')).toBeDisabled();
});

test('the learning language is a list that also sets the speech code', async ({ page }) => {
  await openRoute(page, 'practice');
  await page.locator('#btnSettings').click();
  await expect(page.locator('#settingsDialog')).toBeVisible();

  await expect(page.locator('#inpTargetLang')).toHaveValue('French');
  await expect(page.locator('#inpTargetLang option')).toHaveCount(16);
  await page.locator('#inpTargetLang').selectOption('Japanese');

  await expect(page.locator('#inpTargetCode')).toHaveValue('ja-JP');
  // The Azure voice list is French-only, so its field is hidden for Japanese.
  expect(await page.locator('#azureVoiceField').getAttribute('hidden')).not.toBeNull();
  await expect(page.locator('#azureVoiceNote')).toContainText('native Japanese voice');

  const saved = await page.evaluate(function () { return JSON.parse(localStorage.getItem('vocablab.settings')); });
  expect(saved.targetLang).toBe('Japanese');
  expect(saved.targetCode).toBe('ja-JP');

  // Back to French: the French Azure voice picker returns.
  await page.locator('#inpTargetLang').selectOption('French');
  await expect(page.locator('#inpTargetCode')).toHaveValue('fr-FR');
  expect(await page.locator('#azureVoiceField').getAttribute('hidden')).toBeNull();
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

test('the exam room lists its papers and community lists its members', async ({ page }) => {
  await openRoute(page, 'exam');
  await expect(page.locator('#routeExam h1')).toHaveText('Exam papers');
  await expect(page.locator('.exam-choice')).toHaveCount(2);

  await openRoute(page, 'community');
  await expect(page.locator('#routeCommunity h1')).toHaveText('Community');
  await expect(page.locator('.community-card')).toHaveCount(3);
  await expect(page.locator('#communityCount')).toHaveText('3 learners');
  await expect(page.locator('.community-card').first().locator('.community-name')).toHaveText('E2E Learner');
  await expect(page.locator('.community-email').first()).toContainText('***');
  await expect(page.locator('.community-avatar').first()).toHaveText('EL');
  await expect(page.locator('.community-card').first()).toContainText('2-day streak');
  await expect(page.locator('.community-card').first()).toContainText('12 days practised');
  await expect(page.locator('.community-card').nth(1)).toContainText('New member');
});

test('the in-app nav links change the route without a page load', async ({ page }) => {
  await openRoute(page, 'home');
  await page.locator('.nav-item[data-route="lessons"]').click();
  await expect(page).toHaveURL(/#\/lessons$/);
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'lessons');
});
