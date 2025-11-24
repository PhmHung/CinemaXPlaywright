/** @format */
import { test, expect } from "@playwright/test";

// --- CẤU HÌNH TEST ---
const BASE_URL = "http://localhost:8080";
const API_PATH = "/api/rooms";
const LOGIN_USER = { username: "testr1@gmail.com", password: "123456" };

// Dữ liệu chuẩn (Happy Path - Base Choice)
const VALID_DATA = {
  movieId: "7",
  branchId: "1",
  startDate: "2021-01-05",
  startTime: "10:15",
};

let accessToken = "";

test.describe("FULL SUITE: Schedule API Testing (21 Test Cases)", () => {
  test.beforeAll(async ({ request }) => {
    console.log("--- [SETUP] Đang đăng nhập hệ thống ---");
    const response = await request.post(`${BASE_URL}/login`, {
      data: LOGIN_USER,
    });

    expect(response.status(), "Đăng nhập thất bại!").toBe(200);
    const body = await response.json();
    accessToken = body.accessToken;
    console.log("--- [SETUP] Đăng nhập thành công. Token đã sẵn sàng. ---");
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });
  test("TC_RM01: [Base Choice] Lấy dữ liệu thành công (Happy Path)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: VALID_DATA,
    });
    if (response.status() !== 200) {
      console.log("URL gọi đi:", `${BASE_URL}${API_PATH}`);
      console.log("Params gửi đi:", VALID_DATA);
      console.log("❌ LỖI SERVER TRẢ VỀ:", await response.text()); // Hoặc .json()
    }
    expect(response.status()).toBe(200);
    const body = await response.json();
  });

  test("TC_RM02: movieId là số âm (-7)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: -7 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM03: movieId quá lớn (Integer Overflow)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: 9999999999 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM04: movieId sai kiểu dữ liệu (chuỗi 'abc')", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM05: Thiếu trường movieId (Missing)", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.movieId;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM06: movieId không tồn tại (Logic Not Found)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: 9999 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM07: branchId là số âm (-1)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: -1 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM08: branchId quá lớn (Overflow)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: 9999999999 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM09: branchId sai format (Space)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: "   " },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM10: Thiếu trường branchId", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.branchId;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM11: Ngày sai logic (32/02) - Kiểm tra lỗi 500", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "2021-02-32" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM12: Ngày sai định dạng (dd-mm-yyyy)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "02-04-2021" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM13: Thiếu trường startDate", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.startDate;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM14: Giờ sai logic (25:10)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startTime: "25:10" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM15: Thiếu trường startTime", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.startTime;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM16: Không gửi Token (Unauthenticated)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      params: VALID_DATA,
    });
    expect(response.status()).toBe(401);
  });

  test("TC_RM17: Gửi Token rác/Hết hạn", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: { Authorization: "Bearer token_rac_123456" },
      params: VALID_DATA,
    });
    expect(response.status()).toBe(401);
  });

  test("TC_RM18: SQL Injection - Boolean Based (startDate)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "2021-01-05' OR '1'='1" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM19: SQL Injection - UNION SELECT (movieId)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: "7 UNION SELECT 1, version()--" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC_RM20: SQL Injection - Time Based (SLEEP)", async ({ request }) => {
    console.log("Checking Time-based SQL Injection...");
    const start = Date.now();

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: "1; SLEEP(5)--" },
    });

    const duration = Date.now() - start;
    console.log(`Response Time: ${duration}ms`);
    expect(response.status()).toBe(400);
    expect(duration).toBeLessThan(2000);
  });

  test("TC_RM21: SQL Injection - Drop Table (startTime)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startTime: "10:00'; DROP TABLE schedules--" },
    });
    expect(response.status()).toBe(400);
  });
});
