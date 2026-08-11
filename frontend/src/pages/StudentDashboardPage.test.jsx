import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDashboardPage from "./StudentDashboardPage";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../lib/dashboardApi";
import { discoveryApi } from "../lib/api";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/dashboardApi", () => ({
  dashboardApi: { get: vi.fn() },
}));

vi.mock("../lib/api", () => ({
  discoveryApi: { bestselling: vi.fn() },
}));

vi.mock("framer-motion", async () => {
  const React = await vi.importActual("react");
  const motion = new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }) =>
          React.createElement("div", props, children),
    }
  );
  return { motion };
});

const user = { full_name: "Bahromjon" };
const data = {
  courses: [
    {
      course_id: 7,
      title: "UI Design asoslari",
      category: "UI/UX",
      lessons_count: 10,
      progress_percent: 35,
      is_completed: false,
    },
  ],
  assignments: [],
  notifications: [],
  gamification: {
    streak_days: 3,
    points: 120,
    level: 2,
    points_to_next_level: 380,
  },
  next_lesson: {
    title: "Ranglar nazariyasi",
    order: 2,
    duration_seconds: 600,
    course: {
      title: "UI Design asoslari",
      course_id: 7,
      progress_percent: 35,
    },
  },
  summary: {
    average_progress: 35,
    active_courses: 1,
    completed_courses: 0,
    open_assignments: 0,
  },
};

function renderDashboard() {
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <StudentDashboardPage />
    </MemoryRouter>
  );
}

describe("StudentDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    discoveryApi.bestselling.mockResolvedValue([]);
  });

  it("shows loading skeleton before the dashboard request resolves", () => {
    dashboardApi.get.mockReturnValue(new Promise(() => {}));
    renderDashboard();

    expect(document.querySelector(".dashboard-skeleton")).toBeInTheDocument();
  });

  it("shows an actionable empty state when the user has no courses", async () => {
    dashboardApi.get.mockResolvedValue({ courses: [] });
    renderDashboard();

    expect(
      await screen.findByText("Birinchi kursga yoziling!")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Katalogni ko'rish/i })
    ).toHaveAttribute("href", "/kurslar");
  });

  it("shows an error and retries the failed request", async () => {
    dashboardApi.get
      .mockRejectedValueOnce(new Error("Dashboard ishlamadi"))
      .mockResolvedValueOnce({ courses: [] });
    renderDashboard();

    expect(await screen.findByText("Dashboard ishlamadi")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Qayta urinish" }));
    expect(
      await screen.findByText("Birinchi kursga yoziling!")
    ).toBeInTheDocument();
    expect(dashboardApi.get).toHaveBeenCalledTimes(2);
  });

  it("renders the main learning journey and deep links", async () => {
    dashboardApi.get.mockResolvedValue(data);
    renderDashboard();

    expect(await screen.findByText("Salom, Bahromjon 👋")).toBeInTheDocument();
    expect(screen.getByText("Ranglar nazariyasi")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Darsni davom ettirish/i })
    ).toHaveAttribute("href", "/organish/7");
    expect(screen.getByText("UI Design asoslari")).toBeInTheDocument();
    await waitFor(() =>
      expect(discoveryApi.bestselling).toHaveBeenCalledWith(5)
    );
  });
});
