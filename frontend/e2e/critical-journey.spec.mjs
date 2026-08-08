import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const courseId = process.env.E2E_COURSE_ID;
const paidCourseId = process.env.E2E_PAID_COURSE_ID;

test.beforeEach(() => {
  test.skip(
    !email || !password || !courseId,
    "Set E2E_EMAIL, E2E_PASSWORD and E2E_COURSE_ID for a real environment.",
  );
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
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });

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
  if (consoleMessages.length > 0) {
    console.log(`E2E_BROWSER_MESSAGES=${consoleMessages.join(" | ")}`);
  }

  await expect(
    page.getByRole("heading", {
      name: /Kurslarim|Birinchi kursga yoziling!/,
    }),
  ).toBeVisible();
  await dismissOnboarding(page);
}

test("student can sign in, keep session after reload, enroll, learn and return", async ({
  page,
}) => {
  await signIn(page);
  await page.reload();
  await expect(page).not.toHaveURL(/modal=login/);
  await expect(page).toHaveURL(/\/kurslarim/);
  await dismissOnboarding(page);

  await page.goto(`/kurslar/${courseId}`);
  const enroll = page.getByRole("button", { name: "Kursga yozilish" });
  if (await enroll.isVisible().catch(() => false)) {
    const [enrollResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/learning/enroll/${courseId}`) &&
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

  await page.goto(`/organish/${courseId}`);

  await expect(
    page.getByRole("heading", { name: "Bu kursga hali yozilmagansiz" }),
    `E2E_COURSE_ID=${courseId} uchun enrollment yo'q. seed_e2e.py chiqargan ID'ni ishlatayotganingizni tekshiring.`,
  ).toHaveCount(0);
  await expect(page.getByText("Dars yuklanmoqda...")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Kurslarim sahifasiga qaytish" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Lesson" })).toBeVisible();

  await page.goto("/kurslarim");
  await expect(
    page.getByRole("heading", { name: "Kurslarim", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /O'qishni davom ettirish/ }),
  ).toBeVisible();
});

test("paid course reaches checkout before payment confirmation", async ({
  page,
}) => {
  test.skip(!paidCourseId, "Set E2E_PAID_COURSE_ID to exercise checkout.");
  await signIn(page);
  await page.goto(`/kurslar/${paidCourseId}`);
  const checkout = page.getByRole("button", { name: "Kursga yozilish" });
  await expect(checkout).toBeVisible();
  await checkout.click();
  await expect(page).toHaveURL(new RegExp(`/checkout/${paidCourseId}`));
});
