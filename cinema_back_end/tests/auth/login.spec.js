/** @format */

import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /login", () => {
  /**
   * @desc POST /login - Valid credentials (TC-L1)
   * @goal Status 200 OK & returns token
   */
  test("TC-L1: should login successfully with valid credentials", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "hung@example.com",
        password: "123456",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
  });

  /**
   * @desc POST /login - Invalid password (TC-L2)
   * @goal Status 400 Bad Request
   */
  test("TC-L2: should fail with invalid password", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "hung@example.com",
        password: "wrong-password",
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain("Sai email hoặc mật khẩu!");
  });

  /**
   * @desc POST /login - Invalid username (TC-L3)
   * @goal Status 400 Bad Request
   */
  test("TC-L3: should fail with invalid username", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "fail@example.com",
        password: "123456",
      },
    });

    expect(response.status()).toBe(400);
    expect(await response.text()).toContain("Sai email hoặc mật khẩu!");
  });

  /**
   * @desc POST /login - Missing password (empty string) (TC-L4)
   * @goal Status 400 Bad Request
   */
  test("TC-L4: should fail with missing password", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "hung@example.com",
        password: "", // Thiếu password
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc POST /login - Empty username (TC-L5)
   * @goal Status 400 Bad Request
   */
  test("TC-L5: should fail with empty username", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "",
        password: "123456",
      },
    });

    expect(response.status()).toBe(400);
  });

  /**
   * @desc POST /login - Empty body (TC-L6)
   * @goal Status 400 Bad Request
   */
  test("TC-L6: should fail with empty body", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});
