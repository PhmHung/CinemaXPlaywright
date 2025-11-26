/** @format */

import { test } from "../fixtures/auth-fixture.js";
import { expect } from "@playwright/test";

const BASE_URL = "http://localhost:8080";
const ENDPOINT = "/api/movies/showing";

test.describe("Phim Đang Chiếu API Tests (GET /api/movies/showing)", () => {
  // GROUP 1: HAPPY PATH
  test("TC_M01: Gọi API không cần token", async ({ publicRequest }) => {
    const response = await publicRequest.get(`${BASE_URL}${ENDPOINT}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("TC_M02: Gọi API khi có token hợp lệ", async ({ authRequest }) => {
    const response = await authRequest.get(`${BASE_URL}${ENDPOINT}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("TC_M03: Gửi param không hợp lệ (vẫn trả về danh sách)", async ({
    publicRequest,
  }) => {
    const response = await publicRequest.get(
      `${BASE_URL}${ENDPOINT}?abc=xyz&page=-1`
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("TC_M04: Kiểm tra CORS headers", async ({ publicRequest }) => {
    const response = await publicRequest.get(`${BASE_URL}${ENDPOINT}`, {
      headers: { Origin: "http://another-frontend.com" },
    });
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const allowOrigin = headers["access-control-allow-origin"] || "";
    expect(allowOrigin).not.toBe("");
    expect(allowOrigin).toBe("*"); // hoặc domain cụ thể nếu backend cấu hình
  });

  // GROUP 2: NEGATIVE / EDGE CASE
  test("TC_M05: Gửi sai method (POST thay vì GET)", async ({
    publicRequest,
  }) => {
    const response = await publicRequest.post(`${BASE_URL}${ENDPOINT}`);
    expect([405, 400, 404]).toContain(response.status());
  });

  test("TC_M06: Endpoint sai chính tả", async ({ publicRequest }) => {
    const response = await publicRequest.get(`${BASE_URL}/api/movies/showwing`);
    expect(response.status()).toBe(404);
  });

  test("TC_M07: Gửi token sai định dạng", async ({ publicRequest }) => {
    // Dùng context có token sai
    const response = await publicRequest.fetch(`${BASE_URL}${ENDPOINT}`, {
      headers: { Authorization: "Bearer abc123xyz" },
    });

    // Vì API public → backend không kiểm tra token → vẫn 200
    // Nếu backend có middleware reject token sai → 401
    expect([200, 401]).toContain(response.status());
  });

  test("TC_M08: Kiểm tra phản hồi server (Response Time < 2000ms)", async ({
    publicRequest,
  }) => {
    const start = Date.now();
    const response = await publicRequest.get(`${BASE_URL}${ENDPOINT}`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(2000);
    console.log(`Request duration: ${duration}ms`);
  });
});
