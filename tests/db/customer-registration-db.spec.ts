import { test, expect } from "../../fixtures/pageFixtures";
import { RandomDataUtil } from "../../utils/dataGenerator";
import { executeQuery } from "../../utils/dbClient";
import dotenv from "dotenv";

dotenv.config();

type CustomerRecord = {
    customer_id: number;
    firstname: string;
    lastname: string;
    email: string;
    status: number;
    date_added: Date | string | null;
};

test("Verify registered customer in Admin and MySQL @master @regression @db @end-to-end", async ({
    homePage,
    registerPage,
    adminLoginPage,
    adminCustomersPage,
}) => {
    const firstName = RandomDataUtil.getFirstName();
    const lastName = RandomDataUtil.getLastName();
    const generatedEmail = RandomDataUtil.getEmail().toLowerCase();
    const separator = generatedEmail.lastIndexOf("@");
    const email = `${generatedEmail.slice(0, separator)}.${Date.now()}${generatedEmail.slice(separator)}`;
    const password = RandomDataUtil.getPassword();
    const expectedStatus = 1;

    try {
        await test.step("1) Register a unique customer through the storefront", async () => {
            await homePage.openRegisterPage();
            expect(await registerPage.isRegisterPageExists(), "Registration page should be displayed").toBeTruthy();

            await registerPage.completeRegistration(firstName, lastName, email, password);
            await expect.poll(() => registerPage.isAccountCreated()).toBeTruthy();
        });

        await test.step("2) Find and verify the customer in the Admin Portal", async () => {
            const username = process.env.ADMIN_USERNAME ?? "";
            const adminPassword = process.env.ADMIN_PASSWORD ?? "";
            expect(username, "ADMIN_USERNAME must be configured").toBeTruthy();
            expect(adminPassword, "ADMIN_PASSWORD must be configured").toBeTruthy();

            await adminLoginPage.openAdminPortal();
            await adminLoginPage.login(username, adminPassword);
            await expect.poll(() => adminLoginPage.isDashboardExists()).toBeTruthy();

            await adminCustomersPage.openCustomerList();
            await adminCustomersPage.searchByEmail(email);
            await expect.poll(() => adminCustomersPage.isCustomerListed(email)).toBeTruthy();

            await adminCustomersPage.openCustomerDetails(email);
            expect(
                await adminCustomersPage.isCustomerDetailsExists(),
                "Customer details form should be displayed",
            ).toBeTruthy();
            expect(await adminCustomersPage.getFirstName(), "Admin first name should match registration").toBe(firstName);
            expect(await adminCustomersPage.getLastName(), "Admin last name should match registration").toBe(lastName);
            expect(await adminCustomersPage.getEmail(), "Admin email should match registration").toBe(email);
            expect(await adminCustomersPage.isCustomerEnabled(), "New customer should be enabled in Admin").toBeTruthy();
        });

        await test.step("3) Find and verify the customer in MySQL", async () => {
            const [rows] = await executeQuery(
                "SELECT customer_id, firstname, lastname, email, status, date_added FROM oc_customer WHERE email = ?",
                [email],
            );
            expect(Array.isArray(rows), "Customer query should return an array of rows").toBeTruthy();

            const customers = rows as CustomerRecord[];
            expect(customers, "Exactly one customer record should match the registered email").toHaveLength(1);

            const customer = customers[0];
            expect(customer.firstname, "Database first name should match registration").toBe(firstName);
            expect(customer.lastname, "Database last name should match registration").toBe(lastName);
            expect(customer.email, "Database email should match registration").toBe(email);
            expect(customer.status, "Database customer status should be enabled").toBe(expectedStatus);
            expect(customer.date_added, "Database date_added should be present").toBeTruthy();
        });
    } finally {
        await executeQuery("DELETE FROM oc_customer WHERE email = ?", [email]);
    }

    console.log("✅ Registered customer matched across the storefront, Admin Portal, and MySQL.");
});
