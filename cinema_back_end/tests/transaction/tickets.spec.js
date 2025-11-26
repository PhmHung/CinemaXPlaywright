/** @format */

import { test } from "../fixtures/auth-fixture.js";
import { expect } from "@playwright/test";

const BASE_URL = "http://localhost:8080";
const API_PATH = "/api/tickets";

test.describe("API GET /api/tickets - Lấy danh sách vé theo userId", () => {
  // TC_T1: Happy Path - userId hợp lệ, có vé
  test("TC_T1: Lấy danh sách vé thành công của người dùng đã đặt vé", async ({
    authRequest,
  }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: 6 }, // hoặc 108 nếu user testr1 có vé
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    console.log(`Tìm thấy ${body.length} vé của userId=6`);
  });

  // TC_T2: userId là chuỗi ký tự (sai kiểu)
  test("TC_T2: userId là chuỗi 'abc' ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: "abc" },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T3: userId là khoảng trắng
  test("TC_T3: userId là khoảng trắng ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: "   " },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T4: Thiếu tham số userId
  test("TC_T4: Thiếu tham số userId ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`);
    expect(response.status()).toBe(400);
  });

  // TC_T5: userId là số âm
  test("TC_T5: userId là số âm (-1)", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: -1 },
    });
    expect(response.status()).toBe(400);
  });

  // TC_T6: userId của người khác (không phải mình) → 401 Unauthorized
  test("TC_T6: Lấy vé của user khác ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: 999 }, // user không tồn tại hoặc không phải mình
    });
    expect(response.status()).toBe(401);
  });

  // TC_T7: Không gửi token → 401 Unauthorized
  test("TC_T7: Không gửi token ", async ({ publicRequest }) => {
    const response = await publicRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: 6 },
    });
    expect(response.status()).toBe(401);
  });

  // TC_T8: SQL Injection - Boolean Based
  test("TC_T8: SQL Injection - userId='1 OR 1=1' ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: "1 OR 1=1" },
    });
    expect(response.status()).toBe(400);
  });

  // Bonus: userId không tồn tại nhưng hợp lệ kiểu → trả về mảng rỗng
  test("TC_T9: userId hợp lệ nhưng chưa đặt vé nào ", async ({
    authRequest,
  }) => {
    const response = await authRequest.get(`${BASE_URL}${API_PATH}`, {
      params: { userId: 999999 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBe(0);
  });

  // Bonus: Gửi token sai / hết hạn
  test("TC_T10: Gửi token rác → 401", async ({ publicRequest }) => {
    const response = await publicRequest.get(`${BASE_URL}${API_PATH}`, {
      headers: { Authorization: "Bearer abc123xyz" },
      params: { userId: 6 },
    });
    expect(response.status()).toBe(401);
  });
});
