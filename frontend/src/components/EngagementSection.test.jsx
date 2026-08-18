import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EngagementSection from "./EngagementSection";

function renderSection() {
  return render(
    <MemoryRouter>
      <EngagementSection />
    </MemoryRouter>
  );
}

describe("EngagementSection", () => {
  it("presents the first cohort with transparent, verifiable facts", () => {
    renderSection();

    expect(screen.getByText("Birinchi oqim ochildi")).toBeInTheDocument();
    expect(screen.getByText("30 ta joy")).toBeInTheDocument();
    expect(screen.getByText("8 hafta")).toBeInTheDocument();
    expect(screen.getByText("4 loyiha")).toBeInTheDocument();
    expect(screen.getByText("Mentor tekshiradi")).toBeInTheDocument();
  });

  it("does not display invented social proof", () => {
    renderSection();

    expect(screen.queryByText(/10,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/95%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Azizbek R\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Muvaffaqiyat Hikoyasi/i)).not.toBeInTheDocument();
  });
});
