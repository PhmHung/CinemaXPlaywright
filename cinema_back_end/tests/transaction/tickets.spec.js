/** @format */
import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";
let accessToken = "";

test.describe("API Tests for GET /api/tickets (TC_T1 - TC_T7)", () => {
  test.beforeAll(async ({ request }) => {
    console.log("--- SETUP: Đang đăng nhập với testr1@gmail.com ---");
    const response = await request.post(`${baseURL}/login`, {
      data: { username: "testr1@gmail.com", password: "123456" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    accessToken = body.accessToken;
    console.log("SETUP: Đã lấy được Token!");
  });

  // TC_T1: HAPPY PATH (SỬA LẠI SANG GET)
  test("TC_T1: Lấy danh sách vé thành công với userId hợp lệ (userId=1)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        userId: "1",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  // TC_T2: INVALID TYPE
  test("TC_T2: Lấy danh sách vé với userId kiểu dữ liệu string ('abc')", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { userId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T3: WHITESPACE
  test("TC_T3: Lấy danh sách vé với userId chứa khoảng trắng", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { userId: " " },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T4: MISSING PARAM userId
  test("TC_T4: Thiếu tham số userId", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {},
    });
    expect(response.status()).toBe(400);
  });

  // TC_T5: BUSINESS LOGIC userId là số âm
  test("TC_T5: Lấy danh sách vé với userId là số âm", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { userId: "-1" },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T6: SECURITY lấy vé của người khác
  test("TC_T6: Lấy danh sách vé của người khác (userId=2)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { userId: "2" },
    });

    expect(response.status()).toBe(401);
  });

  // TC_T7: SECURITY không Token
  test("TC_T7: Gọi API không có token", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/tickets`, {
      params: { userId: "1" },
    });
    expect(response.status()).toBe(401);
  });
});
