/** @format */
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:8080";
const API_PATH = "/api/schedule/start-times";
const VALID_DATA = {
  movieId: 7,
  branchId: 1,
  startDate: "2021-01-05",
};

let accessToken = "";

test.describe("API Schedule Testing (Base Choice + SQL Injection)", () => {
  test.beforeAll(async ({ request }) => {
    console.log("--- [SETUP] Đang đăng nhập hệ thống ---");
    const response = await request.post(`${BASE_URL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
      },
    });

    expect(
      response.status(),
      "Đăng nhập thất bại! Kiểm tra lại user/pass"
    ).toBe(200);

    const body = await response.json();
    accessToken = body.accessToken;
    console.log(
      `--- [SETUP] Đăng nhập thành công. Token: ${accessToken.substring(
        0,
        10
      )}... ---`
    );
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });

  test("TC01: [Base Choice] Lấy lịch chiếu thành công (Happy Path)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: VALID_DATA,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    console.log(`TC01 Passed. Tìm thấy ${body.length} suất chiếu.`);
  });

  test("TC02: movieId là số âm (-7)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: -7 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC03: movieId quá lớn (Integer Overflow)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: 21474836489 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC04: movieId sai kiểu (chuỗi 'abc')", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC05: Thiếu trường movieId", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.movieId;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC06: movieId không tồn tại (9999)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: 9999 },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.length).toBe(0);
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test("TC07: branchId là số âm (-1)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: -1 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC08: branchId quá lớn (Overflow)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: 9999999999 },
    });
    expect(response.status()).toBe(400);
  });

  test("TC09: branchId là khoảng trắng/sai format", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: "   " },
    });
    expect(response.status()).toBe(400);
  });

  test("TC10: Thiếu trường branchId", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.branchId;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC11: [Quan trọng] Ngày sai logic (Ngày 32/01)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "2021-01-32" },
    });
    expect(
      response.status(),
      "Server không xử lý tốt ngày không tồn tại (đã crash ra 500)"
    ).toBe(400);
  });

  test("TC12: Ngày sai định dạng (05-01-2021)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "05-01-2021" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC13: Thiếu trường startDate", async ({ request }) => {
    const params = { ...VALID_DATA };
    delete params.startDate;

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: params,
    });
    expect(response.status()).toBe(400);
  });

  test("TC14: SQL Injection - Boolean Based (startDate)", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, startDate: "2021-01-05' OR '1'='1" },
    });
    expect(response.status()).toBe(400);
  });

  test("TC15: SQL Injection - UNION SELECT (movieId)", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, movieId: "7 UNION SELECT 1, version()--" },
    });

    expect(response.status()).toBe(400);
  });

  test("TC16: SQL Injection - Time Based (branchId SLEEP)", async ({
    request,
  }) => {
    const payload = "1; SLEEP(5)--";

    const startTime = Date.now();

    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: getHeaders(),
      params: { ...VALID_DATA, branchId: payload },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`TC16 Duration: ${duration}ms`);
    expect(response.status()).toBe(400);
    expect(duration).toBeLessThan(2000);
  });

  test("TC17: Không gán Token (Unauthorized)", async ({ request }) => {
    console.log("--- Running TC17: Testing without Token ---");
    const response = await request.get(`${BASE_URL}${API_PATH}`, {
      headers: {
        "Content-Type": "application/json",
      },
      params: VALID_DATA,
    });

    expect(response.status()).toBe(401);
  });
});
