import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../lib/api";

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

  return (
    <section className="shell py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left — user card */}
        <div className="card rounded-2xl p-6 sm:p-8">
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-8">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl font-serif text-2xl font-semibold text-white shrink-0"
              style={{ background: "var(--forest)" }}
            >
              {initials}
            </div>
            <div>
              <p className="label mb-1">Profil</p>
              <h1 className="font-serif text-3xl font-semibold text-ink">
                {user?.full_name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
              <div
                key={label}
                className="rounded-xl px-4 py-4"
                style={{ background: "var(--surface)" }}
              >
                <p className="text-xs text-muted mb-1">{label}</p>
                <p className="font-semibold text-ink">{val}</p>
              </div>
            ))}
          </div>

          {error && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#fff0ef", color: "#c0392b" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Status banner */}
          <div
            className="rounded-2xl p-6 sm:p-8 text-white"
            style={{ background: "var(--forest)" }}
          >
            <p className="label-amber mb-2">Tavsiya</p>
            <h2 className="font-serif text-3xl font-semibold mb-3">
              Profilingiz muvaffaqiyatli ishlayapti
            </h2>
            <p
              className="text-sm leading-7"
              style={{ color: "rgba(255,255,255,0.68)" }}
            >
              JWT asosidagi himoyalangan so'rov orqali ma'lumotlaringiz xavfsiz
              va barqaror tarzda yuklandi.
            </p>
          </div>

          {/* Dashboard metrics */}
          <div className="card rounded-2xl p-6 sm:p-8">
            <p className="label mb-3">Boshqaruv ma'lumotlari</p>
            <h2 className="font-serif text-3xl font-semibold text-ink mb-5">
              Shaxsiy ko'rinish
            </h2>
            {dashboard ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {dashboard.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl px-4 py-4"
                    style={{ background: "var(--surface)" }}
                  >
                    <p className="text-xs text-muted mb-1">{m.label}</p>
                    <p className="font-serif text-xl font-semibold text-ink">
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl px-5 py-4 text-sm"
                style={{ background: "var(--surface)", color: "var(--muted)" }}
              >
                Boshqaruv maydoni tayyorlanmoqda...
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
