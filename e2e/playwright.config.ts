import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as dotenv from 'dotenv';
import path from 'path';

// Read from ".env" file.
dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });

const testDir = defineBddConfig({
    features: 'features/*.feature',
    steps: ['steps/*.steps.ts', 'fixtures/fixtures.ts'],
});

export default defineConfig({
    testDir,
    /* Maximum time one test can run for. */
    timeout: 60 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toBeVisible();`
         */
        timeout: 10 * 1000,
    },
    /* Run tests in files in parallel */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.BASE_URL || 'http://localhost:3000',

        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 10 * 1000,
        navigationTimeout: 15 * 1000,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
