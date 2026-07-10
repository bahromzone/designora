import { expect, it } from "vitest";

import {
  buildDashboardMetrics,
  createImageAnnotation,
  normalizeTimestamp,
} from "./roadmapMetrics";

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
  expect(buildDashboardMetrics([], [])).toMatchObject({ average: 0, open: [] });
});

it("normalizes timecodes and image coordinates", () => {
  expect(normalizeTimestamp("01:13")).toBe(73);
  expect(normalizeTimestamp("1:02:03")).toBe(3723);
  expect(normalizeTimestamp("bad")).toBe(0);
  const event = {
    clientX: 60,
    clientY: 70,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 }),
    },
  };
  expect(createImageAnnotation(event, "  contrast  ")).toMatchObject({
    x: 50,
    y: 50,
    note: "contrast",
  });
});
