import { defineConfig, devices } from "@playwright/test";

import { AUTH_FILE } from "./auth-file.mjs";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "line",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.mjs$/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Critical journey ATAYLAB storageState ishlatmaydi: login va reload'dan
    // keyin cookie session'ning saqlanishi uning tekshirish predmeti.
    {
      name: "journey",
      testMatch: /critical-journey\.spec\.mjs$/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Layout gate esa login oqimini tekshirmaydi, faqat geometriyani. Shuning
    // uchun tayyor session bilan ochiladi va rate limitga urilmaydi.
    {
      name: "layout",
      testMatch: /layout-regression\.spec\.mjs$/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
    },
  ],
});
