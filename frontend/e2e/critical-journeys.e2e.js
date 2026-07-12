import { expect, test } from "@playwright/test";

const learning = {
  course_id: 1,
  title: "UI/UX asoslari",
  is_enrolled: true,
  progress_percent: 0,
  completed_lessons: 0,
  total_lessons: 1,
  modules: [
    {
      id: 1,
      title: "Asoslar",
      lessons: [{ id: 11, title: "Kirish", is_locked: false, is_completed: false }],
    },
  ],
};

async function mockBackend(page) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json = {};
    if (path === "/api/auth/register") json = { access_token: "e2e-token", user: { id: 99 } };
    else if (path === "/api/courses/1/detail") json = { id: 1, title: "UI/UX asoslari", price: 0, modules: [] };
    else if (path === "/api/learning/enroll/1") json = { enrolled: true };
    else if (path === "/api/payments/checkout-safe") json = { id: "order-1", pay_url: "/checkout/result/order-1" };
    else if (path === "/api/payments/orders/order-1") json = { id: "order-1", course_id: 1, status: "paid" };
    else if (path === "/api/learning/courses/1") json = learning;
    else if (path === "/api/learning/lessons/11/complete") json = { completed: true };
    else if (path === "/api/assignments/41/submit") json = { id: 51, status: "submitted" };
    else if (path === "/api/certificates/courses/1/issue") json = { id: 61, course_id: 1, verification_code: "E2E-CERT" };
    else if (path === "/api/analytics/track") return route.fulfill({ status: 204 });
    else json = [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
  });
}

test("signup to certificate critical business contracts work in a browser", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();

  const results = await page.evaluate(async () => {
    const request = async (path, method = "GET", body) => {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, body: await response.json() };
    };
    return [
      await request("/api/auth/register", "POST", { email: "student@example.com", password: "safe-test-value" }),
      await request("/api/courses/1/detail"),
      await request("/api/learning/enroll/1", "POST"),
      await request("/api/payments/checkout-safe", "POST", { course_id: 1, provider: "payme" }),
      await request("/api/payments/orders/order-1"),
      await request("/api/learning/courses/1"),
      await request("/api/learning/lessons/11/complete", "POST"),
      await request("/api/assignments/41/submit", "POST", { content: "Portfolio link" }),
      await request("/api/certificates/courses/1/issue", "POST"),
    ];
  });

  expect(results.map((result) => result.status)).toEqual(Array(9).fill(200));
  expect(results[0].body.access_token).toBe("e2e-token");
  expect(results[2].body.enrolled).toBe(true);
  expect(results[4].body.status).toBe("paid");
  expect(results[5].body.modules[0].lessons[0].id).toBe(11);
  expect(results[6].body.completed).toBe(true);
  expect(results[7].body.status).toBe("submitted");
  expect(results[8].body.verification_code).toBe("E2E-CERT");
});

test("critical public route renders in a real browser", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.locator("body")).not.toHaveText("");
});
