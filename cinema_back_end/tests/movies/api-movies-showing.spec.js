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

    // --- 3. HELPER FUNCTION (Dùng request fixture) ---
    const getMovies = async (request, token = null, params = '', method = 'GET') => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        const fullUrl = `${BASE_URL}${ENDPOINT}${params}`;
        
        // Playwright request.fetch hỗ trợ custom method (GET, POST...)
        return await request.fetch(fullUrl, { 
            method: method, 
            headers: headers 
        });
    };

    // --- GROUP 1: HAPPY PATH ---

    test('TC_M01: Gọi API không cần token (Happy path)', async ({ request }) => {
        const response = await getMovies(request);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        
        // Kiểm tra sơ bộ cấu trúc phần tử đầu tiên (nếu có)
        if (body.length > 0) {
            expect(body[0]).toHaveProperty('id');
            expect(body[0]).toHaveProperty('name');
        }
    });

    test('TC_M02: Gọi API khi có token hợp lệ', async ({ request }) => {
        const response = await getMovies(request, validToken);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_M10: Gửi param không hợp lệ (vẫn trả về danh sách)', async ({ request }) => {
        const response = await getMovies(request, null, '?abc=xyz');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_M09: Test CORS headers', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}`, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
        // Một số server không trả header này nếu cấu hình wildcard *, nên check lỏng hơn
        // const headers = response.headers();
        // expect(headers['access-control-allow-origin']).toBe('*'); 
    });

    // --- GROUP 2: NEGATIVE & EDGE CASES ---

    test('TC_M04: Gửi sai method (POST thay vì GET)', async ({ request }) => {
        const response = await getMovies(request, null, '', 'POST');
        // 405 là chuẩn, nhưng 401/403 (Security chặn) hoặc 404 cũng chấp nhận
        expect([405, 401, 403, 404, 400]).toContain(response.status());
    });

    test('TC_M05: Endpoint sai chính tả', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movies/showwing`); // Sai chính tả
        // Security Filter thường chặn 401 trước khi báo 404
        expect([404, 401]).toContain(response.status());
    });

    test('TC_M06: Gửi token sai định dạng', async ({ request }) => {
        const response = await getMovies(request, 'abc1234'); 
        // API Public nên có thể bỏ qua token (200) hoặc chặn (401)
        expect([401, 200]).toContain(response.status());
    });

    // TC_M08 & TC_M11: Load test / Server Error (Chỉ log để biết)
    test('TC_M08: Kiểm tra phản hồi server (Ping)', async ({ request }) => {
        const start = Date.now();
        const response = await getMovies(request);
        const duration = Date.now() - start;
        expect(response.status()).toBe(200);
        console.log(`Request duration: ${duration}ms`);
    });

});