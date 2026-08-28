import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleRoute, { canAccess } from "./RoleRoute";

const authState = vi.hoisted(() => ({
  value: { user: { role: "admin" }, loading: false },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authState.value,
}));

vi.mock("./ProtectedRoute", () => ({
  default: ({ children }) => children,
}));

const ADMIN_ROLES = ["admin", "superadmin"];

function renderRoute(roles = ADMIN_ROLES) {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route
          path="/admin"
          element={
            <RoleRoute roles={roles}>
              <div>Admin content</div>
            </RoleRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("canAccess", () => {
  it("login qilmagan foydalanuvchini kiritmaydi", () => {
    expect(canAccess(null, ADMIN_ROLES)).toBe(false);
    expect(canAccess(undefined, ADMIN_ROLES)).toBe(false);
  });

  it("oddiy user va instructorni admin panelga kiritmaydi", () => {
    expect(canAccess({ role: "user" }, ADMIN_ROLES)).toBe(false);
    expect(canAccess({ role: "instructor" }, ADMIN_ROLES)).toBe(false);
  });

  it("admin va superadminni kiritadi", () => {
    expect(canAccess({ role: "admin" }, ADMIN_ROLES)).toBe(true);
    expect(canAccess({ role: "superadmin" }, ADMIN_ROLES)).toBe(true);
  });

  it("superadmin-only sahifaga adminni kiritmaydi", () => {
    expect(canAccess({ role: "admin" }, ["superadmin"])).toBe(false);
    expect(canAccess({ role: "superadmin" }, ["superadmin"])).toBe(true);
  });

  it("rol ro'yxati bo'sh bo'lsa har qanday login qilgan userga ruxsat beradi", () => {
    expect(canAccess({ role: "user" })).toBe(true);
  });
});

describe("RoleRoute", () => {
  beforeEach(() => {
    authState.value = { user: { role: "admin" }, loading: false };
  });

  it("ruxsat tekshirilayotganda loading holatini ko'rsatadi", () => {
    authState.value = { user: null, loading: true };
    renderRoute();
    expect(screen.getByText("Ruxsatlar tekshirilmoqda...")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("ruxsatsiz rolni bosh sahifaga qaytaradi", () => {
    authState.value = { user: { role: "user" }, loading: false };
    renderRoute();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("admin uchun himoyalangan kontentni ochadi", () => {
    renderRoute();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  it("superadmin-only route'da adminni bloklaydi", () => {
    renderRoute(["superadmin"]);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });
});
