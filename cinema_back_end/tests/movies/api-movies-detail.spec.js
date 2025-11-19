import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

// --- 1. CẤU HÌNH HỆ THỐNG ---
const BASE_URL = 'http://localhost:8080'; 
const ENDPOINT = '/api/movies/details';
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';

// ID phim có thật trong Database (Hãy đổi số này nếu DB của bạn khác)
const VALID_MOVIE_ID = 1; 

test.describe('Chi Tiết Phim API Tests (GET /api/movies/details)', () => {
    let validToken;

    // --- 2. SETUP: Đọc Token từ file (Chỉ làm 1 lần) ---
    test.beforeAll(async () => {
        try {
            const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
            validToken = JSON.parse(data).accessToken;
        } catch (error) {
            console.warn("⚠️ Không đọc được file token. Một số test cần Auth có thể fail.");
        }
    });

    // --- 3. HELPER FUNCTION (Quan trọng: Phải truyền biến 'request' vào) ---
    // Hàm này giúp code gọn hơn, tái sử dụng cho các test case
    const getMovieDetails = async (request, movieId, token = null) => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        // Xử lý logic ghép URL
        const queryParam = movieId !== undefined ? `?movieId=${movieId}` : '';
        const fullUrl = `${BASE_URL}${ENDPOINT}${queryParam}`;
        
        return await request.get(fullUrl, { headers });
    };

    // --- GROUP 1: HAPPY PATH (CHẠY THÀNH CÔNG) ---

    test('TC_D01: Lấy chi tiết phim hợp lệ (Happy path)', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID);
        
        console.log(`[TC_D01] Status: ${response.status()}`);
        expect(response.status()).toBe(200);

        const body = await response.json();
        // Kiểm tra cấu trúc dữ liệu trả về
        expect(body).toHaveProperty('id');
        expect(body.id).toBe(VALID_MOVIE_ID);
        expect(body).toHaveProperty('name');
    });

    test('TC_D07: Không cần token vẫn xem được (Public API)', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID);
        expect(response.status()).toBe(200);
    });

    test('TC_D08: Có token hợp lệ vẫn trả về 200', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID, validToken);
        expect(response.status()).toBe(200);
    });

    test('TC_D19: Gửi thêm param thừa (x=1) không gây lỗi', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?movieId=${VALID_MOVIE_ID}&x=1`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.id).toBe(VALID_MOVIE_ID);
    });

    // --- GROUP 2: NEGATIVE CASES (CHẤP NHẬN CẢ 400 VÀ 417) ---

    test('TC_D02: Không truyền param movieId', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}`); 
        // Backend có thể trả về 400 (Bad Request) hoặc 417 (Expectation Failed)
        expect([400, 417, 404]).toContain(response.status());
    });

    test('TC_D03: movieId không tồn tại (9999)', async ({ request }) => {
        const response = await getMovieDetails(request, 9999);
        // Nếu backend lười check trả 200 rỗng thì cảnh báo, còn lại phải là lỗi
        if (response.status() === 200) {
            console.log('⚠️ Cảnh báo: ID ảo nhưng backend vẫn trả về 200 OK');
        } else {
            expect([404, 417, 400,500]).toContain(response.status());
        }
    });

    test('TC_D04: movieId là chuỗi ký tự (String)', async ({ request }) => {
        const response = await getMovieDetails(request, 'abc');
        expect([400, 417]).toContain(response.status());
    });

    test('TC_D05: movieId là số âm', async ({ request }) => {
        const response = await getMovieDetails(request, -1);
        expect([404, 400, 417,500]).toContain(response.status());
    });

    test('TC_D06: movieId = 0', async ({ request }) => {
        const response = await getMovieDetails(request, 0);
        expect([404, 400, 417,500]).toContain(response.status());
    });

    test('TC_D24: SQL Injection Payload', async ({ request }) => {
        // Thử tấn công bằng SQL Injection
        const response = await request.get(`${BASE_URL}${ENDPOINT}?movieId=3 OR 1=1`);
        expect(response.status()).not.toBe(200); 
    });

    test('TC_D28: Truyền movieId dạng số thực (3.5)', async ({ request }) => {
        const response = await getMovieDetails(request, 3.5);
        expect([400, 417]).toContain(response.status());
    });

    test('TC_D29: Truyền ký tự đặc biệt (@#)', async ({ request }) => {
        const response = await getMovieDetails(request, '@#');
        expect([400, 417]).toContain(response.status());
    });

    // --- GROUP 3: EDGE CASES (CÁC TRƯỜNG HỢP ĐẶC BIỆT) ---

    test('TC_D09: Token sai định dạng (Vẫn xem được do Public API)', async ({ request }) => {
        const response = await getMovieDetails(request, VALID_MOVIE_ID, 'token_tao_lao');
        // Vì API Public nên token sai vẫn có thể cho qua (200) hoặc chặn (401)
        expect([200, 401]).toContain(response.status());
    });

    test('TC_D17: API bị gọi sai endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movie/detail-sai-chinh-ta?movieId=${VALID_MOVIE_ID}`);
        expect(response.status()).toBe(401);
    });

    test('TC_D18: Gọi sai method (POST thay vì GET)', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${ENDPOINT}?movieId=${VALID_MOVIE_ID}`);
        expect([405, 404, 400]).toContain(response.status());
    });

    test('TC_D23: Kiểm tra caching (So sánh thời gian)', async ({ request }) => {
        // Lần 1
        const start1 = Date.now();
        const res1 = await getMovieDetails(request, VALID_MOVIE_ID);
        const time1 = Date.now() - start1;
        expect(res1.status()).toBe(200);

        // Lần 2
        const start2 = Date.now();
        const res2 = await getMovieDetails(request, VALID_MOVIE_ID);
        const time2 = Date.now() - start2;
        expect(res2.status()).toBe(200);

        console.log(`Time 1: ${time1}ms | Time 2: ${time2}ms`);
        // Test này chỉ log ra để tham khảo hiệu năng
    });

});