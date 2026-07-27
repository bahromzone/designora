import { describe, expect, it } from "vitest";
import { certificatePanelState } from "./LearnPage";

describe("certificatePanelState", () => {
  it("hides the certificate CTA while the course is incomplete", () => {
    expect(certificatePanelState(null, 99, [])).toBe("in_progress");
  });
  it("shows a ready state at 100% when there are no active quizzes", () => {
    expect(certificatePanelState(null, 100, [])).toBe("ready");
  });
  it("explains that quizzes remain when active quizzes exist", () => {
    expect(certificatePanelState(null, 100, [{ id: 1 }])).toBe("quiz_required");
  });
  it("shows the issued state when a certificate already exists", () => {
    expect(certificatePanelState({ id: 7 }, 100, [])).toBe("issued");
  });
});
