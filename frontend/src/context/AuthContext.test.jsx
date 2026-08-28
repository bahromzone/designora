import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { authApi } from "../lib/api";
import { request } from "../lib/request";

vi.mock("../lib/api", () => ({
  authApi: {
    profile: vi.fn(),
    refresh: vi.fn(),
    register: vi.fn(),
    logoutAll: vi.fn(),
  },
}));

vi.mock("../lib/request", () => ({
  request: vi.fn(),
}));

function TestConsumer() {
  const {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
    completeOAuthLogin,
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "idle"}</div>
      <div data-testid="auth-state">
        {isAuthenticated ? "authenticated" : "guest"}
      </div>
      <div data-testid="user-email">{user?.email || "none"}</div>
      <div data-testid="user-role">{user?.role || "none"}</div>
      <button
        onClick={() =>
          login({ email: "test@example.com", password: "password123" })
        }
      >
        Login Action
      </button>
      <button
        onClick={() =>
          register({
            email: "new@example.com",
            password: "password123",
            full_name: "New User",
          })
        }
      >
        Register Action
      </button>
      <button onClick={logout}>Logout Action</button>
      <button onClick={() => refreshProfile()}>Refresh Action</button>
      <button onClick={completeOAuthLogin}>OAuth Action</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes and restores authenticated session successfully", async () => {
    authApi.profile.mockResolvedValueOnce({
      id: 1,
      email: "user@example.com",
      role: "user",
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("idle");
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "authenticated"
      );
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "user@example.com"
      );
    });
  });

  it("handles unauthenticated initial state cleanly", async () => {
    authApi.profile.mockRejectedValueOnce(new Error("Unauthorized"));
    authApi.refresh.mockRejectedValueOnce(new Error("Refresh failed"));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("idle");
      expect(screen.getByTestId("auth-state")).toHaveTextContent("guest");
      expect(screen.getByTestId("user-email")).toHaveTextContent("none");
    });
  });

  it("performs login flow with CSRF token and redirects according to role", async () => {
    authApi.profile.mockRejectedValueOnce(new Error("Unauthorized"));
    authApi.refresh.mockRejectedValueOnce(new Error("Refresh failed"));

    request.mockImplementation(async (path) => {
      if (path === "/api/auth/csrf-token") {
        return { csrf_token: "csrf-test-token" };
      }
      if (path === "/api/auth/login") {
        return {
          user: { id: 2, email: "admin@example.com", role: "admin" },
        };
      }
      return {};
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<TestConsumer />} />
            <Route
              path="/admin"
              element={<div data-testid="admin-page">Admin Dashboard</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    });

    fireEvent.click(screen.getByText("Login Action"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-page")).toBeInTheDocument();
    });
  });

  it("logs out user and resets authentication state", async () => {
    authApi.profile.mockResolvedValueOnce({
      id: 1,
      email: "user@example.com",
      role: "user",
    });
    authApi.logoutAll.mockResolvedValueOnce({ ok: true });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "authenticated"
      );
    });

    fireEvent.click(screen.getByText("Logout Action"));

    expect(screen.getByTestId("auth-state")).toHaveTextContent("guest");
    expect(screen.getByTestId("user-email")).toHaveTextContent("none");
  });
});
