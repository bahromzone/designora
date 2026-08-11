import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./ProfilePage";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
import { authApi } from "../lib/api";

vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

vi.mock("../lib/accountApi", () => ({
  accountApi: { profile: vi.fn(), updateProfile: vi.fn() },
}));

vi.mock("../lib/api", () => ({ authApi: { dashboard: vi.fn() } }));

vi.mock("../components/GamificationSection", () => ({ default: () => null }));
vi.mock("../components/ReferralSection", () => ({ default: () => null }));

const AVATAR = "https://cdn.designora.uz/avatars/1.png";

const refreshProfile = vi.fn();

const user = {
  id: 5,
  name: "Bahromjon",
  email: "bahrom@example.com",
  role: "user",
};

// Backend to'ldirilmagan maydonlarni null qaytaradi.
const profile = {
  name: "Bahromjon",
  bio: null,
  phone: null,
  location: null,
  website: null,
  avatar_url: null,
};

function renderProfile() {
  useAuth.mockReturnValue({ user, refreshProfile });
  return render(
    <MemoryRouter initialEntries={["/profil"]}>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountApi.profile.mockResolvedValue(profile);
    accountApi.updateProfile.mockResolvedValue({ message: "ok" });
    authApi.dashboard.mockResolvedValue({ metrics: [] });
    refreshProfile.mockResolvedValue(user);
  });

  it("yuklashni tugatib, tahrirlash formasini ochadi", async () => {
    // Regressiya: AuthContext `token` qaytarmaydi. Effekt token'ga bog'langan
    // bo'lsa, forma abadiy "yuklanmoqda" holatida qolardi.
    renderProfile();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Ma’lumotlar yuklanmoqda..."
    );

    expect(await screen.findByLabelText("Ism")).toHaveValue("Bahromjon");
    // null qiymatlar bo'sh satrga aylanadi, aks holda input uncontrolled bo'ladi.
    expect(screen.getByLabelText("Bio")).toHaveValue("");
    expect(screen.getByLabelText("Avatar URL")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeEnabled();
  });

  it("avatar bilan birga tozalangan qiymatlarni saqlaydi", async () => {
    renderProfile();

    fireEvent.change(await screen.findByLabelText("Ism"), {
      target: { value: "  Yangi Ism  " },
    });
    fireEvent.change(screen.getByLabelText("Avatar URL"), {
      target: { value: AVATAR },
    });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() =>
      expect(accountApi.updateProfile).toHaveBeenCalledWith({
        name: "Yangi Ism",
        bio: "",
        phone: "",
        location: "",
        website: "",
        avatar_url: AVATAR,
      })
    );
    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("Profil ma’lumotlari saqlandi.")
    ).toBeInTheDocument();
  });

  it("saqlash yiqilganda xatoni ko'rsatib, formani ochiq qoldiradi", async () => {
    accountApi.updateProfile.mockRejectedValueOnce(new Error("Server xatosi"));
    renderProfile();

    await screen.findByLabelText("Ism");
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server xatosi");
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeEnabled();
    expect(refreshProfile).not.toHaveBeenCalled();
  });

  it("profil so'rovi yiqilsa ham spinner'da qotib qolmaydi", async () => {
    accountApi.profile.mockRejectedValueOnce(new Error("Profil yuklanmadi"));
    renderProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Profil yuklanmadi"
    );
    expect(
      screen.queryByText("Ma’lumotlar yuklanmoqda...")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeInTheDocument();
  });

  it("statistika yiqilsa ham forma ishlayveradi", async () => {
    authApi.dashboard.mockRejectedValueOnce(new Error("stats down"));
    renderProfile();

    expect(await screen.findByLabelText("Ism")).toHaveValue("Bahromjon");
    expect(
      screen.getByText("Boshqaruv maydoni tayyorlanmoqda...")
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("boshqaruv metrikalarini ko'rsatadi", async () => {
    authApi.dashboard.mockResolvedValue({
      metrics: [{ label: "Ball", value: 120 }],
    });
    renderProfile();

    expect(await screen.findByText("Ball")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});
