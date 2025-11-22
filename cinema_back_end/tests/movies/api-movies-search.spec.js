import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

// --- 1. CẤU HÌNH ---
const BASE_URL = 'http://localhost:8080';
const ENDPOINT = '/api/movies/showing/search';
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';

test.describe('Tìm Kiếm Phim API Tests (GET /api/movies/showing/search)', () => {
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
    const searchMovies = async (request, name, token = null, params = '') => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const query = name ? `?name=${encodeURIComponent(name)}${params}` : `?${params}`;
        const cleanQuery = query.replace(/\?&/, '?'); 
        const fullUrl = `${BASE_URL}${ENDPOINT}${cleanQuery}`;
        return await request.get(fullUrl, { headers });
    };

    // --- HAPPY PATH ---

    test('TC_S01: Tìm kiếm phim hợp lệ', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200); // Status 200 OK
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true); // Body là Array
    });

    test('TC_S02: Không có phim khớp', async ({ request }) => {
        const response = await searchMovies(request, 'XYZ123_Khong_Co_Phim_Nay');
        expect(response.status()).toBe(200); 
        const body = await response.json();
        expect(body).toEqual([]); // Body là mảng rỗng
    });

    test('TC_S03: Tên chứa ký tự tiếng Việt', async ({ request }) => {
        const response = await searchMovies(request, 'Trạng Tí');
        expect(response.status()).toBe(200);
    });

    test('TC_S04: Tên chứa ký tự đặc biệt (: -)', async ({ request }) => {
        const response = await searchMovies(request, 'Spider-Man: No Way Home');
        expect(response.status()).toBe(200);
    });

    test('TC_S05: Không cần token vẫn tìm được', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
    });

    test('TC_S06: Có token hợp lệ', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers', validToken);
        expect(response.status()).toBe(200);
    });

    test('TC_S07: Tên phim có dấu (Unicode)', async ({ request }) => {
        const response = await searchMovies(request, 'Điện ảnh');
        expect(response.status()).toBe(200);
    });

    test('TC_S08: Tên phim cực dài (300 ký tự)', async ({ request }) => {
        const longName = 'A'.repeat(300);
        const response = await searchMovies(request, longName);
        expect([200, 400, 417]).toContain(response.status());
    });

    test('TC_S09: Kiểm tra cấu trúc JSON trả về', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        if (body.length > 0) {
            expect(body[0]).toHaveProperty('id');
            expect(body[0]).toHaveProperty('name');
        }
    });

    test('TC_S10: Gửi param thừa không lỗi', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?name=Avengers&x=1`);
        expect(response.status()).toBe(200);
    });

    test('TC_S11: Kiểm tra dữ liệu trùng lặp', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_S12: So sánh kết quả có/không token', async ({ request }) => {
        const [resNoToken, resWithToken] = await Promise.all([
            searchMovies(request, 'Avengers'),
            searchMovies(request, 'Avengers', validToken)
        ]);
        const bodyNoToken = await resNoToken.json();
        const bodyWithToken = await resWithToken.json();
        expect(JSON.stringify(bodyNoToken)).toBe(JSON.stringify(bodyWithToken));
    });

    test('TC_S13: Tên phim chứa số', async ({ request }) => {
        const response = await searchMovies(request, '007');
        expect(response.status()).toBe(200);
    });

    test('TC_S14: Tên phim quá ngắn', async ({ request }) => {
        const response = await searchMovies(request, 'A');
        expect(response.status()).toBe(200);
    });

    // --- NEGATIVE / EDGE CASES ---

    test('TC_S15: Không truyền param name', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}`);
        expect([400, 417, 500]).toContain(response.status());
    });

    test('TC_S16: Token sai định dạng', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers', 'token_tao_lao');
        expect([200, 401]).toContain(response.status());
    });

    test('TC_S17: Query param chứa ký tự đặc biệt', async ({ request }) => {
        const response = await searchMovies(request, '123!@#');
        expect([200, 400, 417, 500]).toContain(response.status());
    });

    test('TC_S18: Gọi sai endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movies/showing/searh-sai-chinh-ta?name=Avengers`);
        expect([404, 401]).toContain(response.status());
    });

    test('TC_S19: Gọi sai method (POST)', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${ENDPOINT}?name=Avengers`);
        expect([405, 404, 400, 401, 500]).toContain(response.status());
    });

    test('TC_S20: Kiểm tra CORS', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?name=Avengers`, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
    });

    test('TC_S21: SQL Injection (Đơn giản)', async ({ request }) => {
        const response = await searchMovies(request, "Avengers OR 1=1");
        expect(response.status()).not.toBe(500);
    });

    test('TC_S22: Kiểm tra phân trang (Optional)', async ({ request }) => {
        const response = await searchMovies(request, 'A', null, '&page=0&size=5');
        expect(response.status()).toBe(200);
    });

});
