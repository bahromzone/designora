import { describe, expect, it } from "vitest";
import { eventsForRequest, PRODUCT_EVENTS } from "./productAnalytics";

describe("product analytics funnel", () => {
  it("keeps the roadmap event contract stable", () => {
    expect(PRODUCT_EVENTS).toContain("signup_completed");
    expect(PRODUCT_EVENTS).toContain("payment_succeeded");
    expect(PRODUCT_EVENTS).toContain("certificate_issued");
  });

  it("maps the critical learner journey to analytics events", () => {
    const cases = [
      ["/api/auth/register", "POST", "before", {}, "signup_started"],
      ["/api/auth/register", "POST", "after", {}, "signup_completed"],
      ["/api/courses/7/detail", "GET", "after", {}, "course_viewed"],
      ["/api/learning/enroll/7", "POST", "after", {}, "enrollment_completed"],
      ["/api/payments/orders/order-1", "GET", "after", { status: "paid" }, "payment_succeeded"],
      ["/api/learning/lessons/9/complete", "POST", "after", {}, "lesson_completed"],
      ["/api/assignments/4/submit", "POST", "after", {}, "assignment_submitted"],
      ["/api/certificates/courses/7/issue", "POST", "after", { id: 3 }, "certificate_issued"],
    ];

    cases.forEach(([path, method, phase, response, expected]) => {
      expect(eventsForRequest(path, method, phase, response).map((event) => event.name)).toContain(expected);
    });
  });

  it("emits every crossed video milestone once per request", () => {
    const names = eventsForRequest(
      "/api/media/lessons/9/progress",
      "PUT",
      "after",
      {},
      { position_seconds: 76, duration_seconds: 100 },
    ).map((event) => event.name);
    expect(names).toEqual(["video_progress_25", "video_progress_50", "video_progress_75"]);
  });
});
