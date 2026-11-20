import { Locator, Page } from "@playwright/test";

import { LogoutPage } from "./LogoutPage";

export class MyAccountPage {
    private readonly page: Page;

    // Locators
    private readonly accountHeading: Locator;
    private readonly accountButton: Locator;
    private readonly logoutLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.accountHeading = page.getByRole("heading", { name: "My Account", level: 1 });
        this.accountButton = page.locator("#top").getByRole("link", { name: "My Account", exact: true });
        this.logoutLink = page.locator("#top").getByRole("link", { name: "Logout", exact: true });
    }

    /**
     * Checks that the customer account dashboard is displayed.
     * @returns true when the account heading is visible
     */
    async isMyAccountPageExists(): Promise<boolean> {
        return this.accountHeading.isVisible();
    }

    /**
     * Checks that the authenticated account navigation is available.
     * @returns true when the account menu offers logout
     */
    async isAuthenticatedAccountNavigationAvailable(): Promise<boolean> {
        await this.accountButton.click();
        return this.logoutLink.isVisible();
    }

    /**
     * Logs out through the My Account menu.
     * @returns LogoutPage - The logout confirmation page
     */
    async clickLogout(): Promise<LogoutPage> {
        await this.accountButton.click();
        await this.logoutLink.click();
        return new LogoutPage(this.page);
    }
}
