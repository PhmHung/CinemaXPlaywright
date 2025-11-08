/** @format */

import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /register", () => {
  /**
   * @desc POST /register - TC-R1: Đăng ký thành công với thông tin hợp lệ
   * @goal Status: 200 OK, Body: JSON chứa accessToken và thông tin user
   * @data username, password, fullName, role:[]
   */
  test("TC-R1: should register successfully with valid credentials (role as empty array)", async ({
    request,
  }) => {
    const uniqueUsername = `testreg1@reg.com`;

    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: uniqueUsername,
        password: "123456",
        fullName: "Register Test",
        role: [],
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    r;
    expect(responseBody).toHaveProperty("accessToken");
    expect(responseBody.user).toHaveProperty("id");
    expect(responseBody.user.username).toBe(uniqueUsername);
  });
});
