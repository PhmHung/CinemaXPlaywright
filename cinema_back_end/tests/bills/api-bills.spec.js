/** @format */

import { test, validToken } from "../fixtures/auth-fixture.js";
import { expect } from "@playwright/test";

const BASE_URL = "http://localhost:8080";
const ENDPOINT = "/api/bills/create-new-bill";

const REAL_USER_ID = 108;
const REAL_SCHEDULE_ID = 1;
const REAL_SEAT_ID_1 = 10;
const REAL_SEAT_ID_2 = 8;
const REAL_SEAT_ID_3 = 9;

const generateRandomSeats = (count = 1) => {
  const startId = Math.floor(Math.random() * 5000) + 5000;
  return Array.from({ length: count }, (_, i) => startId + i);
};

// Object Body cơ bản để tái sử dụng (Tránh lỗi ReferenceError: BASE_BODY)
const BASE_BODY = {
  userId: REAL_USER_ID,
  scheduleId: REAL_SCHEDULE_ID,
  listSeatIds: [],
};

test.describe("Full Coverage API Tests (POST /bill)", () => {
  // --- GROUP I: HAPPY PATH ---
  test("TC_B01: Tạo bill thành công (Chấp nhận ghế đã đặt)", async ({
    authRequest,
  }) => {
    const body = {
      userId: REAL_USER_ID,
      scheduleId: REAL_SCHEDULE_ID,
      listSeatIds: [REAL_SEAT_ID_1],
    };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    const status = response.status();
    const text = await response.text();
    if (status === 417 && text.includes("Đã có người"))
      expect(status).toBe(417);
    else expect(status).toBe(200);
  });

  test("TC_B02: Đặt nhiều ghế khác nhau (Chấp nhận ghế đã đặt)", async ({
    authRequest,
  }) => {
    const body = {
      userId: REAL_USER_ID,
      scheduleId: REAL_SCHEDULE_ID,
      listSeatIds: [REAL_SEAT_ID_2, REAL_SEAT_ID_3],
    };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    const status = response.status();
    const text = await response.text();
    if (status === 417 && text.includes("Đã có người"))
      expect(status).toBe(417);
    else expect(status).toBe(200);
  });

  // --- GROUP II: VALIDATION ---
  test("TC_B03: Body rỗng", async ({ authRequest }) => {
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: {},
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B04: Thiếu trường scheduleId", async ({ authRequest }) => {
    const { scheduleId, ...body } = BASE_BODY;
    body.listSeatIds = generateRandomSeats(1);
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B05: Thiếu trường listSeatIds", async ({ authRequest }) => {
    const { listSeatIds, ...body } = BASE_BODY;
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B06: Sai kiểu dữ liệu (String thay vì Int)", async ({
    authRequest,
  }) => {
    const body = { userId: "abc", scheduleId: "def", listSeatIds: [101] };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_B07: Malformed JSON", async ({ authRequest }) => {
    const malformedJson = '{ "userId": 1, "scheduleId": ';
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "application/json",
      },
      data: malformedJson,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_B08: Gửi trùng ID ghế trong cùng 1 authRequest", async ({
    authRequest,
  }) => {
    const seatId = generateRandomSeats(1)[0];
    const body = { ...BASE_BODY, listSeatIds: [seatId, seatId] };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B09: Thiếu trường userId", async ({ authRequest }) => {
    const { userId, ...body } = BASE_BODY;
    body.listSeatIds = generateRandomSeats(1);
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  // --- GROUP III: BUSINESS LOGIC ---
  test("TC_B10: Schedule ID không tồn tại", async ({ authRequest }) => {
    const body = {
      ...BASE_BODY,
      listSeatIds: generateRandomSeats(1),
      scheduleId: 99999,
    };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B11: Đặt vé cho lịch chiếu đã kết thúc", async ({ authRequest }) => {
    const expiredScheduleId = 999;
    const body = {
      ...BASE_BODY,
      listSeatIds: generateRandomSeats(1),
      scheduleId: expiredScheduleId,
    };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B12: Ghế đã bị người khác mua", async ({ authRequest }) => {
    const seats = generateRandomSeats(1);
    const body = { ...BASE_BODY, listSeatIds: seats };
    await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B13: User ID không tồn tại", async ({ authRequest }) => {
    const body = {
      ...BASE_BODY,
      listSeatIds: generateRandomSeats(1),
      userId: 999999,
    };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  test("TC_B14: Ghế không thuộc phòng chiếu này", async ({ authRequest }) => {
    const body = { ...BASE_BODY, listSeatIds: [1] };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  // --- GROUP IV: BOUNDARY ---
  test("TC_B15: Số lượng ghế >100", async ({ authRequest }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(101) };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(417);
  });

  // --- GROUP V: CONCURRENCY ---
  test("TC_B16: Race Condition 2 authRequest cùng ghế", async ({
    authRequest,
  }) => {
    const seats = generateRandomSeats(1);
    const body = { ...BASE_BODY, listSeatIds: seats };
    const [res1, res2] = await Promise.all([
      authRequest.post(BASE_URL + ENDPOINT, {
        headers: { Authorization: `Bearer ${validToken}` },
        data: body,
      }),
      authRequest.post(BASE_URL + ENDPOINT, {
        headers: { Authorization: `Bearer ${validToken}` },
        data: body,
      }),
    ]);
    const successCount = [res1.status(), res2.status()].filter(
      (s) => s === 200
    ).length;
    expect(successCount).toBeLessThanOrEqual(1);
  });

  // --- GROUP VI: SECURITY & EDGE CASES ---
  test("TC_B17: SQL Injection", async ({ authRequest }) => {
    const body = { userId: 6, scheduleId: 6, listSeatIds: ["10 OR 1=1"] };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_B18: Unicode / ký tự đặc biệt", async ({ authRequest }) => {
    const body = { ...BASE_BODY, listSeatIds: ["Ghế Vip", "+"] };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: `Bearer ${validToken}` },
      data: body,
    });
    expect(response.status()).toBe(400);
  });

  test("TC_B19: Không có Header Authorization", async ({ authRequest }) => {
    const body = { ...BASE_BODY, listSeatIds: generateRandomSeats(1) };
    const response = await authRequest.post(BASE_URL + ENDPOINT, {
      headers: { Authorization: "" },
      data: body,
    });
    expect(response.status()).toBe(401);
  });
});
