import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const courseId = process.env.E2E_COURSE_ID;
const paidCourseId = process.env.E2E_PAID_COURSE_ID;
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000";

// Console/page xatolarini butun test bo'yi yig'amiz. Ilgari listener faqat
// signIn() ichida turardi, shuning uchun login'dan keyingi React xatolari
// hisobotga tushmasdi — aynan shu sababni yashirardi.
const pageLogs = new WeakMap();

test.beforeEach(async ({ page }) => {
  test.skip(
    !email || !password || !courseId,
    "Set E2E_EMAIL, E2E_PASSWORD and E2E_COURSE_ID for a real environment.",
  );

  const logs = [];
  pageLogs.set(page, logs);
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      logs.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (reason) => logs.push(`pageerror: ${reason.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      logs.push(`http ${response.status()}: ${response.url()}`);
    }
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const logs = pageLogs.get(page) ?? [];
  if (testInfo.status !== testInfo.expectedStatus && logs.length > 0) {
    console.log(`E2E_BROWSER_MESSAGES=${logs.join(" | ")}`);
  }
});

async function dismissOnboarding(page) {
  const onboarding = page.getByRole("button", {
    name: "Keyinroq davom etish",
  });
  if (await onboarding.isVisible().catch(() => false)) {
    await onboarding.click();
  }
}

async function signIn(page) {
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

  console.log(`E2E_LOGIN_STATUS=${loginResponse.status()}`);
  console.log(`E2E_LOGIN_URL=${loginResponse.url()}`);
  console.log(`E2E_LOGIN_BODY=${loginBody}`);

  expect(
    loginResponse.ok(),
    `Login failed with ${loginResponse.status()}: ${loginBody}`,
  ).toBeTruthy();

  const cookies = await page.context().cookies();
  const cookieNames = cookies.map((cookie) => cookie.name);
  console.log(`E2E_COOKIES=${cookieNames.join(",") || "none"}`);
  expect(
    cookieNames,
    `Auth cookie kutilgan edi, olindi: ${cookieNames.join(",") || "none"}`,
  ).toContain("access_token");

  await expect(page).toHaveURL(/\/kurslarim/);
  console.log(`E2E_URL_AFTER_LOGIN=${page.url()}`);

  await expect(
    page.getByRole("heading", {
      name: /Kurslarim|Birinchi kursga yoziling!|Salom,/,
    }),
  ).toBeVisible();
  await dismissOnboarding(page);
}

// Ilgari bu yerda `if (await enroll.isVisible())` bor edi. goto()'dan keyin
// sahifa hali "Kurs yuklanmoqda..." holatida bo'lgani uchun isVisible()
// darhol false qaytarardi va butun enroll bloki JIMGINA tashlab ketilardi.
async function ensureEnrolled(page, id) {
  await page.goto(`/kurslar/${id}`);

  const enroll = page.getByRole("button", { name: "Kursga yozilish" });
  const already = page.getByRole("link", { name: /O.qishni davom ettirish/ });

  // Ikki holatdan birini KUTAMIZ: yozilish tugmasi yoki allaqachon yozilgan.
  await expect(enroll.or(already).first()).toBeVisible({ timeout: 20_000 });

  if (await enroll.isVisible()) {
    const [enrollResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/learning/enroll/${id}`) &&
          response.request().method() === "POST",
      ),
      enroll.click(),
    ]);
    const enrollBody = await enrollResponse
      .text()
      .catch(() => "<body unavailable>");
    expect(
      enrollResponse.ok(),
      `Enrollment failed with ${enrollResponse.status()}: ${enrollBody}`,
    ).toBeTruthy();
  }
}

test("student can sign in, keep session after reload, enroll, learn and return", async ({
  page,
}) => {
  await signIn(page);
  await page.reload();
  await expect(page).not.toHaveURL(/modal=login/);
  await expect(page).toHaveURL(/\/kurslarim/);
  await dismissOnboarding(page);

  await ensureEnrolled(page, courseId);

  // UI'ni tekshirishdan oldin API haqiqatini tasdiqlaymiz. Shunda xato
  // "link topilmadi" emas, aniq sabab (404 / 401 / is_enrolled=false) bo'ladi.
  const learnResponse = await page.request.get(
    `${apiUrl}/api/learning/courses/${courseId}`,
  );
  const learnRaw = await learnResponse.text();
  expect(
    learnResponse.ok(),
    `GET /api/learning/courses/${courseId} → ${learnResponse.status()}: ${learnRaw}`,
  ).toBeTruthy();

  const learn = JSON.parse(learnRaw);
  expect(
    learn.is_enrolled,
    `is_enrolled=false (course_id=${courseId}). seed_e2e.py chiqargan E2E_COURSE_ID'ni ishlating.`,
  ).toBe(true);
  expect(learn.total_lessons, "Kursda birorta ham dars yo'q").toBeGreaterThan(0);

  await page.goto(`/organish/${courseId}`);

  // Salbiy tekshiruvlar endi bo'sh sahifada ham "o'tib ketmaydi", chunki
  // LearnPage har bir holatni aniq testid bilan render qiladi.
  await expect(page.getByTestId("learn-not-enrolled")).toHaveCount(0);
  await expect(page.getByTestId("learn-error")).toHaveCount(0);
  await expect(page.getByTestId("learn-empty")).toHaveCount(0);
  await expect(page.getByTestId("learn-unauthenticated")).toHaveCount(0);

  await expect(page.getByTestId("learn-ready")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("back-to-my-courses")).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Lesson" })).toBeVisible();

  await page.goto("/kurslarim");
  await expect(
    page.getByRole("heading", { name: "Kurslarim", exact: true }),
  ).toBeVisible({ timeout: 20_000 });
});

test("paid course reaches checkout before payment confirmation", async ({
  page,
}) => {
  test.skip(!paidCourseId, "Set E2E_PAID_COURSE_ID to exercise checkout.");
  await signIn(page);
  await page.goto(`/kurslar/${paidCourseId}`);
  const checkout = page.getByRole("button", { name: "Kursga yozilish" });
  await expect(checkout).toBeVisible({ timeout: 20_000 });
  await checkout.click();
  await expect(page).toHaveURL(new RegExp(`/checkout/${paidCourseId}`));
});
