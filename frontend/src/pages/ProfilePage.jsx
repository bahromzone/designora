import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import GamificationSection from "../components/GamificationSection";
import ReferralSection from "../components/ReferralSection";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
import { authApi } from "../lib/api";
import { resolveMediaUrl } from "../lib/media";

const ROLE_LABELS = {
  superadmin: "Superadmin",
  admin: "Administrator",
  instructor: "Instruktor",
  user: "Talaba",
};

const UZBEK_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

const TEXT_FIELDS = [
  ["name", "Ism-familiya", "Ismingiz va familiyangiz"],
  ["avatar_url", "Avatar URL", "https://..."],
  ["phone", "Telefon", "998901234567"],
  ["location", "Joylashuv", "Toshkent"],
  ["website", "Veb-sayt", "https://portfolio.uz"],
];

const EMPTY_FORM = {
  name: "",
  avatar_url: "",
  phone: "",
  location: "",
  website: "",
  bio: "",
};

function toFormValues(profile) {
  const next = { ...EMPTY_FORM };
  Object.keys(EMPTY_FORM).forEach((key) => {
    next[key] = profile?.[key] ?? "";
  });
  return next;
}

function formatUzbekDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()}-${UZBEK_MONTHS[date.getMonth()]} ${date.getFullYear()}-yil`;
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([accountApi.profile(), authApi.dashboard()]).then(
      ([profileResult, statsResult]) => {
        if (!active) return;
        if (profileResult.status === "fulfilled") {
          setForm(toFormValues(profileResult.value));
        } else {
          setError(
            profileResult.reason?.message ||
              "Profil ma’lumotlarini yuklab bo‘lmadi."
          );
        }
        if (statsResult.status === "fulfilled") setDashboard(statsResult.value);
        setLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const displayName =
    form.name || user?.name || user?.full_name || "Designora student";
  const avatarSrc = resolveMediaUrl(form.avatar_url);

  function setField(key, value) {
    if (key === "avatar_url") setAvatarBroken(false);
    const nextValue = key === "phone" ? value.replace(/\D/g, "") : value;
    setForm((current) => ({ ...current, [key]: nextValue }));
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat JPG, PNG, WEBP yoki GIF rasm tanlang.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Rasm hajmi 2 MB dan oshmasligi kerak.");
      return;
    }
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const result = await accountApi.uploadAvatar(file);
      setField("avatar_url", result.avatar_url);
      setMessage("Profil rasmi yuklandi. O‘zgarishlar saqlandi.");
      try {
        await refreshProfile?.();
      } catch {
        // Upload tugadi; profilni yangilash vaqtinchalik yiqilsa ham rasm saqlandi.
      }
    } catch (e) {
      setError(e.message || "Profil rasmini yuklab bo‘lmadi.");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await accountApi.updateProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        avatar_url: form.avatar_url.trim(),
      });
      setMessage("Profil ma’lumotlari saqlandi.");
      try {
        await refreshProfile?.();
      } catch {
        // Profil saqlandi; sessiya refresh'i keyinroq qayta tiklanadi.
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside
          className="space-y-6 rounded-2xl border p-6"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              className="profile-avatar-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              aria-label="Profil rasmini almashtirish"
            >
              <span className="profile-avatar-frame">
                {avatarSrc && !avatarBroken ? (
                  <img
                    key={avatarSrc}
                    src={avatarSrc}
                    alt="Profil avatari"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarBroken(true)}
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
                <span className="profile-avatar-overlay">
                  {uploading ? "Yuklanmoqda..." : "Rasmni almashtirish"}
                </span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={uploadAvatar}
              aria-label="Profil rasmi fayli"
            />
            <p className="label mt-4">Profil</p>
            <h1 className="font-serif text-xl font-semibold text-ink">
              {displayName}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {user?.email}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>Rol</span>
              <span className="font-semibold text-ink">
                {ROLE_LABELS[user?.role] ?? "Talaba"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>Qo‘shilgan</span>
              <span className="font-semibold text-ink">
                {user?.created_at ? formatUzbekDate(user.created_at) : "—"}
              </span>
            </div>
          </div>
          <Link
            to="/portfolio"
            className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-bold text-white"
            style={{ background: "var(--ink)" }}
          >
            Portfolio Studio <span aria-hidden>→</span>
          </Link>
          {user?.id && (
            <Link
              to={`/portfolio/u/${user.id}`}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-sm font-semibold"
              style={{ color: "var(--muted)" }}
            >
              Public portfolio ↗
            </Link>
          )}
        </aside>

        <div className="space-y-6">
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={saveProfile}
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="label">Shaxsiy ma’lumotlar</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Ism-familiya, bio va aloqa ma’lumotlaringiz shu yerda saqlanadi.
            </p>
            {loading ? (
              <p role="status" className="mt-6 text-sm">
                Ma’lumotlar yuklanmoqda...
              </p>
            ) : (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {TEXT_FIELDS.map(([key, label, placeholder]) => (
                    <label className="block" key={key}>
                      <span className="mb-2 block text-sm font-semibold text-ink">
                        {label}
                      </span>
                      <input
                        className="input-field"
                        type={key === "phone" ? "tel" : "text"}
                        inputMode={key === "phone" ? "numeric" : undefined}
                        pattern={key === "phone" ? "[0-9]*" : undefined}
                        autoComplete={key === "phone" ? "tel" : undefined}
                        value={form[key]}
                        placeholder={placeholder}
                        onChange={(event) => setField(key, event.target.value)}
                        required={key === "name"}
                        minLength={key === "name" ? 2 : undefined}
                        maxLength={key === "name" ? 100 : key === "phone" ? 15 : 500}
                      />
                    </label>
                  ))}
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-ink">
                      Bio
                    </span>
                    <textarea
                      className="input-field min-h-28 resize-y"
                      value={form.bio}
                      maxLength={500}
                      onChange={(event) => setField("bio", event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    className="btn-primary"
                    disabled={saving || uploading}
                  >
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                  {message && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-sm font-medium text-emerald-700"
                    >
                      {message}
                    </p>
                  )}
                </div>
              </>
            )}
          </form>

          <GamificationSection />

          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="label mb-2">Boshqaruv ma’lumotlari</p>
            <h2 className="font-serif text-lg font-semibold text-ink">
              Shaxsiy ko‘rinish
            </h2>
            {dashboard?.metrics?.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {dashboard.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {metric.label}
                    </p>
                    <p className="mt-1 font-serif text-2xl font-semibold text-ink">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                Boshqaruv maydoni tayyorlanmoqda...
              </p>
            )}
          </div>

          <ReferralSection />
        </div>
      </div>
    </section>
  );
}
