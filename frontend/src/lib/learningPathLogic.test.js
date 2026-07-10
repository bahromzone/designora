import { expect, it } from "vitest";

import { nextLearningStep, pathStatus } from "./learningPathLogic";

it("selects the first unlocked incomplete step", () => {
  const path = { steps: [{ completed: true }, { completed: false, locked: false }, { completed: false, locked: true }] };
  expect(nextLearningStep(path)).toBe(path.steps[1]);
});

it("returns stable path statuses", () => {
  expect(pathStatus({ started: false, progress_percent: 0 })).toBe("not-started");
  expect(pathStatus({ started: true, progress_percent: 40 })).toBe("in-progress");
  expect(pathStatus({ started: true, progress_percent: 100 })).toBe("completed");
});
