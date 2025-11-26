/** @format */

import { authenticateAndSaveToken } from "../utils/auth-utils.js";

export default async function globalSetup() {
  console.log("BẮT ĐẦU GLOBAL SETUP - Đồng bộ môi trường test");
  console.log("→ Tài khoản cố định: testr1@gmail.com");
  console.log("→ Token lưu tại: ./tests/test_data/authentic.json");

  const { test } = await import("@playwright/test");
  const request = await test.request.newContext();

  await authenticateAndSaveToken(request);
  await request.dispose();

  console.log("HOÀN TẤT! Toàn bộ testcase đã sẵn sàng chạy với token chung");
  console.log("=".repeat(60));
}
