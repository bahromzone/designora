import { expect, it } from "vitest";

import { createImageAnnotation, normalizeTimestamp } from "./InstructorReviewPage";

it("normalizes instructor video timecodes", () => {
  expect(normalizeTimestamp("01:13")).toBe(73);
  expect(normalizeTimestamp("1:02:03")).toBe(3723);
  expect(normalizeTimestamp("bad")).toBe(0);
});

it("creates percentage based image annotations", () => {
  const event = {
    clientX: 60,
    clientY: 70,
    currentTarget: { getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 }) },
  };
  expect(createImageAnnotation(event, "  contrast  ")).toMatchObject({ x: 50, y: 50, note: "contrast" });
});
