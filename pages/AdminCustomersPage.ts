import { Locator, Page } from "@playwright/test";

export class AdminCustomersPage {
    private readonly page: Page;

    // Locators
    private readonly customersMenu: Locator;
    private readonly customersMenuLink: Locator;
    private readonly customerListHeading: Locator;
    private readonly emailFilter: Locator;
    private readonly filterButton: Locator;
    private readonly customerRows: Locator;
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly emailInput: Locator;
    private readonly statusCheckbox: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.customersMenu = page.locator("#menu-customer a.parent");
        this.customersMenuLink = page.locator('#menu-customer a[href*="route=customer/customer&"]');
        this.customerListHeading = page.getByRole("heading", { name: "Customers", exact: true });
        this.emailFilter = page.getByPlaceholder("E-Mail");
        this.filterButton = page.locator("#button-filter");
        this.customerRows = page.locator("#content table tbody tr");
        this.firstNameInput = page.locator("#input-firstname");
        this.lastNameInput = page.locator("#input-lastname");
        this.emailInput = page.locator("#input-email");
        this.statusCheckbox = page.locator("#input-status");
    }

    /**
     * Opens the customer list from the administration menu.
     */
    async openCustomerList(): Promise<void> {
        await this.customersMenu.click();
        await this.customersMenuLink.click();
    }

    /**
     * Filters the customer list by email address.
     * @param email - Unique email address to search for
     */
    async searchByEmail(email: string): Promise<void> {
        await this.emailFilter.fill(email);
        await this.filterButton.click();
    }

    /**
     * Checks whether a customer row matching the email address is displayed.
     * @param email - Email address to locate
     * @returns true when the matching row is visible
     */
    async isCustomerListed(email: string): Promise<boolean> {
        return this.customerRows.filter({ hasText: email }).isVisible();
    }

    /**
     * Opens the edit form for the customer matching the email address.
     * @param email - Email address of the customer to open
     */
    async openCustomerDetails(email: string): Promise<void> {
        const customerRow = this.customerRows.filter({ hasText: email });
        await customerRow.locator('a[title="Edit"]').click();
    }

    /**
     * Checks whether the customer details form is displayed.
     * @returns true when the first-name field is visible
     */
    async isCustomerDetailsExists(): Promise<boolean> {
        return this.firstNameInput.isVisible();
    }

    /**
     * Reads the first name shown in the customer details form.
     * @returns Customer first name
     */
    async getFirstName(): Promise<string> {
        return this.firstNameInput.inputValue();
    }

    /**
     * Reads the last name shown in the customer details form.
     * @returns Customer last name
     */
    async getLastName(): Promise<string> {
        return this.lastNameInput.inputValue();
    }

    /**
     * Reads the email shown in the customer details form.
     * @returns Customer email
     */
    async getEmail(): Promise<string> {
        return this.emailInput.inputValue();
    }

    /**
     * Checks whether the customer is enabled in the administration form.
     * @returns true when the status checkbox is checked
     */
    async isCustomerEnabled(): Promise<boolean> {
        return this.statusCheckbox.isChecked();
    }
}
