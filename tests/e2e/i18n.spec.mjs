import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute, TERM_TO_MEANING } from './helpers.mjs';

test.beforeEach(async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { settings: { uiLang: 'en' } });
});

test('English is the default and the selector switches the whole UI to Vietnamese', async ({ page }) => {
  await openRoute(page, 'home');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Home');
  await expect(page.locator('#selUiLang')).toHaveValue('en');

  await page.locator('#selUiLang').selectOption('vi');

  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Trang chủ');
  await expect(page.locator('.nav-item[data-route="progress"] span[data-i18n]')).toHaveText('Tiến bộ của tôi');
  await expect(page.locator('#routePractice h1')).toHaveText('Luyện tập');
  await expect(page.locator('#toasts .toast').last()).toHaveText('Đã đổi ngôn ngữ giao diện.');

  // The Help dialog is part of "every UI string".
  await page.locator('#btnHelp').click();
  await expect(page.locator('#helpDialog h2')).toHaveText('Trợ giúp và cài đặt');
  await expect(page.locator('#helpDialog')).toContainText('Tài khoản và nhiệm vụ hằng ngày');
  await expect(page.locator('#helpDialog')).not.toContainText('Help & setup');
  await page.locator('#helpDialog button[value="close"]').click();

  // The choice is stored, not just painted.
  const stored = await page.evaluate(function () {
    return JSON.parse(localStorage.getItem('vocablab.settings')).uiLang;
  });
  expect(stored).toBe('vi');
});

test('the chosen language survives a reload', async ({ page }) => {
  await openRoute(page, 'home');
  await page.locator('#selUiLang').selectOption('vi');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Trang chủ');

  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.locator('#selUiLang')).toHaveValue('vi');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Trang chủ');
});

test('French and English can be selected again', async ({ page }) => {
  await openRoute(page, 'home');

  await page.locator('#selUiLang').selectOption('fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Accueil');
  await expect(page.locator('#routeProgress h1')).toHaveText('Mes progrès');
  await expect(page.locator('#toasts .toast').last()).toContainText('Langue de l');

  await page.locator('#selUiLang').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.nav-item[data-route="home"] span[data-i18n]')).toHaveText('Home');
  await expect(page.locator('#routeProgress h1')).toHaveText('My progress');
});

test('no untranslated catalogue keys are visible', async ({ page }) => {
  await openRoute(page, 'home');
  await page.locator('#selUiLang').selectOption('vi');

  const rawKeys = await page.evaluate(function () {
    // Catalogue keys look like `nav.home` / `levelUp.apply`; domains such as
    // `r.jina.ai` are content, not untranslated keys.
    const keyish = /^(brand|nav|files|lessons|practice|exam|community|progress|levelUp|corrections|ui)\.[a-zA-Z][a-zA-Z0-9.]*$/;
    const out = [];
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.children.length) return;
      const text = (el.textContent || '').trim();
      if (keyish.test(text)) out.push(text);
    });
    return out;
  });
  expect(rawKeys).toEqual([]);
});

test('target-language lesson content is never translated by the UI toggle', async ({ page }) => {
  await seedApp(page, {
    overwrite: true,
    settings: { uiLang: 'en', quizTypes: ['translate'], direction: 't2m', count: 10, source: 'builtin' }
  });
  await openRoute(page, 'practice');
  await page.locator('#btnStart').click();

  await expect(page.locator('#screenQuiz')).toBeVisible();
  const prompt = page.locator('#qPrompt');
  await expect(prompt).not.toHaveText('');
  const frenchPrompt = await prompt.textContent();
  // The prompt is the French term from the deck, not its Vietnamese meaning.
  expect(TERM_TO_MEANING[frenchPrompt]).toBeTruthy();

  await page.locator('#selUiLang').selectOption('vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(prompt).toHaveText(frenchPrompt);
});
