import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import GamificationSection from "../components/GamificationSection";
import ReferralSection from "../components/ReferralSection";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
import { authApi } from "../lib/api";

const ROLE_LABELS = {
  superadmin: "Superadmin",
  admin: "Administrator",
  instructor: "Instruktor",
  user: "Talaba",
};

// [maydon, yorliq, placeholder]
// type="url" ataylab ishlatilmaydi: brauzer "designora.uz" ni rad etib,
// formani jimgina yubormay qo'yadi. Backend faqat uzunlikni tekshiradi.
const TEXT_FIELDS = [
  ["name", "Ism", "Ismingiz"],
  ["avatar_url", "Avatar URL", "https://..."],
  ["phone", "Telefon", "+998 90 123 45 67"],
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

// Backend to'ldirilmagan maydonlarni null qaytaradi. null'ni to'g'ridan-to'g'ri
// input'ga bersak React controlled input'ni uncontrolled'ga aylantiradi.
function toFormValues(profile) {
  const next = { ...EMPTY_FORM };
  Object.keys(EMPTY_FORM).forEach((key) => {
    next[key] = profile?.[key] ?? "";
  });
  return next;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);

  // MUHIM: bu yerda AuthContext'dan `token` olinmaydi. Sessiya httpOnly
  // cookie'da va context token qaytarmaydi, shuning uchun `if (!token) return`
  // yuklashni hech qachon tugatmaydi va forma abadiy spinner'da qoladi.
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
              "Profil ma'lumotlarini yuklab bo'lmadi."
          );
        }
        // Statistika yiqilsa ham tahrirlash formasi ochilishi kerak.
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

  function setField(key, value) {
    if (key === "avatar_url") setAvatarBroken(false);
    setForm((current) => ({ ...current, [key]: value }));
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
      setMessage("Profil ma'lumotlari saqlandi.");
      // Saqlash o'tdi. Sessiya yangilanishi yiqilsa ham buni xato deb
      // ko'rsatmaymiz, aks holda foydalanuvchi saqlanmadi deb o'ylaydi.
      try {
        await refreshProfile?.();
      } catch {
        // e'tiborsiz qoldiriladi
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
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white"
              style={{ background: "var(--amber)" }}
            >
              {form.avatar_url && !avatarBroken ? (
                <img
                  key={form.avatar_url}
                  src={form.avatar_url}
                  alt="Profil avatari"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
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
                {user?.created_at ? formatDate(user.created_at) : "—"}
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
          {message && (
            <p
              role="status"
              className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {message}
            </p>
          )}
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
              Ism, avatar, bio va aloqa ma’lumotlaringiz shu yerda saqlanadi.
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
                        type="text"
                        value={form[key]}
                        placeholder={placeholder}
                        onChange={(event) => setField(key, event.target.value)}
                        required={key === "name"}
                        minLength={key === "name" ? 2 : undefined}
                        maxLength={key === "name" ? 100 : 200}
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
                <button className="btn-primary mt-6" disabled={saving}>
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
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
