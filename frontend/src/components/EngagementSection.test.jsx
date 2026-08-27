import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import EngagementSection from "./EngagementSection";

describe("EngagementSection Interactive Studio", () => {
  it("renders engagement heading and updates studio preview on hover", () => {
    render(
      <MemoryRouter>
        <EngagementSection />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: /Natijani hali va'da qilmaymiz\. Jarayonni kuchli quramiz\./i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /Noldan tayyor portfoliogacha/i,
      })
    ).toBeInTheDocument();

    // Hover step 2
    const step2Card = screen.getByText(
      /Amalda bajaring: real Figma loyihalar/i
    );
    fireEvent.mouseEnter(step2Card);

    expect(screen.getByText(/02 \/ Figma Amaliyoti/i)).toBeInTheDocument();

    // Hover step 3
    const step3Card = screen.getByText(/Mentordan individual feedback oling/i);
    fireEvent.mouseEnter(step3Card);

    expect(screen.getByText(/03 \/ Mentor Feedback/i)).toBeInTheDocument();
  });
});
