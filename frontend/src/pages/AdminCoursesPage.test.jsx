import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCoursesPage from "./AdminCoursesPage";
import { request } from "../lib/request";

vi.mock("../components/AdminWorkspaceShell", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ token: "admin-token" }),
}));
vi.mock("../lib/request", () => ({ request: vi.fn() }));

const course = {
  id: 7,
  title: "UI/UX asoslari",
  description: "Amaliy dizayn kursi",
  category: "UI/UX",
  price: 250000,
  thumbnail_url: "",
  is_active: true,
};

describe("AdminCoursesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("scrollTo", vi.fn());
  });

  it("kurslarni yuklaydi va jadvalda ko'rsatadi", async () => {
    request.mockResolvedValueOnce([course]);
    render(<AdminCoursesPage />);

    expect(await screen.findByText("UI/UX asoslari")).toBeInTheDocument();
    expect(screen.getByText("250000 so'm")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith("/api/admin/courses", {
      token: "admin-token",
    });
  });

  it("bo'sh va xato holatlarini ko'rsatadi", async () => {
    request.mockResolvedValueOnce([]);
    const { unmount } = render(<AdminCoursesPage />);
    expect(await screen.findByText("Hozircha kurslar yo'q.")).toBeInTheDocument();
    unmount();

    request.mockRejectedValueOnce(new Error("Kurslar yuklanmadi"));
    render(<AdminCoursesPage />);
    expect(await screen.findByText("Kurslar yuklanmadi")).toBeInTheDocument();
  });

  it("yangi kurs yaratadi va ro'yxatni qayta yuklaydi", async () => {
    const user = userEvent.setup();
    request
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: 8 })
      .mockResolvedValueOnce([course]);
    render(<AdminCoursesPage />);

    await screen.findByText("Hozircha kurslar yo'q.");
    await user.type(screen.getByPlaceholderText("Kurs nomi"), "Grafik dizayn");
    await user.type(screen.getByPlaceholderText("Kategoriya"), "Design");
    await user.clear(screen.getByPlaceholderText("Narx"));
    await user.type(screen.getByPlaceholderText("Narx"), "150000");
    await user.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Grafik dizayn",
          description: "",
          category: "Design",
          price: 150000,
          thumbnail_url: "",
          is_active: true,
        }),
        token: "admin-token",
      })
    );
    expect(await screen.findByText("UI/UX asoslari")).toBeInTheDocument();
  });

  it("kursni yopadi", async () => {
    const user = userEvent.setup();
    request
      .mockResolvedValueOnce([course])
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce([{ ...course, is_active: false }]);
    render(<AdminCoursesPage />);

    await user.click(await screen.findByRole("button", { name: "Yopish" }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/courses/7/toggle", {
        method: "PATCH",
        token: "admin-token",
      })
    );
    expect(await screen.findByText("Yopiq")).toBeInTheDocument();
  });

  it("userga bog'langan bir martalik kirish kodi yaratadi", async () => {
    const user = userEvent.setup();
    request.mockResolvedValueOnce([course]).mockResolvedValueOnce({
      code: "DESIGN-2026",
      user_email: "student@example.com",
      course_title: course.title,
    });
    render(<AdminCoursesPage />);

    await screen.findByText("UI/UX asoslari");
    await user.type(
      screen.getByPlaceholderText("Foydalanuvchi emaili"),
      "student@example.com"
    );
    await user.click(screen.getByRole("button", { name: "Kod yaratish" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/course-access-codes", {
        method: "POST",
        body: JSON.stringify({
          course_id: 7,
          user_email: "student@example.com",
          expires_in_days: 7,
        }),
        token: "admin-token",
      })
    );
    expect(await screen.findByText("DESIGN-2026")).toBeInTheDocument();
  });
});
