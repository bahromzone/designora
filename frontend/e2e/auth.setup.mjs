import fs from "node:fs";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

import { AUTH_FILE } from "./auth-file.mjs";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

// Nega bu fayl bor: `/api/auth/login` da `5 per 1 minute` rate limit bor va u
// IP bo'yicha sanaydi. Compose'da barcha test bitta IP'dan kelgani uchun har
// testda UI orqali login qilish beshinchisidan keyin 429 beradi.
//
// Limitni E2E muhitida ko'tarish ham yo'l edi, lekin u noto'g'ri yo'l: brute
// force himoyasi aynan shu gate ostida ishlashi kerak. Shuning uchun login
// BIR MARTA bajariladi va session storageState orqali ulashiladi.
setup("authenticate once and share the session", async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Creds yo'q bo'lsa ham fayl yozilishi SHART: aks holda unga bog'liq
  // project kontekst yaratayotganda ENOENT bilan yiqiladi. Testlar o'z skip
  // guard'i bilan o'tkazib yuboriladi.
  if (!email || !password) {
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto("/?modal=login");
  await page.getByPlaceholder("E-pochta").fill(email);
  await page.getByPlaceholder("Parol").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "KIRISH", exact: true }).click();
  const loginResponse = await loginResponsePromise;
  const loginBody = await loginResponse
    .text()
    .catch(() => "<body unavailable after navigation>");

  expect(
    loginResponse.ok(),
    `Login failed with ${loginResponse.status()}: ${loginBody}`,
  ).toBeTruthy();

  const cookieNames = (await page.context().cookies()).map((row) => row.name);
  expect(
    cookieNames,
    `Auth cookie kutilgan edi, olindi: ${cookieNames.join(",") || "none"}`,
  ).toContain("access_token");

  // Onboarding flag'i ATAYLAB saqlanmaydi: layout testi aynan shu modalni
  // tekshiradi, shuning uchun u har testda toza holatda ochilishi kerak.
  await page.context().storageState({ path: AUTH_FILE });
});
