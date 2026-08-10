import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { role: "user" } }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ info: vi.fn(), success: vi.fn(), error: vi.fn() }),
}));

import OnboardingModal from "./OnboardingModal";

describe("OnboardingModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Oldingi va Keyingi tugmalarini footer ichida ko'rsatadi", () => {
    const { container } = render(<OnboardingModal />);

    const footer = container.querySelector(".onboarding-actions");

    expect(footer).not.toBeNull();
    expect(screen.getByRole("button", { name: /Oldingi/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keyingi/ })).toBeInTheDocument();
    expect(footer).toContainElement(
      screen.getByRole("button", { name: /Keyingi/ })
    );
  });

  it("yuqoridagi brend paneli olib tashlangan", () => {
    const { container } = render(<OnboardingModal />);

    expect(container.querySelector(".onboarding-topbar")).toBeNull();
    expect(screen.queryByText("DESIGNORA")).not.toBeInTheDocument();
  });

  it("yopish tugmasi saqlanib qolgan", () => {
    render(<OnboardingModal />);

    expect(
      screen.getByRole("button", { name: "Keyinroq davom etish" })
    ).toBeInTheDocument();
  });

  it("birinchi qadamda Oldingi tugmasi o'chirilgan bo'ladi", () => {
    render(<OnboardingModal />);

    expect(screen.getByRole("button", { name: /Oldingi/ })).toBeDisabled();
  });
});
