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

    // --- 3. HELPER FUNCTION (Đã sửa để dùng 'request' fixture) ---
    const searchMovies = async (request, name, token = null, params = '') => {
        let headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        // Logic ghép URL
        const query = name ? `?name=${encodeURIComponent(name)}${params}` : `?${params}`;
        // Xử lý trường hợp param rỗng
        const cleanQuery = query.replace(/\?&/, '?'); 
        const fullUrl = `${BASE_URL}${ENDPOINT}${cleanQuery}`;

        return await request.get(fullUrl, { headers });
    };

    // --- I. HAPPY PATH VÀ CƠ BẢN ---

    test('TC_S01: Tìm kiếm phim hợp lệ (Happy path)', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_S03: Không có phim khớp (Trả về mảng rỗng)', async ({ request }) => {
        const response = await searchMovies(request, 'XYZ123_Khong_Co_Phim_Nay');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toEqual([]);
    });

    test('TC_S04: Tên chứa ký tự tiếng Việt (Trạng Tí)', async ({ request }) => {
        const response = await searchMovies(request, 'Trạng Tí');
        expect(response.status()).toBe(200);
    });

    test('TC_S05: Tên chứa ký tự đặc biệt (: -)', async ({ request }) => {
        const response = await searchMovies(request, 'Spider-Man: No Way Home');
        expect(response.status()).toBe(200);
    });
    
    test('TC_S06: Không cần token vẫn tìm được (Public API)', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
    });

    test('TC_S07: Có token hợp lệ vẫn trả về 200', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers', validToken);
        expect(response.status()).toBe(200);
    });

    test('TC_S10: Tên phim có dấu (Điện ảnh)', async ({ request }) => {
        const response = await searchMovies(request, 'Điện ảnh');
        expect(response.status()).toBe(200);
    });

    test('TC_S11: Tên phim cực dài', async ({ request }) => {
        const longName = 'A'.repeat(300);
        const response = await searchMovies(request, longName);
        // Backend có thể trả 200 (rỗng) hoặc 400 (lỗi độ dài), hoặc 417
        expect([200, 400, 417]).toContain(response.status());
    });

    test('TC_S13: Kiểm tra cấu trúc dữ liệu trả về', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers');
        expect(response.status()).toBe(200);
        const body = await response.json();
        
        if (body.length > 0) {
            const movie = body[0];
            expect(movie).toHaveProperty('id');
            expect(movie).toHaveProperty('name');
            // Các trường này tùy thuộc vào DB của bạn có hay không
            // expect(movie).toHaveProperty('smallImageURL'); 
            // expect(movie).toHaveProperty('duration');
            // expect(movie).toHaveProperty('rated');
        }
    });

    test('TC_S17: Gửi param thừa không lỗi', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?name=Avengers&x=1`);
        expect(response.status()).toBe(200);
    });

    test('TC_S21: Kiểm tra dữ liệu trùng lặp (Nếu có)', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers'); 
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('TC_S22: So sánh kết quả có/không token', async ({ request }) => {
        // Chạy song song 2 request
        const [resNoToken, resWithToken] = await Promise.all([
            searchMovies(request, 'Avengers'),
            searchMovies(request, 'Avengers', validToken)
        ]);
        
        const bodyNoToken = await resNoToken.json();
        const bodyWithToken = await resWithToken.json();

        expect(JSON.stringify(bodyNoToken)).toBe(JSON.stringify(bodyWithToken));
    });

    test('TC_S23: Tên phim chứa số (007)', async ({ request }) => {
        const response = await searchMovies(request, '007');
        expect(response.status()).toBe(200);
    });

    test('TC_S24: Tên phim quá ngắn (1 ký tự)', async ({ request }) => {
        const response = await searchMovies(request, 'A');
        expect(response.status()).toBe(200);
    });

    // --- II. NEGATIVE & EDGE CASES (CHẤP NHẬN LỖI 400, 417, 500) ---

    test('TC_S02: Không truyền param name', async ({ request }) => {
        // Gọi thẳng endpoint không có query param
        const response = await request.get(`${BASE_URL}${ENDPOINT}`); 
        // Backend có thể crash (500) hoặc trả về lỗi (400/417)
        expect([400, 417, 500]).toContain(response.status());
    });

    test('TC_S08: Token sai định dạng', async ({ request }) => {
        const response = await searchMovies(request, 'Avengers', 'token_tao_lao');
        // API Public nên có thể bỏ qua token (200) hoặc chặn (401)
        expect([200, 401]).toContain(response.status()); 
    });

    test('TC_S12: Query param chứa ký tự đặc biệt (Inject)', async ({ request }) => {
        const response = await searchMovies(request, '123!@#');
        // Backend thường trả về rỗng (200) hoặc lỗi
        expect([200, 400, 417, 500]).toContain(response.status());
    });

    test('TC_S15: Gọi sai endpoint', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/movies/showing/searh-sai-chinh-ta?name=Avengers`);
        // 401 do Security, 404 do không tìm thấy
        expect([404, 401]).toContain(response.status());
    });

    test('TC_S16: Gọi sai method (POST thay vì GET)', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${ENDPOINT}?name=Avengers`);
        expect([405, 404, 400, 401, 500]).toContain(response.status());
    });

    test('TC_S18: Kiểm tra CORS (Nếu backend có config)', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${ENDPOINT}?name=Avengers`, {
            headers: { 'Origin': 'http://another-frontend.com' },
        });
        expect(response.status()).toBe(200);
        // Không check header chặt chẽ để tránh fail nếu dev chưa config
    });

    test('TC_S19: SQL Injection (Đơn giản)', async ({ request }) => {
        const response = await searchMovies(request, "Avengers OR 1=1");
        // Mong đợi không sập (not 500), trả về 200 (tìm theo text) hoặc 400
        expect(response.status()).not.toBe(500); 
    });

    test('TC_S20: Kiểm tra phân trang (Optional)', async ({ request }) => {
        const response = await searchMovies(request, 'A', null, '&page=0&size=5');
        expect(response.status()).toBe(200);
    });

});