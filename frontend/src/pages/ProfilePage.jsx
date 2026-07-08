import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";
import GamificationSection from "../components/GamificationSection";
import ReferralSection from "../components/ReferralSection";

const INSTRUCTOR_ROLES = ["instructor", "admin", "superadmin"];

function formatDate(d) {
  return new Date(d).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi
      .dashboard(token)
      .then(setDashboard)
      .catch((e) => setError(e.message));
  }, [token]);

  const initials = user?.full_name?.charAt(0)?.toUpperCase() ?? "D";
  const isInstructor = INSTRUCTOR_ROLES.includes(user?.role);

  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left — user card */}
        <aside
          className="space-y-6 rounded-2xl border p-6"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ background: "var(--amber)" }}
            >
              {initials}
            </div>
            <p className="label mt-4">Profil</p>
            <h1 className="font-serif text-xl font-semibold text-ink">
              {user?.full_name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {user?.email}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Rol",
                val: user?.role === "admin" ? "Administrator" : "Foydalanuvchi",
              },
              {
                label: "Qo'shilgan",
                val: user?.created_at ? formatDate(user.created_at) : "—",
              },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span className="font-semibold text-ink">{val}</span>
              </div>
            ))}
          </div>

          {/* Instruktor/admin — dashboard'ga kirish */}
          {isInstructor && (
            <Link
              to="/instruktor-panel"
              className="block w-full rounded-full px-6 py-3 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--amber)" }}
            >
              📊 Instruktor paneli
            </Link>
          )}

          {error && (
            <p
              className="rounded-xl px-4 py-2.5 text-xs"
              style={{ background: "#fff0ef", color: "#c0392b" }}
            >
              {error}
            </p>
          )}
        </aside>

        {/* Right */}
        <div className="space-y-6">
          {/* Status banner */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="label mb-2">Tavsiya</p>
            <h2 className="font-serif text-lg font-semibold text-ink">
              Profilingiz muvaffaqiyatli ishlayapti
            </h2>
            <p
              className="mt-2 text-sm leading-7"
              style={{ color: "var(--ink-60)" }}
            >
              JWT asosidagi himoyalangan so'rov orqali ma'lumotlaringiz xavfsiz
              va barqaror tarzda yuklandi.
            </p>
          </div>

          {/* Gamifikatsiya — ball, daraja, nishon, leaderboard */}
          <GamificationSection />

          {/* Dashboard metrics */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="label mb-2">Boshqaruv ma'lumotlari</p>
            <h2 className="font-serif text-lg font-semibold text-ink">
              Shaxsiy ko'rinish
            </h2>
            {dashboard ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {dashboard.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {m.label}
                    </p>
                    <p className="mt-1 font-serif text-2xl font-semibold text-ink">
                      {m.value}
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

          {/* Referral */}
          <ReferralSection />
        </div>
      </div>
    </section>
  );
}
