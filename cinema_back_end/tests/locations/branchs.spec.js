/** @format */
import { test, expect } from "@playwright/test";
import * as fs from "fs";

const baseURL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";

let authToken;

test.describe("API Tests for GET /api/branches", () => {
  test.beforeAll(() => {
    try {
      const authFileContent = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
      const authData = JSON.parse(authFileContent);
      authToken = authData.accessToken;
    } catch (error) {
      console.error(
        `LỖI: Không thể tải token từ ${TOKEN_FILE_PATH}. Vui lòng chạy globalSetup trước.`
      );
      throw error;
    }
  });

  /**
   * @desc GET /api/branches - TC-B1: Lấy danh sách chi nhánh phim có movieId hợp lệ và có lịch chiếu
   * @goal Status: 200 OK, Body: Chứa thông tin của chi nhánh (List không rỗng)
   * @data Params: movieId hợp lệ (ví dụ: 7)
   */
  test("TC-B1: should return list of branches with valid movieId and available schedule", async ({
    request,
  }) => {
    const movieIdWithSchedule = 7;

    const response = await request.get(
      `${baseURL}/api/branches?movieId=${movieIdWithSchedule}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBeGreaterThan(0);
  });

  /**
   * @desc GET /api/branches - TC-B2: Lấy danh sách chi nhánh phim có movieId hợp lệ nhưng không có lịch chiếu
   * @goal Status: 200 OK, Body: Rỗng ([])
   * @data Params: movieId hợp lệ (ví dụ: 999 - không có lịch chiếu)
   */
  test("TC-B2: should return empty list with valid movieId but no schedule", async ({
    request,
  }) => {
    const movieIdWithoutSchedule = 999;

    const response = await request.get(
      `${baseURL}/api/branches?movieId=${movieIdWithoutSchedule}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);
    const branches = await response.json();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBe(0);
  });

  /**
   * @desc GET /api/branches - TC-B3: Lấy danh sách chi nhánh phim với movieId không tồn tại/không hợp lệ
   * @goal Status: 200 OK, Body: Rỗng ([])
   * @data Params: movieId không hợp lệ (ví dụ: 0)
   */
  test("TC-B3: should return empty list with non-existent movieId", async ({
    request,
  }) => {
    const nonExistentMovieId = 0;

    const response = await request.get(
      `${baseURL}/api/branches?movieId=${nonExistentMovieId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status()).toBe(200);

    const branches = await response.json();
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBe(0);
  });

  /**
   * @desc GET /api/branches - TC-B4: Lấy danh sách chi nhánh phim không có tham số movieId
   * @goal Status: 400 Bad Request
   * @data Params: Thiếu movieId
   */
  test("TC-B4: should fail with missing movieId parameter", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc GET /api/branches - TC-B5: Lấy danh sách chi nhánh phim có movieId không hợp lệ (là ký tự chữ)
   * @goal Status: 400 Bad Request
   * @data Params: movieId là ký tự chữ (ví dụ: "abc")
   */
  test("TC-B5: should fail with non-numeric movieId parameter", async ({
    request,
  }) => {
    const nonNumericMovieId = "abc";

    const response = await request.get(
      `${baseURL}/api/branches?movieId=${nonNumericMovieId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    expect(response.status()).toBe(400);
  });

  /**
   * @desc GET /api/branches - TC-B6: Lấy danh sách chi nhánh phim không có token xác thực
   * @goal Status: 401 Unauthorized
   * @data Params: movieId hợp lệ, Headers: Không có Token
   */
  test("TC-B6: should fail with missing authorization token (401)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches?movieId=7`);

    expect(response.status()).toBe(401);
  });
});
