/** @format */

// File: tests/utils/auth-utils.js

// Import module fs của Node.js để tương tác với file
import * as fs from "fs/promises";

const BASE_URL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";
const LOGIN_USER = {
  username: "hung@example.com",
  password: "123456",
};

/**
 * @desc Đăng nhập vào API, lấy accessToken và lưu thông tin xác thực vào file JSON.
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function authenticateAndSaveToken(request) {
  console.log(
    `\n[AUTH SETUP] Đang đăng nhập bằng tài khoản: ${LOGIN_USER.username}...`
  );

  const loginResponse = await request.post(`${BASE_URL}/login`, {
    data: LOGIN_USER,
  });

  if (loginResponse.status() !== 200) {
    const errorBody = await loginResponse.text();
    throw new Error(
      `[AUTH ERROR] Đăng nhập thất bại (Status: ${loginResponse.status()}). Chi tiết: ${errorBody}`
    );
  }

  const loginBody = await loginResponse.json();
  const accessToken = loginBody.accessToken;

  if (!accessToken) {
    throw new Error(
      "[AUTH ERROR] Phản hồi đăng nhập thành công nhưng thiếu accessToken."
    );
  }

  const authData = {
    accessToken: accessToken,
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(authData, null, 2));

  console.log(
    `[AUTH SETUP] Token đã được lấy và lưu thành công vào file: ${TOKEN_FILE_PATH}`
  );
}
