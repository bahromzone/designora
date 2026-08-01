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

async function signIn(page) {
  await page.goto("/?modal=login");
  await page.getByPlaceholder("E-pochta").fill(email);
  await page.getByPlaceholder("Parol").fill(password);
  await page.getByRole("button", { name: "KIRISH", exact: true }).click();
  await expect(page).not.toHaveURL(/modal=login/);
}

test("student can sign in, enroll, open a lesson and return to dashboard", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/kurslar/${courseId}`);

  const enroll = page.getByRole("button", { name: "Kursga yozilish" });
  if (await enroll.isVisible()) await enroll.click();

  await page.goto(`/organish/${courseId}`);
  await expect(page.getByText(/Dars|Lesson/).first()).toBeVisible();
  await page.goto("/kurslarim");
  await expect(page.getByText("Shaxsiy kabinet")).toBeVisible();
  await expect(page.getByRole("link", { name: /Darsni ochish/ })).toBeVisible();
});

test("paid course reaches checkout before payment confirmation", async ({ page }) => {
  test.skip(!paidCourseId, "Set E2E_PAID_COURSE_ID to exercise checkout.");
  await signIn(page);
  await page.goto(`/kurslar/${paidCourseId}`);
  const checkout = page.getByRole("button", { name: "Kursga yozilish" });
  await expect(checkout).toBeVisible();
  await checkout.click();
  await expect(page).toHaveURL(new RegExp(`/checkout/${paidCourseId}`));
});
