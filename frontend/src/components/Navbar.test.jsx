import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Navbar from "./Navbar";

const { authState } = vi.hoisted(() => ({ authState: {} }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("framer-motion", async () => {
  const React = await vi.importActual("react");
  const motion = new Proxy(
    {},
    {
      get: () => ({ children, ...props }) =>
        React.createElement("div", props, children),
    }
  );
  return {
    AnimatePresence: ({ children }) => children,
    motion,
  };
});

vi.mock("./NotificationBell", () => ({
  default: () => <button>Bildirishnomalar</button>,
}));
vi.mock("./GoogleAuthButton", () => ({
  default: ({ label }) => <button>{label}</button>,
}));

function renderNavbar(authenticated = false) {
  Object.assign(authState, {
    isAuthenticated: authenticated,
    user: authenticated ? { full_name: "Bahromjon" } : null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar />
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public navigation and auth actions when logged out", () => {
    renderNavbar();

    expect(screen.getAllByText("Bosh sahifa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kurslar").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Kirish" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hisob yaratish" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Bahromjon")).not.toBeInTheDocument();
  });

  it("renders authenticated links and logout action", () => {
    renderNavbar(true);

    expect(screen.getAllByText("Mening kurslarim").length).toBeGreaterThan(0);
    expect(screen.getByText("Bahromjon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chiqish" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bildirishnomalar" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Chiqish" }));
    expect(authState.logout).toHaveBeenCalledTimes(1);
  });

  it("opens login modal and closes it with Escape", () => {
    renderNavbar();

    fireEvent.click(screen.getByRole("button", { name: "Kirish" }));
    expect(screen.getByText("Hisobingizga kiring")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E-pochta")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByPlaceholderText("E-pochta")).not.toBeInTheDocument();
  });

  it("opens the mobile menu and closes it after choosing a link", () => {
    renderNavbar();
    const menuButton = screen.getByRole("button", { name: "Menyu" });

    fireEvent.click(menuButton);
    const blogLinks = screen.getAllByText("Blog");
    expect(blogLinks.length).toBeGreaterThan(1);

    fireEvent.click(blogLinks[blogLinks.length - 1]);
    expect(
      screen.queryByRole("button", { name: "Chiqish" })
    ).not.toBeInTheDocument();
  });
});
