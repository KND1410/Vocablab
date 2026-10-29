import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

/* A mid-size phone: the viewport where the off-canvas drawer replaces the
   sidebar, and where a missed tap target is felt rather than seen. */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.beforeEach(async ({ request, page }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { overwrite: true });
});

async function openDrawer(page) {
  await page.locator('#btnNavToggle').click();
  await expect(page.locator('body')).toHaveClass(/nav-open/);
  await expect(page.locator('#sideNav')).toBeInViewport();
}

test('the phone drawer opens, closes from beside it, and does not scroll the page', async ({ page }) => {
  await openRoute(page, 'home');
  await expect(page.locator('#navScrim')).toBeHidden();

  await openDrawer(page);
  await expect(page.locator('#navScrim')).toBeVisible();
  await expect(page.locator('#btnNavToggle')).toHaveAttribute('aria-expanded', 'true');

  // A tap in the shaded area — a real pointer position, since the drawer sits
  // on top of the scrim's centre.
  await page.mouse.click(370, 420);
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
  await expect(page.locator('#btnNavToggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#sideNav')).not.toBeInViewport();
});

test('sign out is reachable from the drawer on a phone', async ({ page }) => {
  await openRoute(page, 'home');
  // The topbar pill is hidden by the phone layout, so it must live in here.
  await expect(page.locator('#btnSignOut')).toBeHidden();
  await openDrawer(page);
  await expect(page.locator('#btnSignOutNav')).toBeVisible();
  await expect(page.locator('#btnSignOutNav')).toContainText('Sign out');
  await expect(page.locator('#btnSignOutNav')).toHaveCSS('min-height', '44px');
});

test('the drawer has its own close button and Escape also works', async ({ page }) => {
  await openRoute(page, 'home');
  await openDrawer(page);
  await page.locator('#btnNavClose').click();
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);

  await openDrawer(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
});

test('choosing a page closes the drawer and the labels stay readable', async ({ page }) => {
  await openRoute(page, 'home');
  await openDrawer(page);

  // Even with the desktop rail collapsed in storage, the drawer shows labels.
  await page.evaluate(function () {
    localStorage.setItem('vocablab.sidebarCollapsed', '1');
    document.body.classList.add('sidebar-collapsed');
  });
  await expect(page.locator('#sideNav .nav-item .nav-label').first()).toBeVisible();
  await expect(page.locator('#sideNav .nav-item').first()).toHaveCSS('min-height', '46px');

  await page.locator('#sideNav .nav-item[data-route="exam"]').click();
  await expect(page).toHaveURL(/#\/exam$/);
  await expect(page.locator('body')).not.toHaveClass(/nav-open/);
});

test('no page spills sideways on a phone', async ({ page }) => {
  for (const route of ['home', 'lessons', 'practice', 'exam', 'community', 'progress']) {
    await openRoute(page, route);
    const overflow = await page.evaluate(function () {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow, route + ' must not scroll horizontally').toBeLessThanOrEqual(1);
  }
});

test('the desktop rail still collapses with the same control', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openRoute(page, 'home');
  await expect(page.locator('#sideNav')).toBeInViewport();
  await expect(page.locator('#btnNavClose')).toBeHidden();
  await expect(page.locator('#btnSignOutNav')).toBeHidden();

  await page.locator('#btnSidebarToggle').click();
  await expect(page.locator('body')).toHaveClass(/sidebar-collapsed/);
  await expect(page.locator('#sideNav .nav-label').first()).toBeHidden();

  await page.locator('#btnSidebarToggle').click();
  await expect(page.locator('body')).not.toHaveClass(/sidebar-collapsed/);
});
