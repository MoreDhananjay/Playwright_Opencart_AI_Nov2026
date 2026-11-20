import { Locator, Page } from "@playwright/test";

import { MyAccountPage } from "./MyAccountPage";

export class RegisterPage {
    private readonly page: Page;

    // Locators
    private readonly registerHeading: Locator;
    private readonly firstNameInput: Locator;
    private readonly lastNameInput: Locator;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly passwordConfirmInput: Locator;
    private readonly privacyPolicyCheckbox: Locator;
    private readonly continueButton: Locator;
    private readonly accountCreatedHeading: Locator;
    private readonly successContinueLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.registerHeading = page.getByRole("heading", { name: "Register Account", level: 1 });
        this.firstNameInput = page.getByLabel("First Name");
        this.lastNameInput = page.getByLabel("Last Name");
        this.emailInput = page.getByLabel("E-Mail");
        this.passwordInput = page.getByLabel("Password");
        this.passwordConfirmInput = page.getByLabel("Password Confirm");
        this.privacyPolicyCheckbox = page.locator('input[name="agree"]');
        this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
        this.accountCreatedHeading = page.getByRole("heading", { name: "Your Account Has Been Created!", level: 1 });
        this.successContinueLink = page.getByRole("link", { name: "Continue", exact: true });
    }

    /**
     * Checks that the registration form is displayed.
     * @returns true when the registration heading is visible
     */
    async isRegisterPageExists(): Promise<boolean> {
        return this.registerHeading.isVisible();
    }

    /**
     * Completes and submits the fields available on the registration form.
     * @param firstName - Customer first name
     * @param lastName - Customer last name
     * @param email - Unique customer email
     * @param password - Customer password
     */
    async completeRegistration(firstName: string, lastName: string, email: string, password: string): Promise<void> {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.passwordConfirmInput.fill(password);
        await this.privacyPolicyCheckbox.check();
        await this.continueButton.click();
    }

    /**
     * Checks that the account-created confirmation is displayed.
     * @returns true when the confirmation heading is visible
     */
    async isAccountCreated(): Promise<boolean> {
        return this.accountCreatedHeading.isVisible();
    }

    /**
     * Continues from the account-created page to the account dashboard.
     * @returns MyAccountPage - The customer account page
     */
    async clickContinue(): Promise<MyAccountPage> {
        await this.successContinueLink.click();
        return new MyAccountPage(this.page);
    }
}
