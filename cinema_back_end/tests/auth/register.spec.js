/** @format */

import { test, expect } from "@playwright/test";

// Giả định baseURL được định nghĩa trong config hoặc biến môi trường
const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /register", () => {
  /**
   * @desc POST /register - TC-R1: Đăng ký thành công với thông tin hợp lệ
   * @goal Status: 200 OK, Body: JSON chứa accessToken và thông tin user
   * @data username: Tự động, password: "12345678" (Đủ dài), fullName: "Register Test"
   */
  test("TC-R1: should register successfully with valid credentials", async ({
    request,
  }) => {
    const uniqueUsername = `test${Date.now()}@reg.com`;

    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: uniqueUsername,
        password: "12345678",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    expect(responseBody).toHaveProperty("accessToken");
    expect(responseBody.user).toHaveProperty("id");
    expect(responseBody.user.username).toBe(uniqueUsername);
  });

  /**
   * @desc POST /register - TC-R2: Đăng ký với username đã tồn tại
   * @goal Status: 400 Bad Request, Body: "Đã tồn tại người dùng, vui lòng chọn tên đăng nhập khác"
   * @data username: "test2@reg.com" (Giả định user này đã tồn tại), password: "12345678", fullName: "Register Test"
   */
  test("TC-R2: should fail with duplicate username", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "test2@reg.com",
        password: "12345678",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);

    const responseText = await response.text();
    expect(responseText).toContain(
      "Đã tồn tại người dùng, vui lòng chọn tên đăng nhập khác"
    );
  });

  /**
   * @desc POST /register - TC-R3: Username rỗng
   * @goal Status: 400 Bad Request, Body: Thông báo lỗi validation
   * @data username: "", password: "12345678", fullName: "Register Test"
   */
  test("TC-R3: should fail with empty username", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "",
        password: "12345678",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc POST /register - TC-R4: Password rỗng
   * @goal Status: 400 Bad Request, Body: Thông báo lỗi validation
   * @data username: "test888@reg.com", password: "", fullName: "Register Test"
   */
  test("TC-R4: should fail with empty password", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "test888@reg.com",
        password: "",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc POST /register - TC-R5: fullName rỗng (Giả định fullName là trường bắt buộc)
   * @goal Status: 400 Bad Request, Body: Thông báo lỗi validation
   * @data username: "test889@reg.com", password: "12345678", fullName: ""
   */
  test("TC-R5: should fail with empty fullName", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "test889@reg.com",
        password: "12345678",
        fullName: "",
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc POST /register - TC-R6: Email (username) sai định dạng (thiếu @)
   * @goal Status: 400 Bad Request, Body: "Email sai định dạng"
   * @data username: "spec231om", password: "12345678", fullName: "Register Test"
   */
  test("TC-R6: should fail with invalid email format", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "spec231om",
        password: "12345678",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);

    const responseText = await response.text();
    expect(responseText).toContain("Email sai định dạng");
  });

  /**
   * @desc POST /register - TC-R7: Password quá ngắn (ví dụ: < 6 ký tự)
   * @goal Status: 400 Bad Request, Body: "Password sai định dạng"
   * @data username: "spec231m@gmail.com", password: "123", fullName: "Register Test"
   */
  test("TC-R7: should fail with password too short", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "spec231m@gmail.com",
        password: "123",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);

    const responseText = await response.text();
    expect(responseText).toContain("Password sai định dạng");
  });
});
