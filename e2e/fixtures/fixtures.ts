import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { AuthClient } from '../api/AuthClient.js';

type MyFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    authClient: AuthClient;
};

export const test = base.extend<MyFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    dashboardPage: async ({ page }, use) => {
        await use(new DashboardPage(page));
    },
    authClient: async ({ request }, use) => {
        await use(new AuthClient(request));
    },
});
