import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import GamificationSection from "../components/GamificationSection";
import ReferralSection from "../components/ReferralSection";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";

function formatDate(value) {
  return new Date(value).toLocaleDateString("uz-UZ", {
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
    authApi.dashboard(token).then(setDashboard).catch((e) => setError(e.message));
  }, [token]);

  const displayName = user?.name || user?.full_name || "Designora student";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-6 rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ background: "var(--amber)" }}>{initials}</div>
            <p className="label mt-4">Profil</p>
            <h1 className="font-serif text-xl font-semibold text-ink">{displayName}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{user?.email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span style={{ color: "var(--muted)" }}>Rol</span><span className="font-semibold text-ink">{user?.role === "admin" ? "Administrator" : user?.role === "instructor" ? "Instruktor" : "Talaba"}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--muted)" }}>Qo‘shilgan</span><span className="font-semibold text-ink">{user?.created_at ? formatDate(user.created_at) : "—"}</span></div>
          </div>

          <Link to="/portfolio-studio" className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-bold text-white" style={{ background: "var(--ink)" }}>
            Portfolio Studio <span aria-hidden>→</span>
          </Link>

          {user?.id && <Link to={`/portfolio/${user.id}`} target="_blank" className="block text-center text-sm font-semibold" style={{ color: "var(--muted)" }}>Public portfolio ↗</Link>}
          {error && <p className="rounded-xl px-4 py-2.5 text-xs" style={{ background: "#fff0ef", color: "#c0392b" }}>{error}</p>}
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <p className="label mb-2">Keyingi qadam</p>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="font-serif text-lg font-semibold text-ink">Eng yaxshi ishlaringizni ko‘rsating</h2><p className="mt-2 max-w-2xl text-sm leading-7" style={{ color: "var(--ink-60)" }}>Baholangan topshiriqlarni professional case study’ga aylantiring va bitta public havola bilan ulashing.</p></div>
              <Link to="/portfolio-studio" className="btn-primary">Portfolio yaratish</Link>
            </div>
          </div>

          <GamificationSection />

          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <p className="label mb-2">Boshqaruv ma’lumotlari</p>
            <h2 className="font-serif text-lg font-semibold text-ink">Shaxsiy ko‘rinish</h2>
            {dashboard ? <div className="mt-4 grid gap-4 sm:grid-cols-2">{dashboard.metrics.map((metric) => <div key={metric.label} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}><p className="text-xs" style={{ color: "var(--muted)" }}>{metric.label}</p><p className="mt-1 font-serif text-2xl font-semibold text-ink">{metric.value}</p></div>)}</div> : <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>Boshqaruv maydoni tayyorlanmoqda...</p>}
          </div>

          <ReferralSection />
        </div>
      </div>
    </section>
  );
}
