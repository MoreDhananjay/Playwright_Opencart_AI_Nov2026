import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import dotenv from 'dotenv';
import path from 'path';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';
import { RandomDataUtil } from '../../utils/dataGenerator';

dotenv.config();

type ProductSummary = {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
};

type UserSummary = {
    id: number;
    username: string;
};

type CartSummary = {
    id: number;
    userId: number;
    date: string;
    products: Array<{ productId: number; quantity: number }>;
};

const productPayload = {
    title: 'Playwright API test product',
    price: 29.99,
    description: 'Deterministic product payload for FakeStore API tests.',
    image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
    category: 'electronics',
};

const updatedProductPayload = {
    ...productPayload,
    title: 'Updated Playwright API test product',
    price: 39.99,
};

const userPayload = {
    email: 'playwright.api.user@example.com',
    username: 'playwright_api_user',
    password: 'playwright-api-test-password',
    name: {
        firstname: 'Playwright',
        lastname: 'Tester',
    },
    address: {
        city: 'Test City',
        street: 'Test Street',
        number: 10,
        zipcode: '10001',
        geolocation: {
            lat: '40.7128',
            long: '-74.0060',
        },
    },
    phone: '1-555-0100',
};

const updatedUserPayload = {
    ...userPayload,
    username: 'updated_playwright_api_user',
    name: {
        firstname: 'Updated',
        lastname: 'Tester',
    },
};

function expectProductFields(product: ProductSummary, description: string): void {
    expect(product, description).toEqual(expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        image: expect.any(String),
    }));
}

