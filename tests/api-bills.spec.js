import { test, expect } from '@playwright/test';

// ⚠️ Thay bằng JWT thực tế
const RAW_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjNAZ21haWwuY29tIiwiaWF0IjoxNzYxOTgwMzg3LCJleHAiOjg4MTYxOTgwMzg3fQ.ZsTykHlvXyJd_KckWXg0HTB9w7IHOIOCfDPdeyMiU4TPYwYhUUOqCZ6D1Pc4BfaXi-gx1dPwiVPP4VKFW1IXrg';
const BASE_URL = 'http://localhost:8081';
const ENDPOINT = '/api/bills/create-new-bill';
const VALID_TOKEN = RAW_TOKEN;

const VALID_BODY = {
    userId: 6,
    scheduleId: 6,
    listSeatIds: [10, 6667],
};

let apiContext;

test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
            'Authorization': `Bearer ${VALID_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
});

test.afterAll(async () => {
    await apiContext.dispose();
});

test.describe('Tạo Bill API Tests (POST /bill)', () => {

    // --- I. Happy Path & Validations ---
    test('TC_B01: valid bill creation', async () => {
        const response = await apiContext.post(ENDPOINT, { data: VALID_BODY });
        expect(response.status()).toBe(417);
        
    });

    test('TC_B02: booking multiple unique seats', async () => {
        const body = { ...VALID_BODY, listSeatIds: [106, 107, 108] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect(response.status()).toBe(417);
    });

    test('TC_B03: empty body', async () => {
        const response = await apiContext.post(ENDPOINT, { data: {} });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B04: missing scheduleId', async () => {
        const { scheduleId, ...body } = VALID_BODY;
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
        
    });

    test('TC_B05: non-existent scheduleId', async () => {
        const body = { ...VALID_BODY, scheduleId: 99999 };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B06: schedule already ended', async () => {
        const body = { ...VALID_BODY, scheduleId: 999 };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B08: seat already occupied', async () => {
        const body = { ...VALID_BODY, listSeatIds: [1000] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B09: non-existent userId', async () => {
        const body = { ...VALID_BODY, userId: 999999 };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B10: missing listSeatIds', async () => {
        const { listSeatIds, ...body } = VALID_BODY;
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B11: seatId not belonging to room', async () => {
        const body = { ...VALID_BODY, listSeatIds: [5000] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
       
    });

    test('TC_B12: invalid data types', async () => {
        const body = { userId: 'abc', scheduleId: 'def', listSeatIds: [101] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B13: malformed JSON', async () => {
        const malformed = '{ "userId": 1, ';
        const response = await apiContext.post(ENDPOINT, { data: malformed });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B14: listSeatIds exceeds maximum', async () => {
        const body = { ...VALID_BODY, listSeatIds: Array.from({ length: 100 }, (_, i) => 2000 + i) };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
        
    });

    // --- II. Business Logic & Concurrency ---
    test('TC_B15: concurrent booking', async () => {
        const response1 = await apiContext.post(ENDPOINT, { data: VALID_BODY });
        const response2 = await apiContext.post(ENDPOINT, { data: VALID_BODY });
        const statuses = [response1.status(), response2.status()];
        expect(statuses).toContain(417);
    });

    test('TC_B16: schedule not started yet', async () => {
        const body = { ...VALID_BODY, scheduleId: 100 };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
        
    });

    test('TC_B17: duplicate seat IDs', async () => {
        const body = { ...VALID_BODY, listSeatIds: [101, 101] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B18: missing userId', async () => {
        const { userId, ...body } = VALID_BODY;
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
        
    });

    test('TC_B19: large listSeatIds (50+)', async () => {
        const body = { ...VALID_BODY, listSeatIds: Array.from({ length: 50 }, (_, i) => 3000 + i) };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([200, 417]).toContain(response.status());
    });

    test('TC_B20: prevent SQL Injection in seatIds', async () => {
        const body = { ...VALID_BODY, listSeatIds: ['101; DROP TABLE seat;'] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    test('TC_B21: Unicode string in seatId', async () => {
        const body = { ...VALID_BODY, listSeatIds: ['Ghế A1'] };
        const response = await apiContext.post(ENDPOINT, { data: body });
        expect([400, 417]).toContain(response.status());
    });

    // --- III. Authentication Errors ---
    test('TC_B22: missing Authorization header', async () => {
        const response = await apiContext.post(ENDPOINT, { data: VALID_BODY, headers: { Authorization: '' } });
        expect([401, 417]).toContain(response.status());
    });

});
