import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FeatureCard from "./FeatureCard";

describe("FeatureCard", () => {
  it("renders title, eyebrow and description", () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon">*</span>}
        eyebrow="Yo'nalish"
        title="Dizayn asoslari"
        description="Boshlang'ich darslar to'plami"
      />
    );

    expect(screen.getByText("Dizayn asoslari")).toBeInTheDocument();
    expect(screen.getByText("Yo'nalish")).toBeInTheDocument();
    expect(
      screen.getByText("Boshlang'ich darslar to'plami")
    ).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders as an article element", () => {
    const { container } = render(
      <FeatureCard title="T" eyebrow="E" description="D" icon={null} />
    );
    expect(container.querySelector("article")).toBeTruthy();
  });
});
