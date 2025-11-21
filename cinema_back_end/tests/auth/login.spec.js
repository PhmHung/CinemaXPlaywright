/** @format */
import { test, expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /login (Khớp 100% Data Báo Cáo)", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${baseURL}/register`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
        fullName: "Register Test",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });
    if (res.status() === 200) {
      console.log("SETUP: Đã tạo mới tài khoản testr1@gmail.com");
    } else {
      console.log(
        "SETUP: Tài khoản testr1@gmail.com đã có sẵn, chuyển sang test login."
      );
    }
  });

  //TC_L1: ĐÚNG TÀI KHOẢN, ĐÚNG MẬT KHẨU
  test("TC_L1: Kiểm tra đăng nhập với tài khoản mật khẩu đúng", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "123456",
      },
    });
    expect(response.status()).toBe(200);
  });

  //TC_L2: SAI MẬT KHẨU
  test("TC_L2: Kiểm tra đăng nhập với mật khẩu sai", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "testr1@gmail.com",
        password: "12345",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  //TC_L3: SAI TÀI KHOẢN
  test("TC_L3: Kiểm tra đăng nhập với tài khoản sai", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "fail@example.com",
        password: "123456",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  //TC_L4: SAI KIỂU DỮ LIỆU PASSWORD
  test("TC_L4: Kiểm tra đăng nhập với sai kiểu dữ liệu password", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "fail@example.com",
        password: 123456,
      },
    });
    expect(response.status()).toBe(400);
  });

  const numberAsString = "99999";
  const numberAsNumber = 99999;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${baseURL}/register`, {
      data: {
        username: numberAsString,
        password: "123456",
        fullName: "Number Test User",
        roles: [{ name: "ROLE_CLIENT" }],
      },
    });

    if (res.status() === 200) {
      console.log("SETUP: Đã tạo user chuỗi '99999' thành công.");
    }
  });

  // TC_L5: SAI KIỂU DỮ LIỆU USERNAME
  test("TC_L5: Kiểm tra đăng nhập với sai kiểu dữ liệu username", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: numberAsNumber,
        password: "123456",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L6: THIẾU PASSWORD
  test("TC_L6: Kiểm tra thiếu trường password", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "hung@example.com",
        password: "",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L7: THIẾU USERNAME
  test("TC_L7: Kiểm tra thiếu trường username", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "",
        password: "123456",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_L8: BODY RỖNG
  test("TC_L8: Kiểm tra body rỗng", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {},
    });
    expect(response.status()).toBe(400);
  });

  //TC_L9: TÀI KHOẢN CHƯA ĐĂNG KÝ
  test("TC_L9: Kiểm tra đăng nhập vào tài khoản chưa được đăng ký", async ({
    request,
  }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "New@example.com",
        password: "123456",
      },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("TC_L10: Kiểm tra SQL Injection", async ({ request }) => {
    const response = await request.post(`${baseURL}/login`, {
      data: {
        username: "' OR '1' = '1",
        password: 123456,
      },
    });
    expect(response.status()).not.toBe(200);
  });
});
