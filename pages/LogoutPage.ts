import { Locator, Page } from "@playwright/test";

import { HomePage } from "./HomePage";

export class LogoutPage {
    private readonly page: Page;

    // Locators
    private readonly logoutHeading: Locator;
    private readonly continueLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.logoutHeading = page.getByRole("heading", { name: "Account Logout", level: 1 });
        this.continueLink = page.getByRole("link", { name: "Continue", exact: true });
    }

    /**
     * Checks that the logout confirmation page is displayed.
     * @returns true when the logout heading is visible
     */
    async isLogoutPageExists(): Promise<boolean> {
        return this.logoutHeading.isVisible();
    }

    /**
     * Continues from the logout confirmation page to the homepage.
     * @returns HomePage - The store homepage
     */
    async clickContinue(): Promise<HomePage> {
        await this.continueLink.click();
        return new HomePage(this.page);
    }
}
