import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LearnPage from "./LearnPage";
import { useAuth } from "../context/AuthContext";
import { learningApi, quizApi } from "../lib/api";
import { assignmentsApi } from "../lib/assignmentsApi";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/api", () => ({
  learningApi: {
    learn: vi.fn(),
    completeLesson: vi.fn(),
    uncompleteLesson: vi.fn(),
  },
  quizApi: {
    courseQuizzes: vi.fn(),
  },
}));

vi.mock("../lib/assignmentsApi", () => ({
  assignmentsApi: {
    forCourse: vi.fn(),
  },
}));

vi.mock("../components/VideoPlayer", () => ({
  default: ({ onEnded, lessonId }) => (
    <div data-testid="mock-video-player" data-lesson-id={lessonId}>
      <button onClick={onEnded}>Simulate Video End</button>
    </div>
  ),
}));

vi.mock("../components/LessonSidebar", () => ({
  default: ({ modules, activeId, onSelect }) => (
    <aside data-testid="mock-lesson-sidebar">
      {modules.map((m) =>
        (m.lessons || []).map((l) => (
          <button
            key={l.id}
            data-testid={`lesson-item-${l.id}`}
            data-active={activeId === l.id}
            onClick={() => onSelect(l.id)}
          >
            {l.title}
          </button>
        ))
      )}
    </aside>
  ),
}));

vi.mock("../components/AssignmentSection", () => ({
  default: () => <div data-testid="mock-assignment-section" />,
}));
vi.mock("../components/QASection", () => ({
  default: () => <div data-testid="mock-qa-section" />,
}));
vi.mock("../components/NotesSection", () => ({
  default: () => <div data-testid="mock-notes-section" />,
}));
vi.mock("../components/QuizSection", () => ({
  default: () => <div data-testid="mock-quiz-section" />,
}));
vi.mock("../components/CertificateSection", () => ({
  default: () => <div data-testid="mock-certificate-section" />,
}));

const mockCourseData = {
  id: 1,
  title: "Figma UI/UX Asoslari",
  is_enrolled: true,
  progress_percent: 50,
  total_lessons: 2,
  completed_lessons: 1,
  modules: [
    {
      id: 101,
      title: "1-Modul: Kirish",
      lessons: [
        {
          id: 1001,
          title: "1.1 Interfeys bilan tanishuv",
          is_locked: false,
          is_completed: true,
          video_url: "https://example.com/video1.mp4",
          description: "Figma interfeysini sozlash",
        },
        {
          id: 1002,
          title: "1.2 Frame va Layerlar",
          is_locked: false,
          is_completed: false,
          video_url: "https://example.com/video2.mp4",
          description: "Frame yaratish amaliyoti",
        },
      ],
    },
  ],
};

describe("LearnPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assignmentsApi.forCourse.mockResolvedValue([]);
    quizApi.courseQuizzes.mockResolvedValue([]);
  });

  it("renders unauthenticated state when user is not logged in", () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={["/kurslar/1/organish"]}>
        <Routes>
          <Route path="/kurslar/:courseId/organish" element={<LearnPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("learn-unauthenticated")).toBeInTheDocument();
    expect(screen.getByText("Sessiya topilmadi")).toBeInTheDocument();
  });

  it("renders not-enrolled screen when user has not enrolled", async () => {
    useAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      loading: false,
    });
    learningApi.learn.mockResolvedValueOnce({
      ...mockCourseData,
      is_enrolled: false,
    });

    render(
      <MemoryRouter initialEntries={["/kurslar/1/organish"]}>
        <Routes>
          <Route path="/kurslar/:courseId/organish" element={<LearnPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("learn-not-enrolled")).toBeInTheDocument();
      expect(
        screen.getByText("Bu kursga hali yozilmagansiz")
      ).toBeInTheDocument();
    });
  });

  it("renders course details, automatically selects first unfinished open lesson, and allows changing lessons", async () => {
    useAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      loading: false,
    });
    learningApi.learn.mockResolvedValueOnce(mockCourseData);

    render(
      <MemoryRouter initialEntries={["/kurslar/1/organish"]}>
        <Routes>
          <Route path="/kurslar/:courseId/organish" element={<LearnPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("learn-ready")).toBeInTheDocument();
      expect(screen.getByText("Figma UI/UX Asoslari")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "1.2 Frame va Layerlar" })
      ).toBeInTheDocument();
    });

    const lessonOneButton = screen.getByTestId("lesson-item-1001");
    fireEvent.click(lessonOneButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "1.1 Interfeys bilan tanishuv" })
      ).toBeInTheDocument();
      expect(
        screen.getByText("✓ Tugatilgan (bekor qilish)")
      ).toBeInTheDocument();
    });
  });

  it("handles toggling lesson completion", async () => {
    useAuth.mockReturnValue({
      user: { id: 1, email: "user@example.com" },
      loading: false,
    });
    learningApi.learn
      .mockResolvedValueOnce(mockCourseData)
      .mockResolvedValueOnce({
        ...mockCourseData,
        completed_lessons: 2,
        progress_percent: 100,
        modules: [
          {
            ...mockCourseData.modules[0],
            lessons: [
              mockCourseData.modules[0].lessons[0],
              {
                ...mockCourseData.modules[0].lessons[1],
                is_completed: true,
              },
            ],
          },
        ],
      });
    learningApi.completeLesson.mockResolvedValueOnce({ ok: true });

    render(
      <MemoryRouter initialEntries={["/kurslar/1/organish"]}>
        <Routes>
          <Route path="/kurslar/:courseId/organish" element={<LearnPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "1.2 Frame va Layerlar" })
      ).toBeInTheDocument();
    });

    const completeButton = screen.getByText("Tugatilgan deb belgilash");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(learningApi.completeLesson).toHaveBeenCalledWith(1002);
      expect(learningApi.learn).toHaveBeenCalledTimes(2);
    });
  });
});
