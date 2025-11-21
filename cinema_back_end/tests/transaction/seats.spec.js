/** @format */
import { test, expect } from "@playwright/test";
import * as fs from "fs";

const baseURL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";

let authToken;

const VALID_SCHEDULE_ID = 1;

test.describe("API Tests for GET /api/seats", () => {
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

  const buildUrl = (scheduleId) => {
    return `${baseURL}/api/seats?scheduleId=${scheduleId}`;
  };

  /**
   * @desc GET /api/seats - TC-S1: Lấy danh sách ghế thành công với scheduleId hợp lệ
   * @goal Status: 200 OK, Body: Hiển thị danh sách chỗ ngồi, trạng thái chỗ ngồi
   * @data Params: scheduleId hợp lệ (ví dụ: 1)
   */
  test("TC-S1: should return list of seats with valid scheduleId", async ({
    request,
  }) => {
    const url = buildUrl(VALID_SCHEDULE_ID);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const seats = await response.json();
    expect(Array.isArray(seats)).toBe(true);
    expect(seats.length).toBeGreaterThan(0);
    expect(seats[0]).toHaveProperty("id");
    expect(seats[0]).toHaveProperty("status");
  });

  /**
   * @desc GET /api/seats - TC-S2: Lấy danh sách ghế với scheduleId không hợp lệ
   * @goal Status: 200 OK, Body: Mảng rỗng ([])
   * @data Params: scheduleId không tồn tại (ví dụ: 99999)
   */
  test("TC-S2: should return empty list with non-existent scheduleId", async ({
    request,
  }) => {
    const nonExistentScheduleId = 99999;
    const url = buildUrl(nonExistentScheduleId);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const seats = await response.json();
    expect(Array.isArray(seats)).toBe(true);
    expect(seats.length).toBe(0);
  });

  /**
   * @desc GET /api/seats - TC-S3: Lấy danh sách ghế với scheduleId trống
   * @goal Status: 400 Bad Request
   * @data Params: scheduleId trống/thiếu
   */
  test("TC-S3: should fail with missing scheduleId parameter", async ({
    request,
  }) => {
    const url = `${baseURL}/api/seats`;

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(400);

    const responseText = await response.text();
    expect(responseText).toContain("Error Message"); // Dựa vào bảng của bạn
  });

  /**
   * @desc GET /api/seats - TC-S4: Lấy danh sách ghế khi scheduleId là chuỗi ký tự
   * @goal Status: 400 Bad Request
   * @data Params: scheduleId là chuỗi (ví dụ: "abc")
   */
  test("TC-S4: should fail with non-numeric scheduleId", async ({
    request,
  }) => {
    const nonNumericScheduleId = "abc";
    const url = buildUrl(nonNumericScheduleId);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(400);

    const responseText = await response.text();
    expect(responseText).toContain("Error Message"); // Dựa vào bảng của bạn
  });

  /**
   * @desc GET /api/seats - TC-S5: Lấy danh sách mà không có token
   * @goal Status: 401 Unauthorized
   * @data Headers: Không có Token
   */
  test("TC-S5: should fail with missing authorization token (401)", async ({
    request,
  }) => {
    const url = buildUrl(VALID_SCHEDULE_ID);

    const response = await request.get(url);
    expect(response.status()).toBe(401);
  });
});
