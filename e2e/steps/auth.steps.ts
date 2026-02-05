import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/fixtures.js';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd(test);

Given('I am on the login page', async ({ loginPage }) => {
    await loginPage.navigate();
});

When('I login with valid credentials', async ({ loginPage }) => {
    const email = process.env.ADMIN_EMAIL || 'admin@calltrack.com';
    const password = process.env.ADMIN_PASSWORD || 'password';
    await loginPage.login(email, password);
});

When('I login with email {string} and password {string}', async ({ loginPage }, email, password) => {
    await loginPage.login(email, password);
});

Then('I should be on the home page', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
});

Then('I should see the dashboard metrics', async ({ dashboardPage }) => {
    await dashboardPage.verifyMetricsVisible();
});

Then('I should see an error message {string}', async ({ loginPage }, message) => {
    const errorLocator = await loginPage.getErrorMessage();
    await expect(errorLocator).toBeVisible();
});
