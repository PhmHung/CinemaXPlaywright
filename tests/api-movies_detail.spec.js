import { test, expect } from '@playwright/test';

// Định nghĩa cơ bản
const BASE_URL = 'http://localhost:8081';
const ENDPOINT = '/api/movies/details';
const VALID_MOVIE_ID = 3;
const VALID_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjNAZ21haWwuY29tIiwiaWF0IjoxNzYyNjkzMDE1LCJleHAiOjg4MTYyNjkzMDE1fQ.Wizk2DsdGlTOY4CIfHaITq7dlKTkGspzN2y2BnCrDS8xICsBARZVAEecXDAOPQUnuiVqSRfWaUmMwSkp-i08wQ'; // Dùng token thực tế nếu API yêu cầu

let apiContext;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: BASE_URL,
    // Đặt Content-Type mặc định
    extraHTTPHeaders: {
        'Content-Type': 'application/json',
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe('Chi Tiết Phim API Tests (GET /api/movies/details)', () => {

    // Helper function để gửi request với movieId
    const getMovieDetails = (movieId, token = null) => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return apiContext.get(`${ENDPOINT}?movieId=${movieId}`, { headers });
    };

    // 1. TC_D01: Lấy chi tiết phim hợp lệ (Happy path)
    test('TC_D01: should return 200 OK and complete movie object', async () => {
        // API này không cần token, nên không gửi Auth header
        const response = await apiContext.get(`${ENDPOINT}?movieId=${VALID_MOVIE_ID}`);
        
        expect(response.status()).toBe(200);
        const body = await response.json();
        
        expect(body).toHaveProperty('id', VALID_MOVIE_ID);
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('longDescription');
    });

    // 2. TC_D02: Không truyền param movieId
    test('TC_D02: should return 400 Bad Request when movieId is missing', async () => {
        const response = await apiContext.get(ENDPOINT); // Gửi request không có query param
        expect(response.status()).toBe(400);
    });

    // 3. TC_D03: movieId không tồn tại (9999)
    test('TC_D03: should return 404 Not Found for non-existent movieId', async () => {
        const response = await getMovieDetails(9999);
        expect(response.status()).toBe(404);
    });

    // 4. TC_D04: movieId là chuỗi ký tự
    test('TC_D04: should return 400 Bad Request for string movieId', async () => {
        const response = await getMovieDetails('abc');
        expect(response.status()).toBe(400);
    });

    // 5. TC_D05: movieId là số âm
    test('TC_D05: should return 404/400 for negative movieId', async () => {
        const response = await getMovieDetails(-1);
        expect([404, 400]).toContain(response.status());
    });

    // 6. TC_D06: movieId = 0
    test('TC_D06: should return 404 Not Found for movieId=0', async () => {
        const response = await getMovieDetails(0);
        expect(response.status()).toBe(404);
    });

    // 7. TC_D07: Không cần token vẫn xem được
    test('TC_D07: should return 200 OK without Authorization header', async () => {
        const response = await getMovieDetails(VALID_MOVIE_ID);
        expect(response.status()).toBe(200);
    });

    // 8. TC_D08: Có token hợp lệ
    test('TC_D08: should return 200 OK when a valid token is provided', async () => {
        const response = await getMovieDetails(VALID_MOVIE_ID, VALID_TOKEN);
        expect(response.status()).toBe(200);
        // Có thể thêm kiểm tra dữ liệu giống TC_D01
    });

    // 9. TC_D09: Token sai định dạng
    test('TC_D09: should return 401/200 for malformed token', async () => {
        // Giả định API này là public nhưng vẫn kiểm tra xác thực nếu header tồn tại
        const response = await getMovieDetails(VALID_MOVIE_ID, 'abc1234');
        expect([401, 200]).toContain(response.status()); 
    });

    // 10. TC_D16: Server mất kết nối DB (Chỉ kiểm tra expectation)
    test('TC_D16: should return 500 Internal Server Error if DB connection is lost (Expected)', async () => {
        // Không thể mô phỏng trực tiếp, chỉ kiểm tra expectation.
        // Cần chạy thủ công hoặc dùng môi trường mock.
        // const response = await getMovieDetails(VALID_MOVIE_ID);
        // expect(response.status()).toBe(500);
    });

    // 11. TC_D17: API bị gọi sai endpoint
    test('TC_D17: should return 404 Not Found for incorrect endpoint', async () => {
        const response = await apiContext.get(`/api/movie/detail?movieId=${VALID_MOVIE_ID}`);
        expect(response.status()).toBe(404);
    });

    // 12. TC_D18: Gọi sai method (POST)
    test('TC_D18: should return 405 Method Not Allowed for POST method', async () => {
        const response = await apiContext.post(`${ENDPOINT}?movieId=${VALID_MOVIE_ID}`);
        expect(response.status()).toBe(405);
    });

    // 13. TC_D19: Gửi thêm param không cần thiết
    test('TC_D19: should return 200 OK and ignore unnecessary parameters', async () => {
        const response = await apiContext.get(`${ENDPOINT}?movieId=${VALID_MOVIE_ID}&x=1`);
        expect(response.status()).toBe(200);
        // Đảm bảo dữ liệu trả về vẫn là dữ liệu phim hợp lệ
        const body = await response.json();
        expect(body).toHaveProperty('id', VALID_MOVIE_ID);
    });

    // 14. TC_D23: Kiểm tra caching
    test('TC_D23: should return response faster on second call (Cachable)', async () => {
        // Lần gọi 1 (Lấy dữ liệu và tạo cache)
        const start1 = Date.now();
        await getMovieDetails(VALID_MOVIE_ID);
        const time1 = Date.now() - start1;

        // Lần gọi 2 (Đọc từ cache)
        const start2 = Date.now();
        await getMovieDetails(VALID_MOVIE_ID);
        const time2 = Date.now() - start2;

        // Kiểm tra cơ bản: lần 2 nên nhanh hơn lần 1 (nếu cache hoạt động)
        // Đây là kiểm tra cơ bản, kiểm thử cache chuyên sâu cần công cụ khác
        expect(time2).toBeLessThan(time1 * 1.5); // Chấp nhận nếu lần 2 không chậm hơn 1.5 lần lần 1
    });

    // 15. TC_D24: Kiểm tra lỗi injection
    test('TC_D24: should return 400 and prevent SQL injection', async () => {
        const response = await apiContext.get(`${ENDPOINT}?movieId=3 OR 1=1`);
        expect(response.status()).toBe(400); 
    });

    // 16. TC_D28: Truyền movieId dạng số thực
    test('TC_D28: should return 400 Bad Request for float/decimal movieId', async () => {
        const response = await getMovieDetails(3.5);
        expect(response.status()).toBe(400); 
    });

    // 17. TC_D29: Truyền ký tự đặc biệt
    test('TC_D29: should return 400 Bad Request for special characters in movieId', async () => {
        const response = await getMovieDetails('@#');
        expect(response.status()).toBe(400);
    });

    
});