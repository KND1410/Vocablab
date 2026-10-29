import { test, expect } from '@playwright/test';
import { signIn, seedApp, openRoute } from './helpers.mjs';

/* The e2e API seeds three members (pending, suspended, active) plus the account
   that signs up, so the panel always has one of each status to act on. The
   fixture's role comes from the reset query, never from the signup form. */

test('a normal learner never sees the admin panel', async ({ page, request }) => {
  await request.post('/__e2e__/reset');
  await signIn(request);
  await seedApp(page, { deck: null });

  await openRoute(page, 'home');
  await expect(page.locator('#navAdmin')).toBeHidden();

  // The route still resolves, but the server refuses and the page says so.
  await openRoute(page, 'admin');
  await expect(page.locator('body')).toHaveAttribute('data-screen', 'admin');
  await expect(page.locator('#adminRoot')).toContainText('Admins only');
  await expect(page.locator('.admin-row')).toHaveCount(0);
});

test('an admin approves, suspends and reads the log', async ({ page, request }) => {
  await request.post('/__e2e__/reset?role=admin');
  await signIn(request);
  await seedApp(page, { deck: null });
  await openRoute(page, 'admin');

  await expect(page.locator('#navAdmin')).toBeVisible();
  await expect(page.locator('.admin-row')).toHaveCount(4);
  await expect(page.locator('.admin-stat')).toHaveCount(4);

  // Accounts needing attention are listed first.
  await expect(page.locator('.admin-row').first()).toContainText('Pending Pat');

  const pat = page.locator('.admin-row', { hasText: 'Pending Pat' });
  await expect(pat.locator('.admin-pill-pending')).toBeVisible();
  await pat.getByRole('button', { name: 'Approve' }).click();
  await expect(pat.locator('.admin-pill-active')).toBeVisible();

  // Suspending takes two clicks: the first one only arms the button.
  const luc = page.locator('.admin-row', { hasText: 'Luc Martin' });
  await luc.getByRole('button', { name: 'Suspend' }).click();
  await expect(luc.getByRole('button', { name: 'Confirm?' })).toBeVisible();
  await luc.getByRole('button', { name: 'Confirm?' }).click();
  await expect(luc.locator('.admin-pill-banned')).toBeVisible();

  // The log records both actions, newest first.
  await expect(page.locator('.admin-audit-row').first()).toContainText('Luc Martin');
  await expect(page.locator('.admin-audit-row', { hasText: 'Pending Pat' })).toHaveCount(1);

  // Search narrows the table without another request.
  await page.locator('.admin-search').fill('bea');
  await expect(page.locator('.admin-row')).toHaveCount(1);
  await expect(page.locator('.admin-row').first()).toContainText('Banned Bea');
  await page.locator('.admin-search').fill('');
  await expect(page.locator('.admin-row')).toHaveCount(4);
});

test('the approval setting survives a reload', async ({ page, request }) => {
  await request.post('/__e2e__/reset?role=admin');
  await signIn(request);
  await seedApp(page, { deck: null });
  await openRoute(page, 'admin');

  const box = page.locator('.admin-switch input');
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(box).toBeChecked();

  await page.reload();
  await expect(page.locator('.admin-switch input')).toBeChecked();

  const saved = await request.get('/api/admin/settings');
  expect(saved.ok()).toBeTruthy();
  expect((await saved.json()).signupApproval).toBe(true);
});
