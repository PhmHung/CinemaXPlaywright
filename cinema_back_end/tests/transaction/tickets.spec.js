/** @format */
import { test, expect } from "@playwright/test";
import * as fs from "fs";

const baseURL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";

let authToken;

const LOGGED_IN_USER_ID = 1;

test.describe("API Tests for GET /api/tickets", () => {
  test.beforeAll(() => {
    try {
      const authFileContent = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
      const authData = JSON.parse(authFileContent);
      authToken = authData.accessToken;
    } catch (error) {
      console.error(
        `LỖI: Không thể tải token từ ${TOKEN_FILE_PATH}. Vui lòng đảm bảo globalSetup đã chạy.`
      );
      throw error;
    }
  });

  const buildUrl = (userId) => {
    return `${baseURL}/api/tickets?userId=${userId}`;
  };

  /**
   * @desc GET /api/tickets - TC-T1: Lấy danh sách vé thành công của người đặt
   * @goal Status: 200 OK, Body: Trả về nội dung lịch chiếu, chi nhánh, v.v. (List không rỗng)
   * @data Params: userId = LOGGED_IN_USER_ID
   */
  test("TC-T1: should return list of tickets for the logged-in user", async ({
    request,
  }) => {
    const url = buildUrl(LOGGED_IN_USER_ID);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const tickets = await response.json();
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets[0]).toHaveProperty("id");
  });

  /**
   * @desc GET /api/tickets - TC-T2: Lấy danh sách vé của người khác
   * @goal Status: 401 Unauthorized (hoặc 403 Forbidden nếu API phân quyền mạnh)
   * @data Params: userId = Bất kỳ (ID khác 1)
   */
  test("TC-T2: should fail (401) when fetching tickets for another user", async ({
    request,
  }) => {
    const otherUserId = 2;
    const url = buildUrl(otherUserId);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(401);
  });

  /**
   * @desc GET /api/tickets - TC-T3: Lấy danh sách vé rỗng (User đăng nhập nhưng chưa đặt vé)
   * @goal Status: 200 OK, Body: Trả về mảng rỗng ([])
   * @data Params: userId = User chưa đặt vé (Giả định ID 99)
   */
  test("TC-T3: should return empty array for user who has not booked", async ({
    request,
  }) => {
    // Giả định User ID 99 là hợp lệ nhưng chưa từng đặt vé
    const userWithoutBookings = 99;
    const url = buildUrl(userWithoutBookings);

    const response = await request.get(url, {
      headers: {
        // Chúng ta vẫn phải dùng token của LOGGED_IN_USER_ID=1 để xác thực
        Authorization: `Bearer ${authToken}`,
      },
    });

    // 1. Kiểm tra Status Code
    // Giả định API cho phép admin/user lấy data nếu query hợp lệ, nhưng trả về rỗng nếu không có data.
    expect(response.status()).toBe(200);

    // 2. Kiểm tra Body response (phải là một mảng rỗng)
    const tickets = await response.json();
    expect(Array.isArray(tickets)).toBe(true);
    expect(tickets.length).toBe(0);
  });

  // --- TC_T4: Gửi API thiếu userId ---
  /**
   * @desc GET /api/tickets - TC-T4: Gửi API thiếu userId
   * @goal Status: 400 Bad Request
   * @data Params: Thiếu userId
   */
  test("TC-T4: should fail with missing userId parameter", async ({
    request,
  }) => {
    // Gửi request thiếu tham số userId
    const url = `${baseURL}/api/tickets`;

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // 1. Kiểm tra Status Code
    expect(response.status()).toBe(400);
  });

  // --- TC_T5: userId là chuỗi ký tự ---
  /**
   * @desc GET /api/tickets - TC-T5: Gửi API với userId là chuỗi ký tự
   * @goal Status: 400 Bad Request
   * @data Params: userId là chuỗi (ví dụ: "abc")
   */
  test("TC-T5: should fail with non-numeric userId", async ({ request }) => {
    const nonNumericUserId = "abc";
    const url = buildUrl(nonNumericUserId);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // 1. Kiểm tra Status Code
    expect(response.status()).toBe(400);
  });

  // --- TC_T6: Không có Token (Unauthenticated) ---
  /**
   * @desc GET /api/tickets - TC-T6: Gửi API mà không có token
   * @goal Status: 401 Unauthorized
   * @data Headers: Không có Token, Params: userId hợp lệ
   */
  test("TC-T6: should fail with missing authorization token (401)", async ({
    request,
  }) => {
    const url = buildUrl(LOGGED_IN_USER_ID);

    // Gửi request mà không kèm Authorization Header
    const response = await request.get(url);

    // 1. Kiểm tra Status Code
    expect(response.status()).toBe(401);
  });
});
