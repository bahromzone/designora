import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPaymentsPage from "./AdminPaymentsPage";
import { request } from "../lib/request";

vi.mock("../components/AdminWorkspaceShell", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ token: "admin-token" }),
}));
vi.mock("../lib/request", () => ({ request: vi.fn() }));

const paidOrder = {
  id: 11,
  user_email: "student@example.com",
  course_title: "UI/UX asoslari",
  amount: 250000,
  provider: "payme",
  status: "paid",
  refund_status: "none",
};
const coupon = {
  id: 3,
  code: "START10",
  type: "percent",
  value: 10,
  used_count: 2,
  is_active: true,
};

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buyurtma va kuponlarni parallel yuklaydi", async () => {
    request
      .mockResolvedValueOnce([paidOrder])
      .mockResolvedValueOnce([coupon]);
    render(<AdminPaymentsPage />);

    expect(await screen.findByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByText("UI/UX asoslari")).toBeInTheDocument();
    expect(screen.getByText("START10")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith("/api/admin/orders", {
      token: "admin-token",
    });
    expect(request).toHaveBeenCalledWith("/api/admin/coupons", {
      token: "admin-token",
    });
  });

  it("status bo'yicha buyurtmalarni filtrlaydi", async () => {
    const user = userEvent.setup();
    request
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([paidOrder])
      .mockResolvedValueOnce([]);
    render(<AdminPaymentsPage />);

    await screen.findByText("Order topilmadi.");
    await user.selectOptions(screen.getByRole("combobox", { name: "" }), "paid");

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/orders?status=paid", {
        token: "admin-token",
      })
    );
    expect(await screen.findByText("student@example.com")).toBeInTheDocument();
  });

  it("paid buyurtma uchun refund so'rovini yuboradi", async () => {
    const user = userEvent.setup();
    request
      .mockResolvedValueOnce([paidOrder])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce([{ ...paidOrder, refund_status: "requested" }])
      .mockResolvedValueOnce([]);
    render(<AdminPaymentsPage />);

    await user.click(
      await screen.findByRole("button", { name: "Refund so'rovi" })
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/orders/11/refund", {
        method: "POST",
        token: "admin-token",
      })
    );
    expect(await screen.findByText("paid / refund: requested")).toBeInTheDocument();
  });

  it("kupon yaratadi va ro'yxatni yangilaydi", async () => {
    const user = userEvent.setup();
    request
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: 4 })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([coupon]);
    render(<AdminPaymentsPage />);

    await screen.findByText("Order topilmadi.");
    await user.type(screen.getByPlaceholderText("CODE"), "START10");
    await user.click(screen.getByRole("button", { name: "Qo'shish" }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify({ code: "START10", type: "percent", value: 10 }),
        token: "admin-token",
      })
    );
    expect(await screen.findByText("START10")).toBeInTheDocument();
  });

  it("API xatosini ko'rsatadi", async () => {
    request
      .mockRejectedValueOnce(new Error("To'lovlar yuklanmadi"))
      .mockResolvedValueOnce([]);
    render(<AdminPaymentsPage />);
    expect(await screen.findByText("To'lovlar yuklanmadi")).toBeInTheDocument();
  });
});
