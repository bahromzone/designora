import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SavedCourseButton from "./SavedCourseButton";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/accountApi", () => ({
  accountApi: {
    saveCourse: vi.fn(),
  },
}));

function renderButton(auth = { isAuthenticated: true, loading: false }) {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={["/kurslar/7"]}>
      <SavedCourseButton courseId={7} />
    </MemoryRouter>
  );
}

describe("SavedCourseButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountApi.saveCourse.mockResolvedValue({ course_id: 7 });
  });

  it("saves an authenticated course and prevents duplicate clicks", async () => {
    renderButton();
    const button = screen.getByRole("button", { name: "Saqlash" });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(accountApi.saveCourse).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Saqlandi" })).toBeDisabled()
    );
  });

  it("redirects anonymous users to login without calling the API", () => {
    renderButton({ isAuthenticated: false, loading: false });

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    expect(accountApi.saveCourse).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe("/");
    expect(window.location.search).toBe("?modal=login");
  });

  it("shows a recoverable error when saving fails", async () => {
    accountApi.saveCourse.mockRejectedValueOnce(new Error("Server xatosi"));
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server xatosi");
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeEnabled();
  });
});
