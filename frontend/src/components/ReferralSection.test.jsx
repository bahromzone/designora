import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ReferralSection from "./ReferralSection";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { referralApi } from "../lib/api";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../context/ToastContext", () => ({ useToast: vi.fn() }));
vi.mock("../lib/api", () => ({
  referralApi: {
    myCode: vi.fn(),
  },
}));

describe("ReferralSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAuthenticated: true });
    useToast.mockReturnValue({ success: vi.fn(), error: vi.fn() });
    referralApi.myCode.mockResolvedValue({
      code: "DESIGN24",
      total_referred: 2,
      converted: 1,
      points_earned: 50,
    });
  });

  it("cookie sessiya bilan referral kodini yuklaydi va loading holatini tugatadi", async () => {
    render(<ReferralSection />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Taklif kodingiz yuklanmoqda..."
    );
    expect(await screen.findByText("DESIGN24")).toBeInTheDocument();
    expect(referralApi.myCode).toHaveBeenCalledWith();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("so'rov yiqilganda cheksiz loading o'rniga xatoni ko'rsatadi", async () => {
    referralApi.myCode.mockRejectedValueOnce(new Error("offline"));

    render(<ReferralSection />);

    expect(
      await screen.findByText("Referral kodini yuklab bo'lmadi.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("autentifikatsiyasiz foydalanuvchiga bo'limni ko'rsatmaydi", () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    const { container } = render(<ReferralSection />);

    expect(container).toBeEmptyDOMElement();
    expect(referralApi.myCode).not.toHaveBeenCalled();
  });
});
