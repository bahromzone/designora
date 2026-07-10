import { describe, expect, it } from "vitest";

import { buildDashboardMetrics } from "./DashboardInsights";

it("builds deadline and progress KPIs", () => {
  const now = new Date("2026-07-10T10:00:00Z");
  const courses = [{ progress_percent: 40 }, { progress_percent: 80 }];
  const assignments = [
    { due_date: "2026-07-09T10:00:00Z", my_submission: null },
    { due_date: "2026-07-12T10:00:00Z", my_submission: null },
    { due_date: null, my_submission: { status: "graded" } },
  ];
  const result = buildDashboardMetrics(courses, assignments, now);
  expect(result.overdue).toHaveLength(1);
  expect(result.dueSoon).toHaveLength(1);
  expect(result.feedback).toHaveLength(1);
  expect(result.average).toBe(60);
});

describe("dashboard empty state", () => {
  it("returns stable zero metrics", () => {
    expect(buildDashboardMetrics([], [])).toMatchObject({ average: 0, open: [] });
  });
});
