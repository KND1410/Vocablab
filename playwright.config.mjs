import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT || 4173);
const baseURL = process.env.E2E_BASE_URL || ('http://127.0.0.1:' + port);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'en-GB',
    timezoneId: 'Europe/Paris',
    // Uses Playwright's pinned Chromium by default so the suite is reproducible;
    // set PW_CHANNEL=chrome (or msedge) to test an installed browser instead.
    channel: process.env.PW_CHANNEL || undefined,
    ...devices['Desktop Chrome']
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'node tests/e2e/server.mjs',
    url: baseURL + '/',
    reuseExistingServer: true,
    timeout: 20_000
  }
});
