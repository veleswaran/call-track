import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
    private readonly heading: Locator;
    private readonly totalCallsCard: Locator;
    private readonly missedCallsCard: Locator;
    private readonly devicesLink: Locator;
    private readonly callLogsLink: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.locator('h1');
        this.totalCallsCard = page.locator('text=Total Calls');
        this.missedCallsCard = page.locator('text=Missed Calls');
        this.devicesLink = page.locator('nav >> text=Devices');
        this.callLogsLink = page.locator('nav >> text=Call Logs');
    }

    async getHeadingText(): Promise<string | null> {
        return this.heading.textContent();
    }

    async verifyMetricsVisible(): Promise<void> {
        await expect(this.totalCallsCard).toBeVisible();
        await expect(this.missedCallsCard).toBeVisible();
    }

    async navigateToDevices(): Promise<void> {
        await this.devicesLink.click();
    }

    async navigateToCallLogs(): Promise<void> {
        await this.callLogsLink.click();
    }
}
