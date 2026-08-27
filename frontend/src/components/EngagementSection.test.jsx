import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EngagementSection from "./EngagementSection";

describe("EngagementSection", () => {
  beforeEach(() => {
    window.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        const index = Number(element.getAttribute("data-step-index") || 0);
        if (index === 0) {
          callback([{ isIntersecting: true, target: element }]);
        }
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it("renders the section heading and step content", () => {
    render(<EngagementSection />);

    expect(screen.getByText("Noldan tayyor portfoliogacha")).toBeInTheDocument();
    expect(screen.getByText("01-QADAM")).toBeInTheDocument();
    expect(
      screen.getByText("Darsni ko'ring va mohiyatni tushuning"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Kuchli portfolio bilan kursni yakunlang"),
    ).toBeInTheDocument();
  });

  it("changes active preview when hovering over a step card", () => {
    render(<EngagementSection />);

    const stepFour = screen.getByText(
      "Kuchli portfolio bilan kursni yakunlang",
    );
    fireEvent.mouseEnter(stepFour.closest("[data-step-index]"));

    expect(
      screen.getByText("4-Modul: Behance & Dribbble Portfolio"),
    ).toBeInTheDocument();
    expect(screen.getByText("04 / PORTFOLIO SHOWCASE")).toBeInTheDocument();
    expect(screen.getByText("Bosqich 4 / 4")).toBeInTheDocument();
  });
});
