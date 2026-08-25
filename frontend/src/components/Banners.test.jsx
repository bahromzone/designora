import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TopAnnouncementBanner from "./TopAnnouncementBanner";
import CookieConsentBanner from "./CookieConsentBanner";

describe("TopAnnouncementBanner & CookieConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders top announcement banner with correct text and link", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <TopAnnouncementBanner />
      </MemoryRouter>
    );

    expect(screen.getByText("AKSIYA")).toBeInTheDocument();
    expect(screen.getByText(/Yozgi chegirma: barcha kurslarga/i)).toBeInTheDocument();
    expect(screen.getByText("Chegirmani olish")).toBeInTheDocument();
  });

  it("handles cookie consent accept button correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <CookieConsentBanner />
      </MemoryRouter>
    );

    // Initial state check after render (modal shows when no key in localStorage)
    const acceptBtn = await screen.findByRole("button", { name: /Qabul qilish/i });
    expect(acceptBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);
    expect(localStorage.getItem("designora_cookie_consent")).toBe("accepted");
  });
});
