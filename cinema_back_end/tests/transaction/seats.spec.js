/** @format */
import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";
let accessToken = "";

test.describe("API Tests for GET /api/seats (TC_S1 - TC_S9)", () => {
  test.beforeAll(async ({ request }) => {
    console.log("--- SETUP: Đang đăng nhập với testr1@gmail.com ---");

    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    accessToken = body.accessToken;
    console.log("SETUP: Đã lấy được Token!");
  });

  // TC_S1: HAPPY PATH - LẤY GHẾ THÀNH CÔNG
  test("TC_S1: Lấy danh sách ghế thành công với scheduleId hợp lệ (scheduleId=1)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "1",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // --- DEBUG: In ra xem cấu trúc thực tế là gì nếu vẫn lỗi ---
    console.log("Response Body của TC_S1:", body);

    // SỬA: Kiểm tra trực tiếp body (giả định body là mảng)
    expect(Array.isArray(body)).toBeTruthy(); // Kiểm tra body chính là một mảng
    expect(body.length).toBeGreaterThan(0); // Kiểm tra mảng có phần tử
  });

  // TC_S2: INVALID ID - KHÔNG TỒN TẠI
  test("TC_S2: Lấy danh sách ghế với scheduleId không tồn tại (999)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "999",
      },
    });

    expect(response.status()).toBe(400);
  });

  // TC_S3: INVALID TYPE - SAI KIỂU DỮ LIỆU
  test("TC_S3: Kiểm tra scheduleId sai kiểu dữ liệu (String 'abc')", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "abc",
      },
    });

    expect(response.status()).toBe(400);
  });

  // TC_S4: OVERFLOW - GIÁ TRỊ QUÁ LỚN
  test("TC_S4: Kiểm tra scheduleId vượt quá giới hạn (Overflow)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "99999999",
      },
    });

    expect(response.status()).toBe(400);
  });

  // TC_S5: WHITESPACE - CHỨA KHOẢNG TRẮNG
  test("TC_S5: Kiểm tra scheduleId chứa khoảng trắng (' ')", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: " ",
      },
    });

    expect(response.status()).toBe(400);
  });

  // TC_S6: MISSING PARAM - THIẾU THAM SỐ
  test("TC_S6: Kiểm tra lỗi khi thiếu tham số bắt buộc scheduleId", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {}, // Không truyền tham số nào
    });

    expect(response.status()).toBe(400);
  });

  // TC_S7: BUSINESS LOGIC - SỐ ÂM
  test("TC_S7: Kiểm tra scheduleId là số âm (-1)", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "-1",
      },
    });

    expect(response.status()).toBe(400);
  });

  // TC_S8: SECURITY - KHÔNG CÓ TOKEN
  test("TC_S8: Lấy danh sách mà không có token", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      // Không truyền Header Authorization
      params: {
        scheduleId: "1",
      },
    });

    expect(response.status()).toBe(401);
  });

  // TC_S9: SECURITY - SQL INJECTION
  test("TC_S9: Kiểm tra lỗ hổng SQL Injection", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/seats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        scheduleId: "1 OR 1=1 --",
      },
    });

    expect(response.status()).toBe(400);
  });
});
