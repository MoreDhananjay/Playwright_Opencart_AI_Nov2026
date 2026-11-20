import { Locator, Page } from "@playwright/test";

export class CartPage {
    private readonly page: Page;

    // Locators
    private readonly cartHeading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.cartHeading = page.getByRole("heading", { name: /^Shopping Cart/, level: 1 });
    }

    /**
     * Checks that the shopping cart page is displayed.
     * @returns true when the cart heading is visible
     */
    async isCartPageExists(): Promise<boolean> {
        return this.cartHeading.isVisible();
    }

    /**
     * Checks that a product is present in the cart.
     * @param productName - Product name to find
     * @returns true when the product row is visible
     */
    async isProductInCart(productName: string): Promise<boolean> {
        return this.productRow(productName).isVisible();
    }

    /**
     * Reads the quantity displayed for a product in the cart.
     * @param productName - Product name whose quantity to read
     * @returns The displayed quantity
     */
    async getProductQuantity(productName: string): Promise<string> {
        return this.productRow(productName).getByRole("textbox").inputValue();
    }

    /**
     * Reads the product row text, including its unit and line total prices.
     * @param productName - Product name whose row to read
     * @returns The product row text
     */
    async getProductRowText(productName: string): Promise<string> {
        return this.productRow(productName).innerText();
    }

    /**
     * Reads the total shown in the cart summary.
     * @returns The displayed cart total
     */
    async getCartTotal(): Promise<string> {
        const totalRow = this.page.getByRole("row", { name: /^Total/ });
        return totalRow.getByRole("cell").last().innerText();
    }

    private productRow(productName: string): Locator {
        return this.page.getByRole("row").filter({ hasText: productName });
    }
}
