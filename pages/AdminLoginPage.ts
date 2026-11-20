import { Locator, Page } from "@playwright/test";

export class AdminLoginPage {
    private readonly page: Page;

    // Locators
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly dashboardHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.usernameInput = page.getByLabel("Username");
        this.passwordInput = page.getByLabel("Password");
        this.loginButton = page.getByRole("button", { name: "Login", exact: true });
        this.dashboardHeading = page.getByRole("heading", { name: "Dashboard", exact: true });
    }

    /**
     * Opens the configured administration portal.
     */
    async openAdminPortal(): Promise<void> {
        const adminUrl = process.env.ADMIN_APP_URL;
        if (!adminUrl) {
            throw new Error("ADMIN_APP_URL must be configured to open the administration portal.");
        }

        await this.page.goto(adminUrl);
    }

    /**
     * Signs in to the administration portal.
     * @param username - Configured administrator username
     * @param password - Configured administrator password
     */
    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * Checks whether the administration dashboard is displayed.
     * @returns true when the dashboard heading is visible
     */
    async isDashboardExists(): Promise<boolean> {
        return this.dashboardHeading.isVisible();
    }
}
