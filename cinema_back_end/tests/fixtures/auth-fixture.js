/** @format */

// tests/fixtures/auth-fixture.js
import { test as base } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

// ĐỌC TOKEN ĐỒNG BỘ TỪ FILE (CHỈ 1 LẦN)
const tokenData = JSON.parse(
  readFileSync(join(__dirname, "../test_data/authentic.json"), "utf-8")
);
export const validToken = tokenData.accessToken;

// ĐÚNG CÁCH DÙNG APIRequestContext TRONG FIXTURE
export const test = base.extend({
  authRequest: async ({ playwright }, use) => {
    // Dùng playwright để tạo context mới – ĐÚNG 100%!
    const context = await playwright.request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${validToken}`,
      },
    });
    await use(context);
    await context.dispose();
  },
  publicRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext();
    await use(context);
    await context.dispose();
  },
});
