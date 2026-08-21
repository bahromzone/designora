import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CourseDetailPage from "./CourseDetailPage";
import { useAuth } from "../context/AuthContext";
import { coursesApi } from "../lib/api";

vi.mock("../components/CourseAccessCodeForm", () => ({
  default: () => <div>Bir martalik kurs kodi</div>,
}));
vi.mock("../components/SavedCourseButton", () => ({
  default: () => <button type="button">Saqlash</button>,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../lib/accountApi", () => ({
  accountApi: { savedCourses: vi.fn() },
}));
vi.mock("../lib/api", () => ({
  coursesApi: { detail: vi.fn() },
  learningApi: { learn: vi.fn(), enroll: vi.fn() },
  formatPrice: (price) => `${price} so'm`,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/kurslar/42"]}>
      <Routes>
        <Route path="/kurslar/:courseId" element={<CourseDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CourseDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
  });

  it("routes paid enrollment to Safibuy with the selected course context", async () => {
    coursesApi.detail.mockResolvedValue({
      id: 42,
      title: "Grafik dizayn",
      description: "Amaliy kurs",
      category: "Dizayn",
      price: 590000,
      modules: [],
    });

    renderPage();

    const link = await screen.findByRole("link", { name: "Kursga yozilish" });
    const url = new URL(link.href);
    expect(url.origin).toBe("https://t.me");
    expect(url.pathname).toBe("/safibuy");
    expect(url.searchParams.get("text")).toContain("Grafik dizayn");
    expect(url.searchParams.get("text")).toContain("Kurs ID: 42");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Bir martalik kurs kodi")).toBeInTheDocument();
  });

  it("keeps free enrollment inside Designora without showing a code form", async () => {
    coursesApi.detail.mockResolvedValue({
      id: 42,
      title: "Bepul kirish darsi",
      description: "Sinov darsi",
      category: "Dizayn",
      price: 0,
      modules: [],
    });

    renderPage();

    expect(
      await screen.findByRole("button", { name: "Kursga yozilish" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Kursga yozilish" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Bir martalik kurs kodi")
    ).not.toBeInTheDocument();
  });
});
