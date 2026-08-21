import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const courseId = process.env.E2E_COURSE_ID;
const paidCourseId = process.env.E2E_PAID_COURSE_ID;
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000";

// OnboardingModal `localStorage["designora-onboarded"] !== "1"` bo'lsa
// ochiladi va `role="dialog"` overlay butun sahifani to'sadi. Playwright
// har testda toza kontekst beradi, shuning uchun login'dan keyin darhol chiqadi.
// Uni yopish ham yetarli emas: closeForNow() flag'ni "1" qilmaydi.
// Shuning uchun flag'ni har sahifa yuklanishidan oldin o'rnatamiz.
const ONBOARDING_DONE_SCRIPT = () => {
  try {
    window.localStorage.setItem("designora-onboarded", "1");
  } catch {
    /* private mode: modal zaxira yo'l bilan yopiladi */
  }
};

// Console, page va HTTP xatolarini butun test davomida yig'amiz.
const pageLogs = new WeakMap();

test.beforeEach(async ({ page }) => {
  test.skip(
    !email || !password || !courseId,
    "Set E2E_EMAIL, E2E_PASSWORD and E2E_COURSE_ID for a real environment."
  );

  await page.addInitScript(ONBOARDING_DONE_SCRIPT);

  const logs = [];
  pageLogs.set(page, logs);

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      logs.push(`${message.type()}: ${message.text()}`);
    }
  });

  page.on("pageerror", (reason) => {
    logs.push(`pageerror: ${reason.message}`);
  });

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

// Agar localStorage ishlamasa, onboarding modalni qo'lda yopamiz.
async function ensureNoOnboardingOverlay(page) {
  const overlay = page.locator(".onboarding-layer");

  if (await overlay.isVisible().catch(() => false)) {
    await page
      .getByRole("button", { name: "Keyinroq davom etish" })
      .click()
      .catch(() => null);
  }

  await expect(overlay).toHaveCount(0, { timeout: 10_000 });
}

// Dashboard yuklanganini faqat h1 orqali tekshiramiz.
async function expectMyCoursesPage(page) {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Salom,|Birinchi kursga yoziling!/,
    })
  ).toBeVisible({ timeout: 20_000 });
}

async function signIn(page) {
  await page.goto("/?modal=login");

  await page.getByPlaceholder("E-pochta").fill(email);
  await page.getByPlaceholder("Parol").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/login") &&
      response.request().method() === "POST"
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
    `Login failed with ${loginResponse.status()}: ${loginBody}`
  ).toBeTruthy();

  const cookies = await page.context().cookies();
  const cookieNames = cookies.map((cookie) => cookie.name);

  console.log(`E2E_COOKIES=${cookieNames.join(",") || "none"}`);

  expect(
    cookieNames,
    `Auth cookie kutilgan edi, olindi: ${cookieNames.join(",") || "none"}`
  ).toContain("access_token");

  await expect(page).toHaveURL(/\/kurslarim/);

  console.log(`E2E_URL_AFTER_LOGIN=${page.url()}`);

  await ensureNoOnboardingOverlay(page);
  await expectMyCoursesPage(page);
}

// Kursga yozilish tugmasi yoki allaqachon yozilgan holatni kutamiz.
async function ensureEnrolled(page, id) {
  await page.goto(`/kurslar/${id}`);
  await ensureNoOnboardingOverlay(page);

  const enroll = page.getByRole("button", { name: "Kursga yozilish" });
  const already = page.getByRole("link", {
    name: /O.qishni davom ettirish/,
  });

  await expect(enroll.or(already).first()).toBeVisible({
    timeout: 20_000,
  });

  if (await enroll.isVisible()) {
    const [enrollResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/learning/enroll/${id}`) &&
          response.request().method() === "POST",
        { timeout: 20_000 }
      ),
      enroll.click(),
    ]);

    const enrollBody = await enrollResponse
      .text()
      .catch(() => "<body unavailable>");

    expect(
      enrollResponse.ok(),
      `Enrollment failed with ${enrollResponse.status()}: ${enrollBody}`
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

  await ensureNoOnboardingOverlay(page);
  await expectMyCoursesPage(page);

  await ensureEnrolled(page, courseId);

  const learnResponse = await page.request.get(
    `${apiUrl}/api/learning/courses/${courseId}`
  );

  const learnRaw = await learnResponse.text();

  expect(
    learnResponse.ok(),
    `GET /api/learning/courses/${courseId} → ${learnResponse.status()}: ${learnRaw}`
  ).toBeTruthy();

  const learn = JSON.parse(learnRaw);

  expect(
    learn.is_enrolled,
    `is_enrolled=false (course_id=${courseId}). seed_e2e.py chiqargan E2E_COURSE_ID'ni ishlating.`
  ).toBe(true);

  expect(learn.total_lessons, "Kursda birorta ham dars yo'q").toBeGreaterThan(
    0
  );

  await page.goto(`/organish/${courseId}`);

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
  await expectMyCoursesPage(page);
});

test("paid course reaches Safibuy before payment confirmation", async ({
  page,
}) => {
  test.skip(!paidCourseId, "Set E2E_PAID_COURSE_ID to exercise Safibuy flow.");

  await signIn(page);
  await page.goto(`/kurslar/${paidCourseId}`);
  await ensureNoOnboardingOverlay(page);

  const safibuyLink = page.getByRole("link", {
    name: "Kursga yozilish",
  });

  await expect(safibuyLink).toBeVisible({
    timeout: 20_000,
  });

  const href = await safibuyLink.getAttribute("href");

  expect(href).toMatch(/^https:\/\/t\.me\/safibuy\?text=/);
  expect(decodeURIComponent(href)).toContain(`Kurs ID: ${paidCourseId}`);
  expect(safibuyLink).toHaveAttribute("target", "_blank");
  expect(safibuyLink).toHaveAttribute("rel", "noreferrer");
});
