import { Page, Locator } from '@playwright/test';

export class LoginPage {
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly errorMessage: Locator;

    constructor(private readonly page: Page) {
        this.emailInput = page.getByTestId('email-input');
        this.passwordInput = page.getByTestId('password-input');
        this.loginButton = page.getByTestId('login-submit');
        this.errorMessage = page.getByTestId('login-error');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async getErrorMessage(): Promise<Locator> {
        return this.errorMessage;
    }
}
