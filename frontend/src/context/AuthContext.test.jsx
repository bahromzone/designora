import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loginMock = vi.fn();
const issueRefreshMock = vi.fn(() => Promise.resolve());
const profileMock = vi.fn();
const logoutAllMock = vi.fn();

vi.mock("../lib/api", () => ({
  authApi: {
    login: loginMock,
    register: vi.fn(),
    issueRefresh: issueRefreshMock,
    profile: profileMock,
    logoutAll: logoutAllMock,
  },
}));

import { AuthProvider, useAuth } from "./AuthContext";

describe("instructor login flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.location.assign = vi.fn();
  });

  it("redirects an approved instructor to the instructor panel", async () => {
    loginMock.mockResolvedValue({
      access_token: "instructor-token",
      redirect: "/dashboard",
      user: {
        id: 7,
        email: "baxromjonolimov0000@gmail.com",
        role: "instructor",
      },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: "baxromjonolimov0000@gmail.com",
        password: "ValidPassword1",
      });
    });

    expect(window.location.assign).toHaveBeenCalledWith("/instruktor-panel");
    expect(localStorage.getItem("designora-auth-token")).toBe("instructor-token");
  });

  it("keeps regular users on the normal dashboard", async () => {
    loginMock.mockResolvedValue({
      access_token: "user-token",
      redirect: "/dashboard",
      user: { id: 8, email: "student@example.com", role: "user" },
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: "student@example.com",
        password: "ValidPassword1",
      });
    });

    expect(window.location.assign).toHaveBeenCalledWith("/dashboard");
  });
});
