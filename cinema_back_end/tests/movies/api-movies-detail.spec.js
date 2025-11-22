import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

// --- 1. CẤU HÌNH ---
const BASE_URL = 'http://localhost:8080'; 
const ENDPOINT = '/api/movies/details';
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';
const VALID_MOVIE_ID = 1; // ID hợp lệ trong DB

test.describe('Chi Tiết Phim API Tests (GET /api/movies/details)', () => {
    let validToken;

    // --- 2. SETUP ---
    test.beforeAll(async () => {
        try {
            const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
            validToken = JSON.parse(data).accessToken;
        } catch (error) {
            console.warn("⚠️ Không đọc được file token. Một số test cần Auth có thể fail.");
        }
    });

    // --- 3. HELPER FUNCTION ---
    const getMovieDetails = async (request, movieId, token = null) => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const queryParam = movieId !== undefined ? `?movieId=${movieId}` : '';
        return await request.get(`${BASE_URL}${ENDPOINT}${queryParam}`, { headers });
    };

    // --- HAPPY PATH ---
    test('TC_D01: Lấy chi tiết phim hợp lệ', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('id', VALID_MOVIE_ID);
        expect(body).toHaveProperty('name');
    });

    test('TC_D02: Không cần token vẫn xem được', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID);
        expect(response.status()).toBe(200);
    });

    test('TC_D03: Có token hợp lệ vẫn trả về 200', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID, validToken);
        expect(response.status()).toBe(200);
    });

    test('TC_D04: Gửi thêm param thừa không gây lỗi', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?movieId=${VALID_MOVIE_ID}&x=1`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.id).toBe(VALID_MOVIE_ID);
    });

    // --- NEGATIVE CASES ---
    test('TC_D05: Không truyền param movieId', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}`);
        expect([417, 400, 404]).toContain(response.status());
    });

    test('TC_D06: movieId không tồn tại', async ({ request }) => {
        const response = await getMovieDetails(request, 9999);
        expect([404, 417, 400, 500]).toContain(response.status());
    });

    test('TC_D07: movieId là chuỗi ký tự', async ({ request }) => {
        const response = await getMovieDetails(request, 'abc');
        expect([400, 417]).toContain(response.status());
    });

    test('TC_D08: movieId là số âm', async ({ request }) => {
        const response = await getMovieDetails(request, -1);
        expect([400, 404, 417, 500]).toContain(response.status());
    });

    test('TC_D09: movieId = 0', async ({ request }) => {
        const response = await getMovieDetails(request, 0);
        expect([400, 404, 417, 500]).toContain(response.status());
    });

    test('TC_D10: SQL Injection Payload', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?movieId=3 OR 1=1`);
        expect(response.status()).not.toBe(200); 
    });

    test('TC_D11: movieId là số thực', async ({ request }) => {
        const response = await getMovieDetails(request, 3.5);
        expect([400, 417]).toContain(response.status());
    });

    test('TC_D12: movieId ký tự đặc biệt', async ({ request }) => {
        const response = await getMovieDetails(request, '@#');
        expect([400, 417]).toContain(response.status());
    });

    // --- EDGE CASES ---
    test('TC_D13: Token sai định dạng', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID, 'token_tao_lao');
        expect([200, 401]).toContain(response.status());
    });

    test('TC_D14: Gọi sai endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movie/detail-sai-chinh-ta?movieId=${VALID_MOVIE_ID}`);
        expect(response.status()).toBe(401);
    });

    test('TC_D15: Gọi sai method (POST)', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${ENDPOINT}?movieId=${VALID_MOVIE_ID}`);
        expect([405, 404, 400]).toContain(response.status());
    });

    // --- PERFORMANCE / CACHING ---
    test('TC_D16: Kiểm tra caching / Response Time', async ({ request }) => {
        const start1 = Date.now();
        const res1 = await getMovieDetails(request, VALID_MOVIE_ID);
        const time1 = Date.now() - start1;
        expect(res1.status()).toBe(200);

        const start2 = Date.now();
        const res2 = await getMovieDetails(request, VALID_MOVIE_ID);
        const time2 = Date.now() - start2;
        expect(res2.status()).toBe(200);

        console.log(`Time1: ${time1}ms | Time2: ${time2}ms`);
    });

});
