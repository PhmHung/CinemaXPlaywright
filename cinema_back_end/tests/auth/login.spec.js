/** @format */
import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /login (Khớp 100% Data Báo Cáo)", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${baseURL}/register`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    if (res.status() === 200) {
      console.log("SETUP: Đã tạo mới tài khoản testr1@gmail.com");
    } else {
      console.log(
        "SETUP: Tài khoản testr1@gmail.com đã có sẵn, chuyển sang test login."
      );
    }
  });

  //TC_L1: ĐÚNG TÀI KHOẢN, ĐÚNG MẬT KHẨU
  test("TC_L1: Kiểm tra đăng nhập với tài khoản mật khẩu đúng", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
      },
    });
    expect(response.status()).toBe(200);
  });

  //TC_L2: SAI MẬT KHẨU
  test("TC_L2: Kiểm tra đăng nhập với mật khẩu sai", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "12345",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  //TC_L3: SAI TÀI KHOẢN
  test("TC_L3: Kiểm tra đăng nhập với tài khoản sai", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "fail@example.com",
        password: "123456",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  //TC_L4: SAI KIỂU DỮ LIỆU PASSWORD
  test("TC_L4: Kiểm tra đăng nhập với sai kiểu dữ liệu password", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "fail@example.com",
        password: 123456,
      },
    });
    expect(response.status()).toBe(400);
  });

  const numberAsString = "99999";
  const numberAsNumber = 99999;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${baseURL}/register`, {
      data: {
        username: numberAsString,
        password: "123456",
        fullName: "Number Test User",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    if (res.status() === 200) {
      console.log("SETUP: Đã tạo user chuỗi '99999' thành công.");
    }
  });

  // TC_L5: SAI KIỂU DỮ LIỆU USERNAME
  test("TC_L5: Kiểm tra đăng nhập với sai kiểu dữ liệu username", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: numberAsNumber,
        password: "123456",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L6: THIẾU PASSWORD
  test("TC_L6: Kiểm tra thiếu trường password", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "hung@example.com",
        password: "",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L7: THIẾU USERNAME
  test("TC_L7: Kiểm tra thiếu trường username", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "",
        password: "123456",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L8: BODY RỖNG
  test("TC_L8: Kiểm tra body rỗng", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  //TC_L9: TÀI KHOẢN CHƯA ĐĂNG KÝ
  test("TC_L9: Kiểm tra đăng nhập vào tài khoản chưa được đăng ký", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "New@example.com",
        password: "123456",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("TC_L10: Kiểm tra SQL Injection", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "' OR '1' = '1",
        password: 123456,
      },
    });
    expect(response.status()).not.toBe(200);
  });
});
/** @format */

import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import path from 'path';

// Cấu hình cơ bản
const BASE_URL = 'http://localhost:8080'; // Cập nhật theo file Login của bạn (8080)
const ENDPOINT = '/api/bills/create-new-bill';
const TOKEN_FILE_PATH = './tests/test_data/authentic.json';

// Hàm helper: Tạo số ghế ngẫu nhiên để tránh lỗi "Ghế đã chọn" khi chạy test nhiều lần
const generateRandomSeats = (count = 2) => {
    const startId = 5000; // Giả sử ghế từ 5000 trở đi là ghế trống để test
    return Array.from({ length: count }, () => 
        Math.floor(Math.random() * 10000) + startId
    );
};

test.describe('Tạo Bill API Tests (POST /bill)', () => {
    let validToken;
    
    // Dữ liệu mẫu cơ sở (sẽ được override seatId trong từng test)
    const BASE_BODY = {
        userId: 6,      // Đảm bảo ID này tồn tại trong DB
        scheduleId: 6,  // Đảm bảo ID này tồn tại và chưa chiếu xong
        listSeatIds: [] // Sẽ điền động
    };

    // 1. Setup: Đọc token từ file JSON trước khi chạy toàn bộ suite
    test.beforeAll(async () => {
        try {
            const data = await fs.readFile(TOKEN_FILE_PATH, 'utf-8');
            const authData = JSON.parse(data);
            validToken = authData.accessToken;
            
            if (!validToken) throw new Error("Token không tồn tại trong file data");
        } catch (error) {
            console.error('Lỗi đọc token. Hãy chạy Global Setup trước!', error);
            throw error;
        }
    });

    // --- I. Happy Path (Trường hợp thành công) ---
    
    test('TC_B01: Tạo bill thành công với dữ liệu hợp lệ', async ({ request }) => {
        const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(2) };
        
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body
        });

        // Happy path phải là 200 OK
        expect(response.status()).toBe(200);
        
        const resBody = await response.json();
        // Kiểm tra body trả về có chứa thông tin cần thiết không (ví dụ message hoặc billId)
        // expect(resBody).toHaveProperty('id'); 
    });

    // --- II. Validation & Error Cases ---

    test('TC_B03: Gửi body rỗng', async ({ request }) => {
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: {}
        });
        expect(response.status()).toBe(400);
    });

    test('TC_B05: Schedule ID không tồn tại', async ({ request }) => {
        const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1), scheduleId: 99999 };
        
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body
        });
        
        // Mong đợi 400 Bad Request hoặc 404 Not Found
        expect([400, 404]).toContain(response.status());
    });

    test('TC_B08: Ghế đã bị mua (Test logic nghiệp vụ)', async ({ request }) => {
        // Bước 1: Mua trước 1 ghế để đảm bảo nó đã bị chiếm
        const seatToDuplicate = generateRandomSeats(1);
        const body1 = { ...BASE_BODY, listSeatIds: seatToDuplicate };
        
        const setupResponse = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body1
        });
        expect(setupResponse.status()).toBe(200);

        // Bước 2: Cố tình mua lại ghế đó
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body1
        });

        // Mong đợi lỗi (thường là 400 hoặc 417 như code cũ của bạn)
        // Nếu hệ thống trả 417 cho lỗi nghiệp vụ, giữ nguyên 417
        expect([400, 417, 409]).toContain(response.status());
    });

    test('TC_B12: Sai kiểu dữ liệu (String thay vì Int)', async ({ request }) => {
        const body = { 
            userId: "abc", 
            scheduleId: "def", 
            listSeatIds: [101] 
        };
        
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body
        });
        expect(response.status()).toBe(400);
    });

    test('TC_B14: Số lượng ghế vượt quá giới hạn (ví dụ > 10)', async ({ request }) => {
        const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(20) }; // Giả sử max là 10
        
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': `Bearer ${validToken}` },
            data: body
        });
        expect([400, 417]).toContain(response.status());
    });

    // --- III. Concurrency (Xử lý đồng thời) ---

    test('TC_B15: Race Condition - 2 request đặt cùng 1 ghế cùng lúc', async ({ request }) => {
        const targetSeats = generateRandomSeats(2);
        const body = { ...BASE_BODY, listSeatIds: targetSeats };

        // Gửi 2 request ĐỒNG THỜI (Parallel)
        const [res1, res2] = await Promise.all([
            request.post(BASE_URL + ENDPOINT, {
                headers: { 'Authorization': `Bearer ${validToken}` },
                data: body
            }),
            request.post(BASE_URL + ENDPOINT, {
                headers: { 'Authorization': `Bearer ${validToken}` },
                data: body
            })
        ]);

        console.log(`Concurrency Statuses: ${res1.status()} - ${res2.status()}`);

        // Logic chuẩn: 1 cái thành công (200), 1 cái thất bại (400/409/417)
        // HOẶC cả 2 đều thất bại nếu DB lock quá chặt, nhưng không được cả 2 cùng thành công (200)
        const statuses = [res1.status(), res2.status()];
        
        const successCount = statuses.filter(s => s === 200).length;
        expect(successCount).toBeLessThanOrEqual(1); // Không được phép cả 2 cùng mua được
        expect(statuses).toContain(417); // Ít nhất 1 cái phải lỗi (dựa theo mã lỗi cũ của bạn)
    });

    // --- IV. Authentication Errors ---

    test('TC_B22: Không có Token', async ({ request }) => {
        const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1) };
        const response = await request.post(BASE_URL + ENDPOINT, {
            headers: { 'Authorization': '' }, // Token rỗng
            data: body
        });
        // Lỗi authen phải là 401 Unauthorized
        expect(response.status()).toBe(401);
    });
});