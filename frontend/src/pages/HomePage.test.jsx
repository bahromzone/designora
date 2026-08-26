import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../lib/api", () => ({
  discoveryApi: {
    bestselling: vi.fn().mockResolvedValue([]),
    popular: vi.fn().mockResolvedValue([]),
  },
}));

describe("HomePage reference-inspired hero", () => {
  it("renders the large visual hero with readable content and CTA", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: /Aqlliroq o'rganing\. Tezroq o'sing\./i,
      })
    ).toBeInTheDocument();

    const heroImage = screen.getByTestId("home-hero-image");
    expect(heroImage).toHaveAttribute(
      "alt",
      "Dizayn vositalari bilan ishlayotgan Designora talabalari"
    );
    expect(heroImage).toHaveAttribute("fetchpriority", "high");

    expect(
      screen.getByRole("link", { name: /Kurslarni ko'rish/i })
    ).toHaveAttribute("href", "/kurslar");
  });

  it("places platform directions immediately after the large hero", () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const orderedSections = Array.from(
      container.querySelectorAll("[data-home-section]")
    ).map((section) => section.getAttribute("data-home-section"));

    expect(orderedSections).toEqual(["hero", "directions"]);
    expect(screen.getByTestId("home-directions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "UI/UX" })).toHaveAttribute(
      "href",
      "/kurslar?q=ui%20ux"
    );
  });

  it("keeps the video showcase interaction working", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const playButton = screen.getByRole("button", {
      name: /Videoni tomosha qilish/i,
    });
    fireEvent.click(playButton);

    expect(
      screen.getByTitle(/Designora Platforma Tanishuvi/i)
    ).toBeInTheDocument();
  });
});
