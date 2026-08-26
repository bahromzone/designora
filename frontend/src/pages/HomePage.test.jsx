import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

vi.mock("../lib/api", () => ({
  discoveryApi: {
    bestselling: vi.fn().mockResolvedValue({
      courses: [
        {
          id: "test-course-1",
          title: "Brand identika asoslari",
          description: "Noldan brend yaratish",
          category: "Brending",
          level: "Boshlang'ich",
          price: 490000,
          cover_url: "/course-covers/branding-1.jpg",
          rating: 4.9,
          total_enrolled: 120,
          lessons_count: 14,
        },
      ],
    }),
  },
}));

vi.mock("../components/VideoShowcase", () => ({
  default: function MockVideoShowcase() {
    return (
      <div data-testid="video-showcase-mock">
        <button type="button" aria-label="Videoni tomosha qilish">
          Videoni tomosha qilish
        </button>
      </div>
    );
  },
}));

describe("HomePage hero and directions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders new reference hero image and copy", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("home-hero-image")).toHaveAttribute(
      "src",
      "/hero-banner.png"
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Aqlliroq o'rganing\. Tezroq o'sing\. Istalgan joyda yarating\./i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Kurslarni ko'rish" })
    ).toHaveAttribute("href", "/kurslar");

    expect(screen.getByTestId("home-directions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "UI/UX" })).toBeInTheDocument();
  });

  it("renders video showcase mock correctly", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const playBtn = screen.getByRole("button", {
      name: "Videoni tomosha qilish",
    });
    expect(playBtn).toBeInTheDocument();
    fireEvent.click(playBtn);
  });
});
