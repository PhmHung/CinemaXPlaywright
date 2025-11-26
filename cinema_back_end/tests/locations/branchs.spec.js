/** @format */
import { test, validToken } from "../fixtures/auth-fixture.js";
import { expect } from "@playwright/test";

const baseURL = "http://localhost:8080";

test.describe("API Tests for POST /api/branches (TC_B1 - TC_B11)", () => {
  //TC_B1: HAPPY PATH - CÓ LỊCH CHIẾU
  test("TC_B1: Lấy danh sách nhánh có lịch chiếu (movieId=1)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: 7,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  //TC_B2: HAPPY PATH - KHÔNG CÓ LỊCH CHIẾU
  test("TC_B2: Lấy danh sách nhánh KHÔNG có lịch chiếu", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: 3,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  //TC_B3: INVALID GET - ID KHÔNG TỒN TẠI
  test("TC_B3: Lấy danh sách với movieId không tồn tại (movieId=99)", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: 99,
      },
    });

    expect(response.status()).toBe(200);
  });

  //TC_B4: INVALID TYPE - SAI KIỂU DỮ LIỆU
  test("TC_B4: Kiểm tra movieId sai kiểu (String 'abc')", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: "abc",
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_B5: MISSING GET - THIẾU MOVIEID
  test("TC_B5: Kiểm tra body rỗng (Thiếu movieId)", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {},
    });

    expect(response.status()).toBe(400);
  });

  //TC_B6: TYPO PARAM - SAI TÊN THAM SỐ
  test("TC_B6: Kiểm tra sai tên tham số (movie_Id)", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movie_Id: "7",
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_B7: BUSINESS LOGIC - SỐ ÂM
  test("TC_B7: Kiểm tra movieId là số âm (-1)", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: -1,
      },
    });

    expect(response.status()).toBe(400);
  });

  //TC_B8: SECURITY - KHÔNG DÙNG TOKEN
  test("TC_B8: Truy cập không sử dụng Token", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      params: {
        movieId: 1,
      },
    });

    expect(response.status()).toBe(401);
  });

  //TC_B9: SECURITY - SQL INJECTION
  test("TC_B9: Kiểm tra SQL Injection", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: "1 OR 1=1",
      },
    });
    expect(response.status()).toBe(400);
  });

  //TC_B10: EDGE CASE - MAX INTEGER
  test("TC_B10: Kiểm tra movieId là số cực lớn", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: 9999999999,
      },
    });

    expect(response.status()).not.toBe(500);
  });

  //TC_B11: EDGE CASE - KHOẢNG TRẮNG
  test("TC_B11: Kiểm tra movieId chứa khoảng trắng ('  ')", async ({
    request,
  }) => {
    const response = await request.get(`${baseURL}/api/branches`, {
      headers: { Authorization: `Bearer ${validToken}` },
      params: {
        movieId: "  ",
      },
    });
    expect(response.status()).toBe(400);
  });
});
