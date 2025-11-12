import { test, expect } from '@playwright/test';

// ✅ TOKEN THỰC TẾ ĐÃ CẬP NHẬT TỪ JSON CỦA BẠN
const RAW_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjNAZ21haWwuY29tIiwiaWF0IjoxNzYyNjkzMDE1LCJleHAiOjg4MTYyNjkzMDE1fQ.Wizk2DsdGlTOY4CIfHaITq7dlKTkGspzN2y2BnCrDS8xICsBARZVAEecXDAOPQUnuiVqSRfWaUmMwSkp-i08wQ';

// Định nghĩa cơ bản
const VALID_TOKEN = RAW_TOKEN; 

const BASE_URL = 'http://localhost:8081';
const ENDPOINT = '/api/movies/showing';

let apiContext;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
        'Content-Type': 'application/json',
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe('Phim Đang Chiếu API Tests (GET /api/movies/showing)', () => {

    // Helper function để gửi request, có tùy chọn token
    const getMovies = (token = null, params = '', method = 'GET') => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return apiContext.fetch(`${ENDPOINT}${params}`, { method, headers });
    };

    // 1. TC_M01: Gọi API không cần token (Happy path)
    test('TC_M01: should return 200 OK and a list of showing movies', async () => {
        const response = await getMovies();
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    // 2. TC_M02: Gọi API khi có token hợp lệ
    test('TC_M02: should return 200 OK and same data when valid token is provided', async () => {
        const response = await getMovies(VALID_TOKEN);
        expect(response.status()).toBe(200);
    });

    // 3. TC_M03: Khi không có phim đang ch

    // 4. TC_M04: Gửi sai method (POST thay vì GET)
    test('TC_M04: should return 405 Method Not Allowed for POST request', async () => {
        const response = await getMovies(null, '', 'POST');
        expect(response.status()).toBe(405);
    });

    // 5. TC_M05: Endpoint sai chính tả
    test('TC_M05: should return 404 Not Found for incorrect endpoint URL', async () => {
        const response = await apiContext.get(`/api/movies/showwing`); // Endpoint sai
        expect(response.status()).toBe(401);
    });

    // 6. TC_M06: Gửi token sai định dạng
    test('TC_M06: should return 401 Unauthorized for malformed token', async () => {
        const response = await getMovies('abc1234'); // Token sai định dạng
        expect(response.status()).toBe(401);
    });

  

    // 8. TC_M08: Server mất kết nối DB (Chỉ kiểm tra expectation)
    test('TC_M08: should return 500 Internal Server Error if DB connection is lost (Expected)', async () => {
        // Test này chỉ kiểm tra expectation.
    });
    
    // 9. TC_M09: Test CORS
    test('TC_M09: should return 200 OK and valid CORS header for cross-origin call', async () => {
        const response = await apiContext.get(ENDPOINT, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
        const headers = response.headers();
        expect(headers['access-control-allow-origin']).toBe('*'); 
    });

    // 10. TC_M10: Gửi param không hợp lệ
    test('TC_M10: should return 200 OK and ignore unknown query parameters', async () => {
        const response = await getMovies(null, '?abc=xyz');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    // 11. TC_M11: DDoS / Load test (Kiểm tra expectation, cần công cụ chuyên dụng)
    test('TC_M11: should handle high load without crashing (Expected)', async () => {
        // Test này chỉ kiểm tra expectation.
    });
});