import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

import EngagementSection from "./EngagementSection";

describe("EngagementSection", () => {
  it("presents the first cohort with transparent, verifiable facts", () => {
    render(<EngagementSection />);

    expect(screen.getByText("Birinchi oqim ochildi")).toBeInTheDocument();
    expect(screen.getByText("30 ta joy")).toBeInTheDocument();
    expect(screen.getByText("8 hafta")).toBeInTheDocument();
    expect(screen.getByText("4 loyiha")).toBeInTheDocument();
    expect(screen.getByText("Mentor tekshiradi")).toBeInTheDocument();
  });

  it("does not display invented social proof", () => {
    render(<EngagementSection />);

    expect(screen.queryByText(/10,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/95%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Azizbek R\./)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Muvaffaqiyat Hikoyasi/i)
    ).not.toBeInTheDocument();
  });
});
