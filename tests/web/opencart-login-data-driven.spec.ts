import path from "path";

import { expect, test } from "../../fixtures/pageFixtures";
import { DataProvider } from "../../utils/DataReader";

type LoginTestData = {
    testName: string;
    email: string;
    password: string;
    expected: "success" | "failure";
};

const loginData = DataProvider.readJson(
    path.resolve(process.cwd(), "testdata", "opencart_logindata.json"),
) as LoginTestData[];

const resolveEnvironmentReferences = (value: string): string =>
    value.replace(/\$\{([^}]+)\}/g, (_placeholder, variableName: string) => process.env[variableName] ?? "");

for (const [index, data] of loginData.entries()) {
    test(`${data.testName} - data row ${index + 1} @master @sanity @regression @web @datadriven`, async ({
        homePage,
        loginPage,
        myAccountPage,
    }) => {
        await test.step("1) Open the login page and submit the row values", async () => {
            await homePage.openLoginPage();
            expect(await loginPage.isLoginPageExists()).toBeTruthy();
            await loginPage.login(resolveEnvironmentReferences(data.email), resolveEnvironmentReferences(data.password));
        });

        await test.step("2) Validate the result for this data row", async () => {
            if (data.expected === "success") {
                await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
            } else {
                expect(await myAccountPage.isMyAccountPageExists()).toBeFalsy();
                await expect.poll(() => loginPage.isLoginWarningVisible()).toBeTruthy();
                expect(await loginPage.getLoginWarningText()).toMatch(
                    /Warning: (No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\.)/,
                );
            }
        });

        console.log(`✅ Data-driven login scenario completed: ${data.testName}`);
    });
}
