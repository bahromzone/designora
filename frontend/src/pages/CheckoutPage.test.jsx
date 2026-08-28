import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "./CheckoutPage";
import { checkoutApi } from "../lib/checkoutApi";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ token: "mock-test-token" }),
}));

vi.mock("../lib/checkoutApi", () => ({
  checkoutApi: {
    quote: vi.fn(),
    checkout: vi.fn(),
  },
}));

describe("CheckoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders quote details and handles coupon application", async () => {
    checkoutApi.quote.mockResolvedValueOnce({
      title: "UI/UX Boshlang'ich Kursi",
      original_amount: 500000,
      discount: 100000,
      total: 400000,
      providers: ["payme", "click"],
    });

    render(
      <MemoryRouter initialEntries={["/checkout/10"]}>
        <Routes>
          <Route path="/checkout/:courseId" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Narx hisoblanmoqda...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("UI/UX Boshlang'ich Kursi")).toBeInTheDocument();
      expect(screen.getByText("500 000 so'm")).toBeInTheDocument();
      expect(screen.getByText("400 000 so'm to‘lash")).toBeInTheDocument();
    });

    checkoutApi.quote.mockResolvedValueOnce({
      title: "UI/UX Boshlang'ich Kursi",
      original_amount: 500000,
      discount: 200000,
      total: 300000,
      providers: ["payme", "click"],
    });

    const couponInput = screen.getByPlaceholderText("UX20");
    fireEvent.change(couponInput, { target: { value: "PROMO50" } });
    fireEvent.click(screen.getByText("Qo‘llash"));

    await waitFor(() => {
      expect(checkoutApi.quote).toHaveBeenCalledWith("10", "PROMO50");
      expect(screen.getByText("300 000 so'm to‘lash")).toBeInTheDocument();
    });
  });

  it("handles checkout payment redirect", async () => {
    checkoutApi.quote.mockResolvedValueOnce({
      title: "Figma Pro Kursi",
      original_amount: 300000,
      discount: 0,
      total: 300000,
      providers: ["payme", "click"],
    });

    checkoutApi.checkout.mockResolvedValueOnce({
      pay_url: "https://checkout.payme.uz/redirect/123",
    });

    const originalLocation = window.location;
    const assignMock = vi.fn();
    delete window.location;
    window.location = { assign: assignMock };

    render(
      <MemoryRouter initialEntries={["/checkout/5"]}>
        <Routes>
          <Route path="/checkout/:courseId" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Figma Pro Kursi")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("300 000 so'm to‘lash"));

    await waitFor(() => {
      expect(checkoutApi.checkout).toHaveBeenCalledWith(
        { course_id: 5, provider: "payme", coupon_code: null },
        "mock-test-token"
      );
      expect(assignMock).toHaveBeenCalledWith("https://checkout.payme.uz/redirect/123");
    });

    window.location = originalLocation;
  });
});
