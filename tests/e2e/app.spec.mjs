import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/__e2e__/reset');
});

test('local account can sign up and reach the home screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#authScreen')).toBeVisible();
  await page.getByRole('button', { name: 'Create an account' }).click();
  await page.locator('#authName').fill('E2E Learner');
  await page.locator('#authEmail').fill('e2e@local.test');
  await page.locator('#authPassword').fill('local-test-password');
  await page.locator('#authSubmit').click();
  await expect(page.locator('#recoveryDialog')).toBeVisible();
  await page.getByRole('button', { name: 'I saved it' }).click();
  await expect(page.locator('body')).not.toHaveClass(/auth-locked/);
  await expect(page.locator('#homeName')).toHaveText('E2E Learner');
  await expect(page.locator('#questList .quest')).toHaveCount(3);
});
