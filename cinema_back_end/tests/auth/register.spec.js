/** @format */
import { test } from "../fixtures/auth-fixture.js";
import { expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /register (TC_R1 - TC_R8)", () => {
  //TC_R1: HAPPY PATH
  test("TC_R1: Đăng ký thành công (Happy Path)", async ({ request }) => {
    const uniqueEmail = `test_auto_${Date.now()}@gmail.com`;

    console.log("Đang test với email:", uniqueEmail);
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: uniqueEmail,
        password: "123456",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    expect(response.status()).toBe(200);

    const text = await response.text();
    console.log("Server phản hồi:", text);
  });

  //TC_R2: SAI ĐỊNH DẠNG EMAIL
  test("TC_R2: Đăng ký với username sai định dạng", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr2_${Date.now()}@gmail`,
        password: "123456",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    expect(response.status()).toBe(400);
    const text = await response.text();
    expect(text).toContain("Email sai định dạng");
  });

  //TC_R3: PASSWORD NGẮN
  test("TC_R3: Đăng ký với mật khẩu ít hơn 6 ký tự", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr3_${Date.now()}@gmail.com`,
        password: "123",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    expect(response.status()).toBe(400);
    const text = await response.text();
    expect(text).toContain("Password sai định dạng");
  });

  //TC_R4: ROLE RỖNG
  test("TC_R4: Đăng ký với Role là rỗng (Empty Array)", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr4_${Date.now()}@gmail.com`,
        password: "123456",
        fullName: "Register Test",
        roles: [],
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_R5: THIẾU USERNAME (Chuỗi rỗng)
  test("TC_R5: Đăng ký thiếu username (để trống)", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "",
        password: "123456",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_R6: THIẾU PASSWORD (Chuỗi rỗng)
  test("TC_R6: Đăng ký thiếu password (để trống)", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr6_${Date.now()}@gmail.com`,
        password: "",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_R7: THIẾU FULLNAME (Chuỗi rỗng)
  test("TC_R7: Đăng ký thiếu fullname (để trống)", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr7_${Date.now()}@gmail.com`,
        password: "123456",
        fullName: "",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_R8: THIẾU TRƯỜNG ROLE (Không gửi field roles)
  test("TC_R8: Đăng ký thiếu field role trong payload", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: `testr8_${Date.now()}@gmail.com`,
        password: "123456",
        fullName: "Register Test",
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_R9: ĐĂNG KÝ VỚI USERNAME ĐÃ TỒN TẠI
  test("TC_R9: Đăng ký với username đã tồn tại (Duplicate Check)", async ({
    request,
  }) => {
    const emailDaTonTai = `duplicate_${Date.now()}@gmail.com`;

    const firstResponse = await request.post(`${baseURL}/register`, {
      data: {
        username: emailDaTonTai,
        password: "123456",
        fullName: "User Goc",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    expect(firstResponse.status()).toBe(200);

    const secondResponse = await request.post(`${baseURL}/register`, {
      data: {
        username: emailDaTonTai,
        password: "123456",
        fullName: "User Copy",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    expect(secondResponse.status()).toBe(400);

    const text = await secondResponse.text();
    console.log("TC_R9 Response:", text);
  });

  //TC_R10: KIỂM TRA SQL INJECTION
  test("TC_R10: Kiểm tra SQL Injection", async ({ request }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "test_sqli' OR '1'='1",
        password: "123456",
        fullName: "Test SQL Injection ' -- ",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    expect(response.status()).toBe(400);

    const text = await response.text();
    console.log("TC_R10 Response:", text);
  });

  //TC_R11: KIỂM TRA KÝ TỰ ĐẶC BIỆT (SPACE)
  test("TC_R11: Kiểm tra ký tự đặc biệt với username (ký tự khoảng trắng)", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/register`, {
      data: {
        username: "   ",
        password: "123",
        fullName: "Register Test 11",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    expect(response.status()).toBe(400);
    const text = await response.text();
    console.log("TC_R11 Response:", text);
  });
});
