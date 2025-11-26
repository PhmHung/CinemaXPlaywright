/** @format */

import * as fs from "fs/promises";

const BASE_URL = "http://localhost:8080";
const TOKEN_FILE_PATH = "./tests/test_data/authentic.json";

const FIXED_USER = {
  username: "testr1@gmail.com",
  password: "123456",
  fullName: "Fixed Test User",
  roles: [{ name: "ROLE_CLIENT" }],
};

export async function authenticateAndSaveToken(request) {
  try {
    await fs.access(TOKEN_FILE_PATH);
    const data = JSON.parse(await fs.readFile(TOKEN_FILE_PATH, "utf-8"));
    if (
      data.accessToken &&
      Date.now() - new Date(data.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    ) {
      console.log("Token hợp lệ đã tồn tại → Bỏ qua đăng nhập");
      return;
    }
  } catch {}

  console.log("Tạo/Đăng nhập user cố định:", FIXED_USER.username);

  // Đăng ký (nếu đã tồn tại → backend trả 400 → vẫn OK)
  await request.post(`${BASE_URL}/register`, { data: FIXED_USER });

  // Đăng nhập lấy token
  const loginRes = await request.post(`${BASE_URL}/login`, {
    data: { username: FIXED_USER.username, password: FIXED_USER.password },
  });

  if (!loginRes.ok()) throw new Error("Login thất bại");

  const { accessToken } = await loginRes.json();

  const authData = {
    accessToken,
    username: FIXED_USER.username,
    timestamp: new Date().toISOString(),
    note: "Token cố định cho toàn bộ test suite",
  };

  await fs.mkdir("./tests/test_data", { recursive: true });
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(authData, null, 2));

  console.log("Token đã lưu thành công → ./tests/test_data/authentic.json");
}
