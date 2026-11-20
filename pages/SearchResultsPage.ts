import { Locator, Page } from "@playwright/test";

import { ProductPage } from "./ProductPage";

export class SearchResultsPage {
    private readonly page: Page;

    // Locators
    private readonly searchResultsHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.searchResultsHeading = page.getByRole("heading", { name: "Products meeting the search criteria", level: 2 });
    }

    /**
     * Checks that the product search results are displayed.
     * @returns true when the results heading is visible
     */
    async isSearchResultsPageExists(): Promise<boolean> {
        return this.searchResultsHeading.isVisible();
    }

    /**
     * Checks that a product appears in the search results.
     * @param productName - Product name to find
     * @returns true when the product heading is visible
     */
    async isProductDisplayed(productName: string): Promise<boolean> {
        return this.page.getByRole("heading", { name: productName, level: 4, exact: true }).isVisible();
    }

    /**
     * Opens a product from the search results.
     * @param productName - Product name to open
     */
    async openProduct(productName: string): Promise<ProductPage> {
        await this.page
            .getByRole("heading", { name: productName, level: 4, exact: true })
            .getByRole("link", { name: productName, exact: true })
            .click();
        return new ProductPage(this.page);
    }
}
