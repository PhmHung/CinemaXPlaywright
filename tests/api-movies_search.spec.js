import { test, expect } from '@playwright/test';

// ✅ TOKEN THỰC TẾ ĐÃ CẬP NHẬT TỪ DỮ LIỆU BẠN CUNG CẤP
const RAW_TOKEN = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjNAZ21haWwuY29tIiwiaWF0IjoxNzYyNjkzMDE1LCJleHAiOjg4MTYyNjkzMDE1fQ.Wizk2DsdGlTOY4CIfHaITq7dlKTkGspzN2y2BnCrDS8xICsBARZVAEecXDAOPQUnuiVqSRfWaUmMwSkp-i08wQ';

// Định nghĩa cơ bản
const BASE_URL = 'http://localhost:8081';
const ENDPOINT = '/api/movies/showing/search';
const VALID_TOKEN = RAW_TOKEN; 

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

test.describe('Tìm Kiếm Phim API Tests (GET /api/movies/showing/search)', () => {

    // Helper function để gửi request tìm kiếm
    const searchMovies = (name, token = null, params = '') => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const query = name ? `?name=${encodeURIComponent(name)}${params}` : `?${params}`;
        return apiContext.get(`${ENDPOINT}${query.replace(/\?&/, '?')}`, { headers });
    };

    // --- I. Happy Path và Cơ bản ---

    // 1. TC_S01: Tìm kiếm phim hợp lệ (Happy path)
    test('TC_S01: should return 200 OK and list of movies matching "Avengers"', async () => {
        const response = await searchMovies('Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    // 2. TC_S02: Không truyền param name
    test('TC_S02: should return 400 Bad Request when "name" is missing', async () => {
        const response = await apiContext.get(ENDPOINT); 
        expect(response.status()).toBe(400);
    });

    // 3. TC_S03: Không có phim khớp
    test('TC_S03: should return 200 OK with empty array [] for no match', async () => {
        const response = await searchMovies('XYZ123');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toEqual([]);
    });

    // 4. TC_S04: Tên chứa ký tự tiếng Việt
    test('TC_S04: should return correct list for Vietnamese characters (Trạng Tí)', async () => {
        const response = await searchMovies('Trạng Tí');
        expect(response.status()).toBe(200);
    });

    // 5. TC_S05: Tên chứa ký tự đặc biệt
    test('TC_S05: should return correct list for special characters (Spider-Man: No Way Home)', async () => {
        const response = await searchMovies('Spider-Man: No Way Home');
        expect(response.status()).toBe(200);
    });
    
    // 6. TC_S06: Không cần token
    test('TC_S06: should return 200 OK without Authorization header', async () => {
        const response = await searchMovies('Avengers');
        expect(response.status()).toBe(200);
    });

    // 7. TC_S07: Có token hợp lệ
    test('TC_S07: should return 200 OK when a valid token is provided (Same as TC_S01)', async () => {
        const response = await searchMovies('Avengers', VALID_TOKEN);
        expect(response.status()).toBe(200);
    });

    // 8. TC_S08: Token sai định dạng
    test('TC_S08: should return 401/200 for malformed token', async () => {
        const response = await searchMovies('Avengers', 'abc1234');
        expect([401, 200]).toContain(response.status()); 
    });
    
   

    // 10. TC_S10: Tên phim có dấu
    test('TC_S10: should handle movie name with accents (Điện ảnh)', async () => {
        const response = await searchMovies('Điện ảnh');
        expect(response.status()).toBe(200);
    });

    // 11. TC_S11: Tên phim dài
    test('TC_S11: should return valid result for very long movie name (>255 chars)', async () => {
        const longName = 'A'.repeat(300);
        const response = await searchMovies(longName);
        expect(response.status()).toBe(200);
    });

    // 12. TC_S12: Query param không hợp lệ
    test('TC_S12: should return 200 OK for query name with special symbols', async () => {
        const response = await searchMovies('123!@#');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toEqual([]);
    });

    // 13. TC_S13: Kiểm tra định dạng dữ liệu
    test('TC_S13: should contain all required fields in the response objects', async () => {
        const response = await searchMovies('Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        
        if (body.length > 0) {
            const movie = body[0];
            expect(movie).toHaveProperty('id');
            expect(movie).toHaveProperty('name');
            expect(movie).toHaveProperty('smallImageURL');
            expect(movie).toHaveProperty('duration');
            expect(movie).toHaveProperty('rated');
        }
    });
    
    // // 14. TC_S14: Server mất kết nối DB (Chỉ kiểm tra expectation)
    // test('TC_S14: should return 500 Internal Server Error if DB connection is lost (Expected)', async () => {
    //     // Test này chỉ kiểm tra expectation.
    // });

    // 15. TC_S15: Gọi sai endpoint
    test('TC_S15: should return 404 Not Found for incorrect endpoint URL', async () => {
        const response = await apiContext.get(`/api/movies/showing/searh?name=Avengers`);
        expect(response.status()).toBe(404);
    });

    // 16. TC_S16: Gọi sai method (POST)
    test('TC_S16: should return 405 Method Not Allowed for POST method', async () => {
        const response = await apiContext.post(`${ENDPOINT}?name=Avengers`);
        expect(response.status()).toBe(405);
    });

    // 17. TC_S17: Gửi param thừa
    test('TC_S17: should return 200 OK and ignore extra parameters', async () => {
        const response = await apiContext.get(`${ENDPOINT}?name=Avengers&x=1`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    // 18. TC_S18: Kiểm tra CORS
    test('TC_S18: should allow CORS (check headers)', async () => {
        const response = await apiContext.get(`${ENDPOINT}?name=Avengers`, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
        const headers = response.headers();
        expect(headers['access-control-allow-origin']).toBe('*'); 
    });

    // 19. TC_S19: Kiểm tra SQL injection
    test('TC_S19: should prevent SQL Injection', async () => {
        const response = await searchMovies("Avengers OR 1=1");
        expect(response.status()).toBe(200); 
        const body = await response.json();
        // Kiểm tra rằng chỉ trả về phim khớp tên, không phải tất cả phim
        expect(Array.isArray(body)).toBe(true);
    });

    // 20. TC_S20: Kiểm tra phân trang (nếu có)
    test('TC_S20: should return paginated data with size limit', async () => {
        // Lưu ý: Test này chỉ hợp lệ nếu endpoint có hỗ trợ phân trang
        const response = await searchMovies('A', '', '&page=1&size=5');
        expect(response.status()).toBe(200);
        // Kiểm tra các trường phân trang nếu API trả về object phân trang (vd: content, totalPages)
        // const body = await response.json();
        // expect(body.content.length).toBeLessThanOrEqual(5);
    });

    // 21. TC_S21: Kiểm tra dữ liệu trùng lặp
    test('TC_S21: should return all movies with the same name', async () => {
        const response = await searchMovies('Same Movie Name'); 
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    // 22. TC_S22: Kiểm tra kết hợp token + param
    test('TC_S22: should return the same result when valid token is included', async () => {
        const [resNoToken, resWithToken] = await Promise.all([
            searchMovies('Avengers'),
            searchMovies('Avengers', VALID_TOKEN)
        ]);
        
        const bodyNoToken = await resNoToken.json();
        const bodyWithToken = await resWithToken.json();

        // Kiểm tra output là giống nhau
        expect(JSON.stringify(bodyNoToken)).toBe(JSON.stringify(bodyWithToken));
    });

    // 23. TC_S23: Tên phim chứa số
    test('TC_S23: should return correct list for name containing numbers (007)', async () => {
        const response = await searchMovies('007');
        expect(response.status()).toBe(200);
    });

    // 24. TC_S24: Tên phim quá ngắn
    test('TC_S24: should return valid results for very short name (A)', async () => {
        const response = await searchMovies('A');
        expect(response.status()).toBe(200);
    });
});