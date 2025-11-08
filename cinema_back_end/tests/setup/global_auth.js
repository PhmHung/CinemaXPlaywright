/** @format */
import { authenticateAndSaveToken } from "../utils/auth-utils.js";
import { request as playwrightRequest } from "@playwright/test";
export default async function globalSetup(config) {
  console.log("Bắt đầu Global Setup...");

  const request = await playwrightRequest.newContext(config.use);
  await authenticateAndSaveToken(request);
  await request.dispose();
  console.log("Kết thúc Global Setup.");
}
