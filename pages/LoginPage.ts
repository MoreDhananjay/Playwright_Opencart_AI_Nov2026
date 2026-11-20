import { Locator, Page } from "@playwright/test";

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly loginWarning: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.emailInput = page.getByLabel("E-Mail Address");
        this.passwordInput = page.getByLabel("Password");
        this.loginButton = page.getByRole("button", { name: "Login", exact: true });
        this.loginWarning = page.locator(".alert-danger");
    }

    /**
     * Enters customer credentials and submits the login form.
     * @param email - Customer email address
     * @param password - Customer password
     */
    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
     * Checks that the login form is displayed.
     * @returns true when the email and login controls are visible
     */
    async isLoginPageExists(): Promise<boolean> {
        return (await this.emailInput.isVisible()) && (await this.loginButton.isVisible());
    }

    /**
     * Checks for the store's invalid-credentials warning.
     * @returns true when the warning is visible
     */
    async isLoginWarningVisible(): Promise<boolean> {
        return this.loginWarning.isVisible();
    }

    /**
     * Reads the warning displayed after an unsuccessful login.
     * @returns The visible login warning text
     */
    async getLoginWarningText(): Promise<string> {
        return this.loginWarning.innerText();
    }
}
