import { expect, test } from "../../fixtures/pageFixtures";
import { Helper } from "../../utils/helper";
import { RandomDataUtil } from "../../utils/dataGenerator";

test("Customer registration flow @master @sanity @regression @web", async ({ homePage, registerPage, myAccountPage }) => {
    const firstName = RandomDataUtil.getFirstName();
    const lastName = RandomDataUtil.getLastName();
    const email = RandomDataUtil.getEmail();
    const password = RandomDataUtil.getPassword();

    await test.step("1) Open the registration page", async () => {
        await homePage.openRegisterPage();
        expect(await registerPage.isRegisterPageExists()).toBeTruthy();
    });

    await test.step("2) Register a new customer", async () => {
        await registerPage.completeRegistration(firstName, lastName, email, password);
        await expect.poll(() => registerPage.isAccountCreated()).toBeTruthy();
    });

    await test.step("3) Verify the account is available in account navigation", async () => {
        await registerPage.clickContinue();
        await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
        expect(await myAccountPage.isAuthenticatedAccountNavigationAvailable()).toBeTruthy();
    });

    console.log("✅ Customer registration flow completed successfully.");
});

test("Valid customer login flow @master @sanity @regression @web", async ({ homePage, loginPage, myAccountPage }) => {
    const email = process.env.APP_EMAIL ?? "";
    const password = process.env.APP_PASSWORD ?? "";
    expect(email, "APP_EMAIL must be configured for the valid login scenario.").toBeTruthy();
    expect(password, "APP_PASSWORD must be configured for the valid login scenario.").toBeTruthy();

    await test.step("1) Open the login page", async () => {
        await homePage.openLoginPage();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step("2) Log in with configured customer credentials", async () => {
        await loginPage.login(email, password);
        await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
        expect(await myAccountPage.isAuthenticatedAccountNavigationAvailable()).toBeTruthy();
    });

    console.log("✅ Valid customer login flow completed successfully.");
});

test("Invalid customer login flow @master @sanity @regression @web", async ({ homePage, loginPage, myAccountPage }) => {
    await test.step("1) Open the login page", async () => {
        await homePage.openLoginPage();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step("2) Submit invalid credentials", async () => {
        await loginPage.login(RandomDataUtil.getEmail(), RandomDataUtil.getPassword());
        await expect.poll(() => loginPage.isLoginWarningVisible()).toBeTruthy();
        expect(await loginPage.getLoginWarningText()).toMatch(
            /Warning: (No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\.)/,
        );
        expect(await myAccountPage.isMyAccountPageExists()).toBeFalsy();
    });

    console.log("✅ Invalid customer login was rejected.");
});

test("Customer logout flow @master @sanity @regression @web", async ({ homePage, loginPage, myAccountPage, logoutPage }) => {
    const email = process.env.APP_EMAIL ?? "";
    const password = process.env.APP_PASSWORD ?? "";
    expect(email, "APP_EMAIL must be configured for the logout scenario.").toBeTruthy();
    expect(password, "APP_PASSWORD must be configured for the logout scenario.").toBeTruthy();

    await test.step("1) Log in with configured customer credentials", async () => {
        await homePage.openLoginPage();
        await loginPage.login(email, password);
        await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step("2) Log out and verify the confirmation page", async () => {
        await myAccountPage.clickLogout();
        await expect.poll(() => logoutPage.isLogoutPageExists()).toBeTruthy();
    });

    await test.step("3) Continue to the homepage and verify logged-out navigation", async () => {
        await logoutPage.clickContinue();
        expect(await homePage.isHomePageExists()).toBeTruthy();
        expect(await homePage.isLoggedOut()).toBeTruthy();
    });

    console.log("✅ Customer logout flow completed successfully.");
});

test("Product search flow @master @sanity @regression @web", async ({ homePage, searchResultsPage }) => {
    const { productName } = Helper.getProductDetails();

    await test.step("1) Search for the known product", async () => {
        await homePage.searchProduct(productName);
        expect(await searchResultsPage.isSearchResultsPageExists()).toBeTruthy();
    });

    await test.step("2) Verify the matching product is displayed", async () => {
        expect(await searchResultsPage.isProductDisplayed(productName)).toBeTruthy();
    });

    console.log("✅ Product search flow completed successfully.");
});

test("Add product to cart @master @sanity @regression @web", async ({ homePage, searchResultsPage, productPage, cartPage }) => {
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

    await test.step("1) Search for and open the product", async () => {
        await homePage.searchProduct(productName);
        expect(await searchResultsPage.isProductDisplayed(productName)).toBeTruthy();
        await searchResultsPage.openProduct(productName);
        expect(await productPage.isProductDetailsPageExists(productName)).toBeTruthy();
    });

    await test.step("2) Add the product to the cart", async () => {
        await productPage.addToCart(productQuantity);
    });

    await test.step("3) Verify the product and quantity in the cart", async () => {
        await productPage.openShoppingCart();
        expect(await cartPage.isCartPageExists()).toBeTruthy();
        expect(await cartPage.isProductInCart(productName)).toBeTruthy();
        expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
        expect(await cartPage.getProductRowText(productName)).toContain(totalPrice);
    });

    console.log("✅ Product was added to the cart with the expected quantity.");
});

test("End-to-end customer shopping journey @master @regression @web @end-to-end", async ({
    homePage,
    registerPage,
    myAccountPage,
    loginPage,
    logoutPage,
    searchResultsPage,
    productPage,
    cartPage,
}) => {
    const firstName = RandomDataUtil.getFirstName();
    const lastName = RandomDataUtil.getLastName();
    const email = RandomDataUtil.getEmail();
    const password = RandomDataUtil.getPassword();
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

    await test.step("1) Register a new customer", async () => {
        await homePage.openRegisterPage();
        await registerPage.completeRegistration(firstName, lastName, email, password);
        await expect.poll(() => registerPage.isAccountCreated()).toBeTruthy();
        await registerPage.clickContinue();
        await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step("2) Log out and sign in with the new credentials", async () => {
        await myAccountPage.clickLogout();
        await expect.poll(() => logoutPage.isLogoutPageExists()).toBeTruthy();
        await logoutPage.clickContinue();
        await homePage.openLoginPage();
        await loginPage.login(email, password);
        await expect.poll(() => myAccountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step("3) Search for the product and add it to the cart", async () => {
        await homePage.searchProduct(productName);
        expect(await searchResultsPage.isProductDisplayed(productName)).toBeTruthy();
        await searchResultsPage.openProduct(productName);
        expect(await productPage.isProductDetailsPageExists(productName)).toBeTruthy();
        await productPage.addToCart(productQuantity);
    });

    await test.step("4) Verify the product, quantity, price, and cart total", async () => {
        await productPage.openShoppingCart();
        expect(await cartPage.isCartPageExists()).toBeTruthy();
        expect(await cartPage.isProductInCart(productName)).toBeTruthy();
        expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
        expect(await cartPage.getProductRowText(productName)).toContain(totalPrice);
        expect(await cartPage.getCartTotal()).toBe(totalPrice);
    });

    console.log("✅ End-to-end customer shopping journey completed successfully.");
});
