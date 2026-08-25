import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage from "./PrivacyPage";
import TermsPage from "./TermsPage";

describe("legal pages", () => {
  it("renders the localized privacy policy and its core protections", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "Maxfiylik siyosati", level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Sizning huquqlaringiz/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Saqlash joyi va transchegaraviy uzatish/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/2026-yil 25-avgust/)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(14);
  });

  it("renders complete terms including payments and disputes", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: "Foydalanish shartlari", level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Bekor qilish va pulni qaytarish/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Qo‘llaniladigan huquq va nizolar/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/2026-yil 25-avgust/)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(19);
  });
});
