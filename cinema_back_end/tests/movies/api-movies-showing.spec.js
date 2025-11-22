import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

// --- 1. CẤU HÌNH ---
const BASE_URL = 'http://localhost:8080';
const ENDPOINT = '/api/movies/showing';
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';

test.describe('Phim Đang Chiếu API Tests (GET /api/movies/showing)', () => {
    let validToken;

    // --- 2. SETUP: Đọc Token từ file ---
    test.beforeAll(async () => {
        try {
            const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
            validToken = JSON.parse(data).accessToken;
        } catch (error) {
            console.warn("⚠️ Không đọc được file token.");
        }
    });

    // --- 3. HELPER FUNCTION ---
    const getMovies = async (request, token = null, params = '', method = 'GET') => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const fullUrl = `${BASE_URL}${ENDPOINT}${params}`;
        return await request.fetch(fullUrl, { method, headers });
    };

    // --- GROUP 1: HAPPY PATH ---
    test('TC_M01: Gọi API không cần token', async ({ request }) => {
        const response = await getMovies(request);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_M02: Gọi API khi có token hợp lệ', async ({ request }) => {
        const response = await getMovies(request, validToken);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_M03: Gửi param không hợp lệ (vẫn trả về danh sách)', async ({ request }) => {
        const response = await getMovies(request, null, '?abc=xyz');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_M04: Kiểm tra CORS headers', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}`, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
        // Kiểm tra lỏng: server trả header CORS
        const headers = response.headers();
        expect(headers['access-control-allow-origin'] || '').not.toBe('');
    });

    // --- GROUP 2: NEGATIVE / EDGE CASE ---
    test('TC_M05: Gửi sai method (POST thay vì GET)', async ({ request }) => {
        const response = await getMovies(request, null, '', 'POST');
        expect([405, 401, 403, 404, 400]).toContain(response.status());
    });

    test('TC_M06: Endpoint sai chính tả', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movies/showwing`);
        expect([404, 401]).toContain(response.status());
    });

    test('TC_M07: Gửi token sai định dạng', async ({ request }) => {
        const response = await getMovies(request, 'abc1234');
        // API public trả 200, private trả 401 -> chấp nhận cả 2
        expect([200, 401]).toContain(response.status());
    });

    test('TC_M08: Kiểm tra phản hồi server (Ping / Load)', async ({ request }) => {
        const start = Date.now();
        const response = await getMovies(request);
        const duration = Date.now() - start;
        expect(response.status()).toBe(200);
        console.log(`Request duration: ${duration}ms`);
    });
});
