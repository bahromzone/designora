import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CourseAccessCodeForm from "./CourseAccessCodeForm";
import { request } from "../lib/request";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../lib/request", () => ({ request: vi.fn() }));

function renderForm(props = {}) {
  return render(
    <MemoryRouter initialEntries={["/kurslar/7"]}>
      <CourseAccessCodeForm
        courseId={7}
        isAuthenticated
        authLoading={false}
        {...props}
      />
    </MemoryRouter>
  );
}

describe("CourseAccessCodeForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redeems the code for the current course and reports success", async () => {
    const onRedeemed = vi.fn();
    request.mockResolvedValue({ message: "Kurs biriktirildi", course_id: 7 });
    renderForm({ onRedeemed });

    fireEvent.change(screen.getByLabelText("Bir martalik kurs kodi"), {
      target: { value: "abcd-2345-efgh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kodni qo'llash" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/api/course-access-codes/redeem",
        {
          method: "POST",
          body: JSON.stringify({ course_id: 7, code: "ABCD-2345-EFGH" }),
        }
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Kurs biriktirildi"
    );
    expect(onRedeemed).toHaveBeenCalledTimes(1);
  });

  it("redirects anonymous users to login", () => {
    renderForm({ isAuthenticated: false });
    fireEvent.change(screen.getByLabelText("Bir martalik kurs kodi"), {
      target: { value: "ABCD-2345-EFGH" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kodni qo'llash" }));

    expect(request).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/?modal=login", {
      state: { from: "/kurslar/7" },
    });
  });

  it("keeps the form recoverable after an invalid code", async () => {
    request.mockRejectedValue(new Error("Kod noto'g'ri yoki yaroqsiz"));
    renderForm();
    fireEvent.change(screen.getByLabelText("Bir martalik kurs kodi"), {
      target: { value: "ABCD-2345-EFGH" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kodni qo'llash" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Kod noto'g'ri");
    expect(
      screen.getByRole("button", { name: "Kodni qo'llash" })
    ).toBeEnabled();
  });
});
