/** @format */
import { test, expect } from "@playwright/test";
import * as fs from "fs";

const baseURL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";

let authToken;
const VALID_SCHEDULE_PARAMS = {
  movieId: 7,
  branchId: 1,
  startDate: "2021-01-05",
};

test.describe("API Tests for GET /api/schedule/start-times", () => {
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
  const buildUrl = (params) => {
    const query = new URLSearchParams(params).toString();
    return `${baseURL}/api/schedule/start-times?${query}`;
  };
  /**
   * @desc GET /api/schedule/start-times - TC-ST1: Lấy danh sách giờ chiếu thành công
   * @goal Status: 200 OK, Body: Hiển thị danh sách thời gian chiếu
   * @data Params: movieId, branchId, startDate hợp lệ (có lịch)
   */
  test("TC-ST1: should return list of start times successfully", async ({
    request,
  }) => {
    const url = buildUrl(VALID_SCHEDULE_PARAMS);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const startTimes = await response.json();
    expect(Array.isArray(startTimes)).toBe(true);
    expect(startTimes.length).toBeGreaterThan(0);
  });

  /**
   * @desc GET /api/schedule/start-times - TC-ST2: Phim không có lịch chiếu vào ngày/rạp đó
   * @goal Status: 200 OK, Body: Trả về danh sách rỗng ([])
   * @data Params: movieId, branchId hợp lệ, startDate không có lịch
   */
  test("TC-ST2: should return empty list if no schedule matches date/branch", async ({
    request,
  }) => {
    const params = {
      ...VALID_SCHEDULE_PARAMS,
      startDate: "2021-01-01",
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const startTimes = await response.json();
    expect(Array.isArray(startTimes)).toBe(true);
    expect(startTimes.length).toBe(0);
  });
  /**
   * @desc GET /api/schedule/start-times - TC-ST3: Gửi API nhưng thiếu params startDate
   * @goal Status: 400 Bad Request
   * @data Params: Thiếu startDate
   */
  test("TC-ST3: should fail with missing startDate parameter", async ({
    request,
  }) => {
    const params = {
      movieId: VALID_SCHEDULE_PARAMS.movieId,
      branchId: VALID_SCHEDULE_PARAMS.branchId,
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
   * @desc GET /api/schedule/start-times - TC-ST4: Gửi API nhưng sai định dạng startDate
   * @goal Status: 400 Bad Request
   * @data Params: startDate="2021/01/05" (Sai format YYYY-MM-DD)
   */
  test("TC-ST4: should fail with invalid date format for startDate", async ({
    request,
  }) => {
    const params = {
      ...VALID_SCHEDULE_PARAMS,
      startDate: "20212/01/05",
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
   * @desc GET /api/schedule/start-times - TC-ST5: Gửi API sai movieId
   * @goal Status: 200 OK, Body: Trả về danh sách rỗng ([])
   * @data Params: movieId sai (ví dụ: 0)
   */
  test("TC-ST5: should return empty list with non-existent movieId", async ({
    request,
  }) => {
    const params = {
      ...VALID_SCHEDULE_PARAMS,
      movieId: 0,
    };
    const url = buildUrl(params);

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const startTimes = await response.json();
    expect(Array.isArray(startTimes)).toBe(true);
    expect(startTimes.length).toBe(0);
  });

  /**
   * @desc GET /api/schedule/start-times - TC-ST6: Gửi API mà không có Token
   * @goal Status: 401 Unauthorized
   * @data Params: Các tham số hợp lệ, Headers: Không có Token
   */
  test("TC-ST6: should fail with missing authorization token (401)", async ({
    request,
  }) => {
    const url = buildUrl(VALID_SCHEDULE_PARAMS);
    const response = await request.get(url);
    expect(response.status()).toBe(401);
  });
});
