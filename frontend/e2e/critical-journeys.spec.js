import { test, expect } from "@playwright/test";

test("public learner journey routes load in a real browser", async ({ page }) => {
  await page.route("**/api/courses", route => route.fulfill({ json: [] }));
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await page.goto("/kurslar");
  await expect(page.locator("#root")).toBeVisible();
  await page.goto("/verify/not-found");
  await expect(page.locator("#root")).toBeVisible();
});

test("protected learning and operations routes never render a blank document", async ({ page }) => {
  for (const path of ["/kurslarim", "/organish/1", "/admin", "/admin/moderation", "/admin/support"]) {
    await page.goto(path);
    await expect(page.locator("#root")).toBeVisible();
    await expect(page.locator("body")).not.toHaveText("");
  }
});