test.describe('FakeStore API Tests', () => {
    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = (process.env.API_BASE_URL || Routes.BASE_URL).replace(/\/+$/, '');
    const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
    const USER_ID = Number(process.env.USER_ID ?? 1);
    const CART_ID = Number(process.env.CART_ID ?? 1);
    const LIMIT = Number(process.env.LIMIT ?? 5);
    const START_DATE = process.env.START_DATE || '';
    const END_DATE = process.env.END_DATE || '';
    const CATEGORY = 'electronics';

    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

    test('POST - Successful login @master @sanity @api', async ({ request }) => {
        const usersResponse = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
        expect(usersResponse.status(), 'Login setup should retrieve valid FakeStore accounts').toBe(200);
        const users = await usersResponse.json() as Array<{ username: string; password: string }>;
        const credentials = users.find((user) => user.username && user.password);
        expect(credentials, 'FakeStore should provide an account for the login test').toBeDefined();
        if (!credentials) {
            throw new Error('FakeStore users response did not contain login credentials');
        }

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: { username: credentials.username, password: credentials.password },
        });

        expect(response.status(), 'Successful login should return status 201').toBe(201);

        const responseBody = await response.json();
        expect(responseBody, 'Login response should include a token').toEqual(
            expect.objectContaining({ token: expect.any(String) }),
        );
        expect(responseBody.token, 'Authentication token should not be empty').not.toBe('');
    });

    test('POST - Invalid login @master @regression @api', async ({ request }) => {
        const invalidCredentials = RandomDataUtil.generateInvalidLoginPayload();
        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: invalidCredentials,
        });

        expect(response.status(), 'Invalid login should return status 401').toBe(401);

        const responseBody = await response.text();
        expect(responseBody, 'Invalid login should return the expected error').toBe(
            'username or password is incorrect',
        );
    });

    // ---------------------------------------------------------
    // Products - GET
    // ---------------------------------------------------------

    test('GET - All products @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);

        expect(response.status(), 'Retrieving all products should return status 200').toBe(200);

        const products = await response.json() as ProductSummary[];
        expect(Array.isArray(products), 'Products response should be an array').toBeTruthy();
        expect(products.length, 'At least one product should be returned').toBeGreaterThan(0);
        for (const product of products) {
            expectProductFields(product, 'Each product should include its important fields');
        }
    });

    test('GET - Product by ID @master @sanity @api', async ({ request }) => {
        const response = await request.get(
            `${BASE_URL}${Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID))}`,
        );

        expect(response.status(), 'Retrieving a product should return status 200').toBe(200);

        const product = await response.json() as ProductSummary;
        expect(product.id, 'Returned product ID should match the requested ID').toBe(PRODUCT_ID);
        expectProductFields(product, 'Product response should include its important fields');
    });

    test('GET - Products with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Limited product request should return status 200').toBe(200);

        const products = await response.json() as ProductSummary[];
        expect(Array.isArray(products), 'Limited products response should be an array').toBeTruthy();
        expect(products.length, 'Product count should match the requested limit').toBe(LIMIT);
    });

    test('GET - Products sorted ascending @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', 'asc');
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Ascending product sort should return status 200').toBe(200);

        const products = await response.json() as ProductSummary[];
        const ids = products.map((product) => product.id);
        expect(ids, 'Product IDs should be in ascending order').toEqual(
            [...ids].sort((left, right) => left - right),
        );
    });

    test('GET - Products sorted descending @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', 'desc');
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Descending product sort should return status 200').toBe(200);

        const products = await response.json() as ProductSummary[];
        const ids = products.map((product) => product.id);
        expect(ids, 'Product IDs should be in descending order').toEqual(
            [...ids].sort((left, right) => right - left),
        );
    });

    test('GET - All product categories @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);

        expect(response.status(), 'Retrieving categories should return status 200').toBe(200);

        const categories = await response.json() as string[];
        expect(Array.isArray(categories), 'Categories response should be an array').toBeTruthy();
        expect(categories.length, 'At least one category should be returned').toBeGreaterThan(0);
        for (const category of categories) {
            expect(typeof category, 'Each category should be a string').toBe('string');
        }
    });

    test('GET - Products by category @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', encodeURIComponent(CATEGORY));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Category product request should return status 200').toBe(200);

        const products = await response.json() as Array<ProductSummary & { category: string }>;
        expect(Array.isArray(products), 'Category products response should be an array').toBeTruthy();
        for (const product of products) {
            expect(product.category, 'Each product should belong to the requested category').toBe(CATEGORY);
        }
    });

    // ---------------------------------------------------------
    // Products - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create product @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
            data: productPayload,
        });

        expect(response.status(), 'Creating a product should return status 201').toBe(201);

        const createdProduct = await response.json();
        expect(createdProduct, 'Created product should include an ID and submitted data').toEqual(
            expect.objectContaining({ id: expect.any(Number), ...productPayload }),
        );

        const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(createdProduct.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Created product cleanup should return status 200').toBe(200);
    });

    test('PUT - Update product @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: updatedProductPayload });

        expect(response.status(), 'Updating a product should return status 200').toBe(200);

        const updatedProduct = await response.json();
        expect(updatedProduct, 'Updated product should contain the requested ID and values').toEqual(
            expect.objectContaining({ id: PRODUCT_ID, ...updatedProductPayload }),
        );
    });

    test('DELETE - Product @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.delete(`${BASE_URL}${route}`);

        expect(response.status(), 'Deleting a product should return status 200').toBe(200);

        const deletedProduct = await response.json();
        expect(deletedProduct, 'Delete response should identify the deleted product').toEqual(
            expect.objectContaining({ id: PRODUCT_ID }),
        );
    });

    // ---------------------------------------------------------
    // Users - GET
    // ---------------------------------------------------------

    test('GET - All users @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);

        expect(response.status(), 'Retrieving all users should return status 200').toBe(200);

        const users = await response.json() as UserSummary[];
        expect(Array.isArray(users), 'Users response should be an array').toBeTruthy();
        expect(users.length, 'At least one user should be returned').toBeGreaterThan(0);
        for (const user of users) {
            expect(user, 'Each user should have an ID and username').toEqual(
                expect.objectContaining({ id: expect.any(Number), username: expect.any(String) }),
            );
        }
    });

    test('GET - User by ID @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Retrieving a user should return status 200').toBe(200);

        const user = await response.json() as UserSummary;
        expect(user.id, 'Returned user ID should match the requested ID').toBe(USER_ID);
        expect(user.username, 'User response should include a username').toEqual(expect.any(String));
    });

    test('GET - Users with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Limited user request should return status 200').toBe(200);

        const users = await response.json() as UserSummary[];
        expect(Array.isArray(users), 'Limited users response should be an array').toBeTruthy();
        expect(users.length, 'User count should match the requested limit').toBe(LIMIT);
    });

    test('GET - Users sorted ascending and descending @master @regression @api', async ({ request }) => {
        for (const order of ['asc', 'desc'] as const) {
            const route = Routes.GET_USERS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);

            expect(response.status(), `${order} user sort should return status 200`).toBe(200);

            const users = await response.json() as UserSummary[];
            const ids = users.map((user) => user.id);
            const expectedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left,
            );
            expect(ids, `User IDs should be sorted ${order}`).toEqual(expectedIds);
        }
    });

    // ---------------------------------------------------------
    // Users - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create user @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: userPayload });

        expect(response.status(), 'Creating a user should return status 201').toBe(201);

        const createdUser = await response.json();
        expect(createdUser, 'Created user response should include a generated ID').toEqual(
            expect.objectContaining({ id: expect.any(Number) }),
        );

        const deleteRoute = Routes.DELETE_USER.replace('{id}', String(createdUser.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Created user cleanup should return status 200').toBe(200);
    });

    test('PUT - Update user @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_USER.replace('{id}', String(USER_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: updatedUserPayload });

        expect(response.status(), 'Updating a user should return status 200').toBe(200);

        const updatedUser = await response.json();
        expect(updatedUser, 'Updated user should contain the requested values').toEqual(
            expect.objectContaining(updatedUserPayload),
        );
    });

    test('DELETE - User @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_USER.replace('{id}', String(USER_ID));
        const response = await request.delete(`${BASE_URL}${route}`);

        expect(response.status(), 'Deleting a user should return status 200').toBe(200);

        const deletedUser = await response.json();
        expect(deletedUser, 'Delete response should identify the deleted user').toEqual(
            expect.objectContaining({ id: USER_ID }),
        );
    });

    // ---------------------------------------------------------
    // Carts - GET
    // ---------------------------------------------------------

    test('GET - All carts @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);

        expect(response.status(), 'Retrieving all carts should return status 200').toBe(200);

        const carts = await response.json() as CartSummary[];
        expect(Array.isArray(carts), 'Carts response should be an array').toBeTruthy();
        expect(carts.length, 'At least one cart should be returned').toBeGreaterThan(0);
        for (const cart of carts) {
            expect(cart, 'Each cart should include its identifying fields').toEqual(
                expect.objectContaining({
                    id: expect.any(Number),
                    userId: expect.any(Number),
                    date: expect.any(String),
                    products: expect.any(Array),
                }),
            );
        }
    });

    test('GET - Cart by ID @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Retrieving a cart should return status 200').toBe(200);

        const cart = await response.json() as CartSummary;
        expect(cart.id, 'Returned cart ID should match the requested ID').toBe(CART_ID);
    });

    test('GET - Carts by date range @master @regression @api', async ({ request }) => {
        expect(START_DATE, 'Set START_DATE in .env for cart date filtering').toBeTruthy();
        expect(END_DATE, 'Set END_DATE in .env for cart date filtering').toBeTruthy();

        const route = Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startdate}', encodeURIComponent(START_DATE))
            .replace('{enddate}', encodeURIComponent(END_DATE));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Date-filtered carts request should return status 200').toBe(200);

        const carts = await response.json() as CartSummary[];
        expect(Array.isArray(carts), 'Date-filtered carts response should be an array').toBeTruthy();

        const rangeStart = new Date(START_DATE);
        const rangeEnd = new Date(END_DATE);
        rangeStart.setUTCHours(0, 0, 0, 0);
        rangeEnd.setUTCHours(23, 59, 59, 999);
        expect(Number.isNaN(rangeStart.getTime()), 'START_DATE should be a valid date').toBe(false);
        expect(Number.isNaN(rangeEnd.getTime()), 'END_DATE should be a valid date').toBe(false);
        expect(rangeStart.getTime(), 'START_DATE should not be after END_DATE').toBeLessThanOrEqual(
            rangeEnd.getTime(),
        );

        for (const cart of carts) {
            const cartDate = new Date(cart.date).getTime();
            expect(Number.isNaN(cartDate), 'Each returned cart should have a valid date').toBe(false);
            expect(cartDate, 'Cart date should be on or after START_DATE').toBeGreaterThanOrEqual(
                rangeStart.getTime(),
            );
            expect(cartDate, 'Cart date should be on or before END_DATE').toBeLessThanOrEqual(
                rangeEnd.getTime(),
            );
        }
    });

    test('GET - Carts by user @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USER_CART.replace('{userId}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'User carts request should return status 200').toBe(200);

        const carts = await response.json() as CartSummary[];
        expect(Array.isArray(carts), 'User carts response should be an array').toBeTruthy();
        for (const cart of carts) {
            expect(cart.userId, 'Each returned cart should belong to the requested user').toBe(USER_ID);
        }
    });

    test('GET - Carts with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Limited carts request should return status 200').toBe(200);

        const carts = await response.json() as CartSummary[];
        expect(Array.isArray(carts), 'Limited carts response should be an array').toBeTruthy();
        expect(carts.length, 'Cart count should match the requested limit').toBe(LIMIT);
    });

    test('GET - Carts sorted ascending and descending @master @regression @api', async ({ request }) => {
        for (const order of ['asc', 'desc'] as const) {
            const route = Routes.GET_CARTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);

            expect(response.status(), `${order} cart sort should return status 200`).toBe(200);

            const carts = await response.json() as CartSummary[];
            const ids = carts.map((cart) => cart.id);
            const expectedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left,
            );
            expect(ids, `Cart IDs should be sorted ${order}`).toEqual(expectedIds);
        }
    });

    // ---------------------------------------------------------
    // Carts - POST / PUT / DELETE
    // ---------------------------------------------------------

    const cartPayload = {
        userId: USER_ID,
        date: '2020-01-01',
        products: [{ productId: PRODUCT_ID, quantity: 1 }],
    };

    const updatedCartPayload = {
        ...cartPayload,
        products: [{ productId: PRODUCT_ID, quantity: 3 }],
    };

    test('POST - Create cart @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: cartPayload });

        expect(response.status(), 'Creating a cart should return status 201').toBe(201);

        const createdCart = await response.json();
        expect(createdCart, 'Created cart should include its ID, user, and products').toEqual(
            expect.objectContaining({
                id: expect.any(Number),
                userId: cartPayload.userId,
                products: cartPayload.products,
            }),
        );

        const deleteRoute = Routes.DELETE_CART.replace('{id}', String(createdCart.id));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'Created cart cleanup should return status 200').toBe(200);
    });

    test('PUT - Update cart @master @regression @api', async ({ request }) => {
        const route = Routes.UPDATE_CART.replace('{id}', String(CART_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: updatedCartPayload });

        expect(response.status(), 'Updating a cart should return status 200').toBe(200);

        const updatedCart = await response.json();
        expect(updatedCart, 'Updated cart should reflect the changed product quantity').toEqual(
            expect.objectContaining({
                id: CART_ID,
                userId: updatedCartPayload.userId,
                products: updatedCartPayload.products,
            }),
        );
    });

    test('DELETE - Cart @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_CART.replace('{id}', String(CART_ID));
        const response = await request.delete(`${BASE_URL}${route}`);

        expect(response.status(), 'Deleting a cart should return status 200').toBe(200);

        const deletedCart = await response.json();
        expect(deletedCart, 'Delete response should identify the deleted cart').toEqual(
            expect.objectContaining({ id: CART_ID }),
        );
    });

    // ---------------------------------------------------------
    // JSON Schema Validation
    // ---------------------------------------------------------

    test('GET - Product response schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Product schema request should return status 200').toBe(200);

        const product = await response.json();
        const schema = DataProvider.readJson(path.resolve(process.cwd(), 'api/schemas/product_api_schema.json'));
        const validate = new Ajv({ allErrors: true }).compile(schema);
        const isValid = validate(product);

        expect(isValid, `Product schema validation errors: ${JSON.stringify(validate.errors)}`).toBeTruthy();
    });

    test('GET - User response schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'User schema request should return status 200').toBe(200);

        const user = await response.json();
        const schema = DataProvider.readJson(path.resolve(process.cwd(), 'api/schemas/user_api_schema.json'));
        const validate = new Ajv({ allErrors: true }).compile(schema);
        const isValid = validate(user);

        expect(isValid, `User schema validation errors: ${JSON.stringify(validate.errors)}`).toBeTruthy();
    });

    test('GET - Cart response schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
        const response = await request.get(`${BASE_URL}${route}`);

        expect(response.status(), 'Cart schema request should return status 200').toBe(200);

        const cart = await response.json();
        const schema = DataProvider.readJson(path.resolve(process.cwd(), 'api/schemas/cart_api_schema.json'));
        const validate = new Ajv({ allErrors: true }).compile(schema);
        const isValid = validate(cart);

        expect(isValid, `Cart schema validation errors: ${JSON.stringify(validate.errors)}`).toBeTruthy();
    });

    // ---------------------------------------------------------
    // End-to-End CRUD Workflows
    // ---------------------------------------------------------

    test.describe.serial('CRUD workflows', () => {
        test('Product create, update, and delete workflow @master @end-to-end @api', async ({ request }) => {
            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
                data: productPayload,
            });
            expect(createResponse.status(), 'Workflow product creation should return status 201').toBe(201);

            const createdProduct = await createResponse.json();
            const createdProductId = createdProduct.id as number;
            expect(createdProductId, 'Workflow should capture the created product ID').toEqual(expect.any(Number));

            const updateRoute = Routes.UPDATE_PRODUCT.replace('{id}', String(createdProductId));
            const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedProductPayload,
            });
            expect(updateResponse.status(), 'Workflow product update should return status 200').toBe(200);

            const updatedProduct = await updateResponse.json();
            expect(updatedProduct, 'Workflow update should return the changed product').toEqual(
                expect.objectContaining({ id: createdProductId, ...updatedProductPayload }),
            );

            const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(createdProductId));
            const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deleteResponse.status(), 'Workflow product deletion should return status 200').toBe(200);
        });

        test('User create, update, and delete workflow @master @end-to-end @api', async ({ request }) => {
            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
                data: userPayload,
            });
            expect(createResponse.status(), 'Workflow user creation should return status 201').toBe(201);

            const createdUser = await createResponse.json();
            const createdUserId = createdUser.id as number;
            expect(createdUserId, 'Workflow should capture the created user ID').toEqual(expect.any(Number));

            const updateRoute = Routes.UPDATE_USER.replace('{id}', String(createdUserId));
            const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedUserPayload,
            });
            expect(updateResponse.status(), 'Workflow user update should return status 200').toBe(200);

            const updatedUser = await updateResponse.json();
            expect(updatedUser, 'Workflow update should return the changed user').toEqual(
                expect.objectContaining(updatedUserPayload),
            );

            const deleteRoute = Routes.DELETE_USER.replace('{id}', String(createdUserId));
            const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deleteResponse.status(), 'Workflow user deletion should return status 200').toBe(200);
        });

        test('Cart create, update, and delete workflow @master @end-to-end @api', async ({ request }) => {
            const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
                data: cartPayload,
            });
            expect(createResponse.status(), 'Workflow cart creation should return status 201').toBe(201);

            const createdCart = await createResponse.json();
            const createdCartId = createdCart.id as number;
            expect(createdCartId, 'Workflow should capture the created cart ID').toEqual(expect.any(Number));
            expect(createdCart.userId, 'Created cart should contain the submitted user ID').toBe(USER_ID);
            expect(createdCart.products, 'Created cart should contain the submitted products').toEqual(
                cartPayload.products,
            );

            const updateRoute = Routes.UPDATE_CART.replace('{id}', String(createdCartId));
            const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, {
                data: updatedCartPayload,
            });
            expect(updateResponse.status(), 'Workflow cart update should return status 200').toBe(200);

            const updatedCart = await updateResponse.json();
            expect(updatedCart.products, 'Workflow update should reflect the changed quantity').toEqual(
                updatedCartPayload.products,
            );

            const deleteRoute = Routes.DELETE_CART.replace('{id}', String(createdCartId));
            const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
            expect(deleteResponse.status(), 'Workflow cart deletion should return status 200').toBe(200);
        });
    });
});
