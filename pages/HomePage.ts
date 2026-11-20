import { Locator, Page } from "@playwright/test";

import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { SearchResultsPage } from "./SearchResultsPage";

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly accountButton: Locator;
    private readonly loginLink: Locator;
    private readonly registerLink: Locator;
    private readonly logoutLink: Locator;
    private readonly searchInput: Locator;
    private readonly featuredHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.accountButton = page.locator("#top").getByRole("link", { name: "My Account", exact: true });
        this.loginLink = page.locator("#top").getByRole("link", { name: "Login", exact: true });
        this.registerLink = page.locator("#top").getByRole("link", { name: "Register", exact: true });
        this.logoutLink = page.locator("#top").getByRole("link", { name: "Logout", exact: true });
        this.searchInput = page.getByPlaceholder("Search");
        this.featuredHeading = page.getByRole("heading", { name: "Featured", level: 3 });
    }

    /**
     * Opens the My Account menu.
     */
    async clickMyAccount(): Promise<void> {
        await this.accountButton.click();
    }

    /**
     * Opens the registration page from the My Account menu.
     */
    async openRegisterPage(): Promise<RegisterPage> {
        await this.clickMyAccount();
        await this.registerLink.click();
        return new RegisterPage(this.page);
    }

    /**
     * Opens the login page from the My Account menu.
     */
    async openLoginPage(): Promise<LoginPage> {
        await this.clickMyAccount();
        await this.loginLink.click();
        return new LoginPage(this.page);
    }

    /**
     * Searches the store for a product.
     * @param productName - Product name to search for
     */
    async searchProduct(productName: string): Promise<SearchResultsPage> {
        await this.searchInput.fill(productName);
        await this.searchInput.press("Enter");
        await this.page.waitForURL(/route=product\/search/);
        return new SearchResultsPage(this.page);
    }

    /**
     * Checks that the store homepage is displayed.
     * @returns true when the Featured section is visible
     */
    async isHomePageExists(): Promise<boolean> {
        return this.featuredHeading.isVisible();
    }

    /**
     * Checks that the account menu offers login but not logout.
     * @returns true when the customer is logged out
     */
    async isLoggedOut(): Promise<boolean> {
        await this.clickMyAccount();
        return (await this.loginLink.isVisible()) && !(await this.logoutLink.isVisible());
    }
}
