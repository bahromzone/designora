import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../lib/api", () => ({
  getFeaturedCourses: vi.fn().mockResolvedValue([]),
  getPopularCourses: vi.fn().mockResolvedValue([]),
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
    expect(title).toHaveClass("text-center");

    const description = screen.getByText(
      /8 haftalik amaliy dastur, to'rtta portfolio loyihasi va har bosqichda mentor tekshiruvi/
    );
    expect(description).toHaveClass("text-center");
    expect(description).toHaveClass("mx-auto");
  });

  it("renders video showcase banner and handles play interaction", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const playBtn = screen.getByRole("button", { name: /Videoni tomosha qilish/i });
    expect(playBtn).toBeInTheDocument();

    const videoTitle = screen.getByText(/Designora platformasi bilan 1 daqiqada tanishing/i);
    expect(videoTitle).toBeInTheDocument();

    fireEvent.click(playBtn);
    expect(screen.getByTitle(/Designora Platforma Tanishuvi/i)).toBeInTheDocument();
  });
});
