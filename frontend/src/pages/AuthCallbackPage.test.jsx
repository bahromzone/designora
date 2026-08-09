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
    // StrictMode ataylab: aynan u effektni ikki marta ishga tushirib,
    // sahifani "Google orqali kirilmoqda..." holatida qotirib qo'ygan edi.
    <StrictMode>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/admin" element={<p>Admin panel</p>} />
          <Route path="/kurslarim" element={<p>Mening kurslarim</p>} />
          <Route path="/" element={<p>Bosh sahifa</p>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );
}

describe("safeRedirect", () => {
  it("ruxsat etilgan yo'llarni o'zgartirmaydi", () => {
    expect(safeRedirect("/admin")).toBe("/admin");
    expect(safeRedirect("/superadmin")).toBe("/superadmin");
    expect(safeRedirect("/instruktor-panel")).toBe("/instruktor-panel");
    expect(safeRedirect("/kurslarim")).toBe("/kurslarim");
  });

  it("begona va tashqi yo'llarni bosh sahifaga tushiradi", () => {
    expect(safeRedirect("https://evil.example.com")).toBe("/");
    expect(safeRedirect("/admin/users")).toBe("/");
    expect(safeRedirect("")).toBe("/");
  });
});

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    completeOAuthLogin.mockReset();
  });

  it("StrictMode ostida sessiya tasdiqlangach `next` yo'liga o'tadi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 1, role: "admin" });

    renderCallback("/admin");

    expect(await screen.findByText("Admin panel")).toBeInTheDocument();
  });

  it("sessiyani ikki marta tasdiqlamaydi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 1, role: "user" });

    renderCallback("/kurslarim");

    expect(await screen.findByText("Mening kurslarim")).toBeInTheDocument();
    expect(completeOAuthLogin).toHaveBeenCalledTimes(1);
  });

  it("ruxsat etilmagan `next` bo'lsa bosh sahifaga o'tadi", async () => {
    completeOAuthLogin.mockResolvedValue({ id: 1, role: "user" });

    renderCallback("/admin/users");

    expect(await screen.findByText("Bosh sahifa")).toBeInTheDocument();
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
