import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../lib/api", () => ({
  discoveryApi: {
    bestselling: vi.fn().mockResolvedValue([]),
    popular: vi.fn().mockResolvedValue([]),
  },
}));

describe("HomePage hero and video showcase", () => {
  it("centers the complete hero content across breakpoints", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const title = screen.getByRole("heading", {
      name: /Dizaynni o'rganing\./i,
    });
    expect(title).toBeInTheDocument();

    const heroContent = screen.getByTestId("home-hero-content");
    expect(heroContent).toHaveClass("text-center");

    const description = screen.getByText(
      /8 haftalik amaliy dastur, to'rtta portfolio loyihasi va har bosqichda mentor tekshiruvi/
    );
    expect(description).toHaveClass("mx-auto");

    const bgSlideshow = screen.getByTestId("hero-background-slideshow");
    expect(bgSlideshow).toBeInTheDocument();
  });

  it("renders clean video showcase banner and handles play interaction", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const playBtn = screen.getByRole("button", {
      name: /Videoni tomosha qilish/i,
    });
    expect(playBtn).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(
      screen.getByTitle(/Designora Platforma Tanishuvi/i)
    ).toBeInTheDocument();
  });
});
