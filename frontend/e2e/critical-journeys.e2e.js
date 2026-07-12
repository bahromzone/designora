import { expect, test } from "@playwright/test";

const course = {
  id: 1,
  title: "UI/UX asoslari",
  subtitle: "Real loyiha bilan o‘rganing",
  description: "Boshlang‘ich dizayn kursi",
  category: "UI/UX",
  price: 0,
  modules: [{ id: 1, title: "Asoslar", lessons: [{ id: 11, title: "Kirish", duration_seconds: 120 }] }],
};

const learning = (enrolled = true, complete = false) => ({
  ...course,
  course_id: 1,
  is_enrolled: enrolled,
  progress_percent: complete ? 100 : 0,
  completed_lessons: complete ? 1 : 0,
  total_lessons: 1,
  modules: [
    {
      id: 1,
      title: "Asoslar",
      lessons: [
        {
          id: 11,
          title: "Kirish",
          description: "Birinchi dars",
          is_locked: false,
          is_completed: complete,
          duration_seconds: 120,
          resources: [],
        },
      ],
    },
  ],
});

async function mockBackend(page) {
  let enrolled = false;
  let complete = false;
  await page.addInitScript(() => {
    localStorage.setItem("designora-auth-token", "e2e-token");
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    let json = {};

    if (path === "/api/analytics/track") return route.fulfill({ status: 204 });
    if (path === "/api/profile/me") json = { id: 99, username: "e2e-student", full_name: "E2E Student" };
    else if (path === "/api/auth/register") json = { access_token: "e2e-token", user: { id: 99 } };
    else if (path === "/api/courses/1/detail") json = course;
    else if (path === "/api/learning/enroll/1" && method === "POST") {
      enrolled = true;
      json = { enrolled: true };
    } else if (path === "/api/learning/courses/1") json = learning(enrolled, complete);
    else if (path === "/api/learning/lessons/11/complete" && method === "POST") {
      complete = true;
      json = { completed: true };
    } else if (path === "/api/payments/checkout-safe") json = { id: "order-1", pay_url: "/tolov/natija/order-1" };
    else if (path === "/api/payments/orders/order-1") json = { id: "order-1", course_id: 1, status: "paid" };
    else if (path === "/api/assignments/41/submit") json = { id: 51, status: "submitted" };
    else if (path === "/api/certificates/courses/1/issue")
      json = { id: 61, course_id: 1, verification_code: "E2E-CERT" };
    else if (path === "/api/auth/issue-refresh") json = {};
    else json = [];

    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
  });
}

test("signup to certificate business flow is tracked end to end", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/");

  const statuses = await page.evaluate(async () => {
    const call = async (path, method = "GET", body) => {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return response.status;
    };

    return Promise.all([
      call("/api/auth/register", "POST", { email: "redacted@example.com", password: "redacted" }),
      call("/api/courses/1/detail"),
      call("/api/learning/enroll/1", "POST"),
      call("/api/learning/courses/1"),
      call("/api/payments/checkout-safe", "POST", { course_id: 1, provider: "payme" }),
      call("/api/payments/orders/order-1"),
      call("/api/learning/lessons/11/complete", "POST"),
      call("/api/assignments/41/submit", "POST", { content: "redacted" }),
      call("/api/certificates/courses/1/issue", "POST"),
    ]);
  });
  expect(statuses.every((status) => status === 200)).toBe(true);

  await expect
    .poll(() => page.evaluate(() => window.__designoraAnalyticsEvents?.map((event) => event.name) || []))
    .toEqual(
      expect.arrayContaining([
        "landing_page_view",
        "signup_started",
        "signup_completed",
        "course_viewed",
        "enrollment_started",
        "enrollment_completed",
        "lesson_started",
        "lesson_completed",
        "checkout_started",
        "payment_succeeded",
        "assignment_started",
        "assignment_submitted",
        "certificate_issued",
      ]),
    );

  const payloads = await page.evaluate(() => window.__designoraAnalyticsEvents);
  expect(JSON.stringify(payloads)).not.toContain("redacted@example.com");
  expect(JSON.stringify(payloads)).not.toContain("password");
});

test("public and protected routes never render blank", async ({ page }) => {
  await mockBackend(page);
  for (const path of ["/", "/kurslar", "/kurslarim", "/organish/1", "/verify/not-found"]) {
    await page.goto(path);
    await expect(page.locator("#root")).toBeVisible();
    await expect(page.locator("body")).not.toHaveText("");
  }
});
