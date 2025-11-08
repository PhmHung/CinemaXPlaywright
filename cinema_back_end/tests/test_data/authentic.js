/** @format */

import * as fs from "fs/promises";

const BASE_URL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";
const LOGIN_USER = {
  username: "hung@example.com",
  password: "123456",
};

/**
 * @desc Đăng nhập, lấy token và lưu token vào file JSON.
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function authenticateAndSaveToken(request) {
  console.log(`\nĐang đăng nhập bằng tài khoản: ${LOGIN_USER.username}...`);

  const loginResponse = await request.post(`${BASE_URL}/login`, {
    data: LOGIN_USER,
  });

  if (loginResponse.status() !== 200) {
    const errorBody = await loginResponse.text();
    throw new Error(
      `Đăng nhập thất bại (Status: ${loginResponse.status()}). Chi tiết: ${errorBody}`
    );
  }

  const loginBody = await loginResponse.json();
  const accessToken = loginBody.accessToken;

  if (!accessToken) {
    throw new Error("Phản hồi đăng nhập thành công nhưng thiếu accessToken.");
  }

  const authData = {
    accessToken: accessToken,
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(authData, null, 2));

  console.log(`Token đã được lưu thành công vào file: ${TOKEN_FILE_PATH}`);
}
