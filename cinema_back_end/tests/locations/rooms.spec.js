/** @format */

import { test, expect } from "@playwright/test";
import * as fs from "fs";

const baseURL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";
let authToken;

const VALID_PARAMS = {
  movieId: 7,
  branchId: 2,
  startDate: "2021-01-05",
  startTime: "10:15",
};
test.describe("API Tests for GET /api/rooms", () => {
  test.beforeAll(() => {
    try {
      const authFileContent = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
      const authData = JSON.parse(authFileContent);
      authToken = authData.accessToken;
    } catch (error) {
      console.error(
        `LỖI: Không thể tải token từ ${TOKEN_FILE_PATH}. Đảm bảo globalSetup đã chạy.`
      );
      throw error;
    }
  });
  const buildUrl = (params) => {
    const query = new URLSearchParams(params).toString();
    return `${baseURL}/api/rooms?${query}`;
  };

  /**
   * @desc GET /api/rooms - TC-RM1: Lấy danh sách phòng xem phim thành công
   * @goal Status: 200 OK, Body: Thông tin phòng
   * @data Params: movieId, branchId, startDate, startTime hợp lệ (có lịch)
   */
  test("TC-RM1: should return list of rooms with matching schedule", async ({
    request,
  }) => {
    const url = buildUrl(VALID_PARAMS);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.status()).toBe(200);
    const rooms = await response.json();
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms[0]).toHaveProperty("id");
  });

  /**
   * @desc GET /api/rooms - TC-RM2: Không có phòng/lịch chiếu nào khớp
   * @goal Status: 200 OK, Body: mảng rỗng
   * @data Params: movieId hợp lệ, các tham số khác không khớp với lịch nào
   */
  test("TC-RM2: should return empty array if no matching schedule found", async ({
    request,
  }) => {
    const params = {
      ...VALID_PARAMS,
      startTime: "03:00",
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const rooms = await response.json();
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBe(0);
  });
  /**
   * @desc GET /api/rooms - TC-RM3: Gửi API thiếu 1 tham số movieId
   * @goal Status: 400 Bad Request
   * @data Params: Thiếu movieId
   */
  test("TC-RM3: should fail with missing movieId parameter", async ({
    request,
  }) => {
    const params = {
      branchId: VALID_PARAMS.branchId,
      startDate: VALID_PARAMS.startDate,
      startTime: VALID_PARAMS.startTime,
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc GET /api/rooms - TC-RM4: Gửi movieId kiểu dữ liệu chuỗi
   * @goal Status: 400 Bad Request
   * @data Params: movieId="abc"
   */
  test("TC-RM4: should fail with non-numeric movieId", async ({ request }) => {
    const params = {
      ...VALID_PARAMS,
      movieId: "abc",
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc GET /api/rooms - TC-RM5: Gửi startDate sai kiểu dữ liệu (ngày không hợp lệ)
   * @goal Status: 400 Bad Request
   * @data Params: startDate="2021-01-35"
   */
  test("TC-RM5: should fail with invalid date format for startDate", async ({
    request,
  }) => {
    const params = {
      ...VALID_PARAMS,
      startDate: "2021-01-35",
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.status()).toBe(500);
  });

  /**
   * @desc GET /api/rooms - TC-RM6: Gửi API mà không có Token
   * @goal Status: 401 Unauthorized
   * @data Params: Các tham số hợp lệ, Headers: Không có Token
   */
  test("TC-RM6: should fail with missing authorization token (401)", async ({
    request,
  }) => {
    const url = buildUrl(VALID_PARAMS);
    const response = await request.get(url);
    expect(response.status()).toBe(401);
  });
});
