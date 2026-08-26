import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../components/EngagementSection", () => ({
  default: () => <div data-testid="engagement-section" />,
}));

vi.mock("../components/RecommendationSection", () => ({
  default: () => <div data-testid="recommendation-section" />,
}));

vi.mock("../lib/api", () => ({
  discoveryApi: { bestselling: vi.fn() },
}));

describe("HomePage hero", () => {
  it("centers the complete hero content across breakpoints", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-hero-content")).toHaveClass(
      "mx-auto",
      "text-center"
    );
    expect(screen.getByText(/8 haftalik amaliy dastur/)).toHaveClass("mx-auto");
    expect(screen.getByTestId("home-hero-actions")).toHaveClass(
      "justify-center"
    );
    expect(screen.getByTestId("home-hero-facts")).toHaveClass(
      "mx-auto",
      "max-w-3xl",
      "text-center"
    );
  });
});
