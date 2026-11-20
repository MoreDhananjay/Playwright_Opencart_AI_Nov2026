import { Locator, Page } from "@playwright/test";

import { CartPage } from "./CartPage";

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly productHeading: Locator;
    private readonly quantityInput: Locator;
    private readonly addToCartButton: Locator;
    private readonly addedToCartMessage: Locator;
    private readonly shoppingCartLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.productHeading = page.getByRole("heading", { level: 1 });
        this.quantityInput = page.locator("#input-quantity");
        this.addToCartButton = page.getByRole("button", { name: "Add to Cart", exact: true });
        this.addedToCartMessage = page.getByText("Success: You have added", { exact: false });
        this.shoppingCartLink = page.getByRole("link", { name: "shopping cart", exact: true });
    }

    /**
     * Checks that the requested product details page is displayed.
     * @param productName - Expected product name
     * @returns true when the product heading matches
     */
    async isProductDetailsPageExists(productName: string): Promise<boolean> {
        return (await this.productHeading.isVisible()) && (await this.productHeading.innerText()) === productName;
    }

    /**
     * Sets the quantity and adds the product to the cart.
     * @param quantity - Quantity to add
     */
    async addToCart(quantity: string): Promise<void> {
        await this.quantityInput.fill(quantity);
        await this.addToCartButton.click();
        await this.addedToCartMessage.waitFor({ state: "visible" });
    }

    /**
     * Opens the cart from the add-to-cart confirmation.
     * @returns CartPage - The shopping cart page
     */
    async openShoppingCart(): Promise<CartPage> {
        await this.shoppingCartLink.click();
        return new CartPage(this.page);
    }
}
