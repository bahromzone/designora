import { expect, it } from "vitest";

import { keyboardAction, shouldResume } from "./videoPlayerLogic";

it("validates resume positions", () => {
  expect(shouldResume(73, 600)).toBe(true);
  expect(shouldResume(598, 600)).toBe(false);
  expect(shouldResume(0, 600)).toBe(false);
});

it("maps player keyboard shortcuts", () => {
  expect(keyboardAction(" ")).toBe("toggle");
  expect(keyboardAction("ArrowRight")).toBe("forward");
  expect(keyboardAction("f")).toBe("fullscreen");
  expect(keyboardAction("x")).toBe(null);
});
