import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const completeOAuthLogin = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ completeOAuthLogin }),
}));

import AuthCallbackPage, { safeRedirect } from "./AuthCallbackPage";

function renderCallback(next) {
  const entry = `/auth/callback?next=${encodeURIComponent(next)}`;
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/admin" element={<p>Admin panel</p>} />
          <Route path="/superadmin" element={<p>Superadmin panel</p>} />
          <Route path="/instruktor-panel" element={<p>Instruktor paneli</p>} />
          <Route path="/kurslarim" element={<p>Mening kurslarim</p>} />
          <Route path="/" element={<p>Bosh sahifa</p>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );
}

describe("safeRedirect", () => {
  it("har bir rolni o'z dashboardiga yuboradi", () => {
    expect(safeRedirect("/admin", "admin")).toBe("/admin");
    expect(safeRedirect("/kurslarim", "superadmin")).toBe("/superadmin");
    expect(safeRedirect("/kurslarim", "instructor")).toBe(
      "/instruktor-panel",
    );
    expect(safeRedirect("/admin", "user")).toBe("/kurslarim");
  });

  it("begona va tashqi yo'llarni rol dashboardiga tushiradi", () => {
    expect(safeRedirect("https://evil.example.com", "user")).toBe(
      "/kurslarim",
    );
    expect(safeRedirect("/admin/users", "user")).toBe("/kurslarim");
    expect(safeRedirect("", "user")).toBe("/kurslarim");
  });
});

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    completeOAuthLogin.mockReset();
  });

  it("StrictMode ostida sessiya tasdiqlangach admin dashboardga o'tadi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 1, role: "admin" });

    renderCallback("/kurslarim");

    expect(await screen.findByText("Admin panel")).toBeInTheDocument();
  });

  it("superadmin noto'g'ri next olsa ham superadmin paneliga o'tadi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 2, role: "superadmin" });

    renderCallback("/kurslarim");

    expect(await screen.findByText("Superadmin panel")).toBeInTheDocument();
  });

  it("instructor noto'g'ri next olsa o'z paneliga o'tadi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 3, role: "instructor" });

    renderCallback("/admin");

    expect(await screen.findByText("Instruktor paneli")).toBeInTheDocument();
  });

  it("sessiyani ikki marta tasdiqlamaydi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 4, role: "user" });

    renderCallback("/admin");

    expect(await screen.findByText("Mening kurslarim")).toBeInTheDocument();
    expect(completeOAuthLogin).toHaveBeenCalledTimes(1);
  });

  it("sessiya tasdiqlanmasa xato xabarini ko'rsatadi", async () => {
    completeOAuthLogin.mockRejectedValue(new Error("401"));

    renderCallback("/admin");

    expect(
      await screen.findByText(
        "Google orqali kirishda sessiyani tasdiqlab bo'lmadi."
      )
    ).toBeInTheDocument();
  });
});
