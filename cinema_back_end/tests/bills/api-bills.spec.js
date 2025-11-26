import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';

// --- 1. CẤU HÌNH CHUNG (Sửa lại cho khớp hệ thống của bạn) ---
const BASE_URL = 'http://localhost:8080'; 
const ENDPOINT = '/api/bills/create-new-bill'; // Biến này bị thiếu nên các test dưới bị lỗi
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';

// ID thật trong Database (Bạn cần check kỹ lại trong DB)
const REAL_USER_ID = 6;     // Log cũ của bạn là 6, hãy kiểm tra lại bảng 'userr'
const REAL_SCHEDULE_ID = 1; // Lấy từ ảnh bạn gửi
const REAL_SEAT_ID_1 = 10;   // Ghế A1
const REAL_SEAT_ID_2 = 8;   // Ghế A2
const REAL_SEAT_ID_3 = 9;   // Ghế A3

// --- 2. HÀM HELPER (Cần thiết cho các test case random) ---
const generateRandomSeats = (count = 1) => {
    const startId = Math.floor(Math.random() * 5000) + 5000; 
    return Array.from({ length: count }, (_, i) => startId + i);
};

// Object Body cơ bản để tái sử dụng (Tránh lỗi ReferenceError: BASE_BODY)
const BASE_BODY = {
    userId: REAL_USER_ID,
    scheduleId: REAL_SCHEDULE_ID,
    listSeatIds: []
};

test.describe('Full Coverage API Tests (POST /bill)', () => {
    let validToken;

    // --- 3. SETUP & TEARDOWN ---
    test.beforeAll(async () => {
        try {
            const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
            validToken = JSON.parse(data).accessToken;
            if (!validToken) throw new Error("Token null");
        } catch (error) {
            console.error('Lỗi đọc token. Hãy chạy Global Setup trước!');
            throw error;
        }
    });



    // --- GROUP I: HAPPY PATH (CHẠY ĐÚNG & DỌN DẸP) ---

    // --- GROUP I: HAPPY PATH ---
test('TC_B01: Tạo bill thành công (Chấp nhận ghế đã đặt)', async ({ request }) => {
    const body = { userId: REAL_USER_ID, scheduleId: REAL_SCHEDULE_ID, listSeatIds: [REAL_SEAT_ID_1] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    const status = response.status();
    const text = await response.text();
    if (status === 417 && text.includes("Đã có người")) expect(status).toBe(417);
    else expect(status).toBe(200);
});

test('TC_B02: Đặt nhiều ghế khác nhau (Chấp nhận ghế đã đặt)', async ({ request }) => {
    const body = { userId: REAL_USER_ID, scheduleId: REAL_SCHEDULE_ID, listSeatIds: [REAL_SEAT_ID_2, REAL_SEAT_ID_3] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    const status = response.status();
    const text = await response.text();
    if (status === 417 && text.includes("Đã có người")) expect(status).toBe(417);
    else expect(status).toBe(200);
});

// --- GROUP II: VALIDATION ---
test('TC_B03: Body rỗng', async ({ request }) => {
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: {} });
    expect(response.status()).toBe(417);
});

test('TC_B04: Thiếu trường scheduleId', async ({ request }) => {
    const { scheduleId, ...body } = BASE_BODY;
    body.listSeatIds = generateRandomSeats(1);
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B05: Thiếu trường listSeatIds', async ({ request }) => {
    const { listSeatIds, ...body } = BASE_BODY;
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B06: Sai kiểu dữ liệu (String thay vì Int)', async ({ request }) => {
    const body = { userId: "abc", scheduleId: "def", listSeatIds: [101] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(400);
});

test('TC_B07: Malformed JSON', async ({ request }) => {
    const malformedJson = '{ "userId": 1, "scheduleId": ';
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}`, 'Content-Type': 'application/json' }, data: malformedJson });
    expect(response.status()).toBe(400);
});

test('TC_B08: Gửi trùng ID ghế trong cùng 1 request', async ({ request }) => {
    const seatId = generateRandomSeats(1)[0];
    const body = { ...BASE_BODY, listSeatIds: [seatId, seatId] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B09: Thiếu trường userId', async ({ request }) => {
    const { userId, ...body } = BASE_BODY;
    body.listSeatIds = generateRandomSeats(1);
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

// --- GROUP III: BUSINESS LOGIC ---
test('TC_B10: Schedule ID không tồn tại', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1), scheduleId: 99999 };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B11: Đặt vé cho lịch chiếu đã kết thúc', async ({ request }) => {
    const expiredScheduleId = 999;
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1), scheduleId: expiredScheduleId };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B12: Ghế đã bị người khác mua', async ({ request }) => {
    const seats = generateRandomSeats(1);
    const body = { ...BASE_BODY, listSeatIds: seats };
    await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B13: User ID không tồn tại', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1), userId: 999999 };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

test('TC_B14: Ghế không thuộc phòng chiếu này', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: [1] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});

// --- GROUP IV: BOUNDARY ---
test('TC_B15: Số lượng ghế >100', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(101) };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(417);
});



// --- GROUP V: CONCURRENCY ---
test('TC_B16: Race Condition 2 request cùng ghế', async ({ request }) => {
    const seats = generateRandomSeats(1);
    const body = { ...BASE_BODY, listSeatIds: seats };
    const [res1, res2] = await Promise.all([
        request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body }),
        request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body })
    ]);
    const successCount = [res1.status(), res2.status()].filter(s => s === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);
});

// --- GROUP VI: SECURITY & EDGE CASES ---
test('TC_B17: SQL Injection', async ({ request }) => {
    const body = { userId: 6, scheduleId: 6, listSeatIds: ["10 OR 1=1"] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(400);
});

test('TC_B18: Unicode / ký tự đặc biệt', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: ["Ghế Vip", "+"] };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': `Bearer ${validToken}` }, data: body });
    expect(response.status()).toBe(400);
});

test('TC_B19: Không có Header Authorization', async ({ request }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1) };
    const response = await request.post(BASE_URL + ENDPOINT, { headers: { 'Authorization': '' }, data: body });
    expect(response.status()).toBe(401);
});
});
