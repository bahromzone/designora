import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applyInstructor } from "../lib/authExtra";

const INSTRUCTOR_ROLES = ["instructor", "admin", "superadmin"];

export default function InstructorApplyPage() {
  const navigate = useNavigate();
  const { user, token, loading, isAuthenticated, refreshProfile } = useAuth();

  const [form, setForm] = useState({ name: "", bio: "", portfolio_url: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isInstructor = Boolean(user && INSTRUCTOR_ROLES.includes(user.role));

  // Auth holatiga qarab yo'naltirish:
  // - login qilmagan  -> login modal
  // - allaqachon instruktor/admin -> instruktor paneli
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/?modal=login", {
        replace: true,
        state: { from: "/instruktor-boshlash" },
      });
      return;
    }
    if (isInstructor) {
      navigate("/instruktor-panel", { replace: true });
    }
  }, [loading, isAuthenticated, isInstructor, navigate]);

  // Foydalanuvchi ma'lumotlari kelganda formani oldindan to'ldiramiz.
  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        name: p.name || user.name || "",
        bio: p.bio || user.bio || "",
        portfolio_url: p.portfolio_url || user.website || "",
      }));
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await applyInstructor(token, {
        name: form.name,
        bio: form.bio,
        portfolio_url: form.portfolio_url || undefined,
      });
      // Rol o'zgardi — profilni yangilaymiz, so'ng panelga o'tamiz.
      await refreshProfile();
      navigate("/instruktor-panel", { replace: true });
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  // Yo'naltirish sodir bo'lguncha (yoki profil yuklanayotganda) bo'sh holat.
  if (loading || !isAuthenticated || isInstructor) {
    return (
      <section className="shell py-16 flex min-h-[50vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--ink-60)" }}>
          Yuklanmoqda...
        </p>
      </section>
    );
  }

  return (
    <section className="shell py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        {/* Chap — tavsif */}
        <div className="max-w-lg">
          <p className="label mb-3">O'qituvchi bo'lish</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-tight mb-5">
            Bilimingizni ulashing, daromad qiling
          </h1>
          <p
            className="text-base leading-8 mb-6"
            style={{ color: "var(--ink-60)" }}
          >
            Designora'da instruktor bo'ling: o'z kurslaringizni yarating,
            darslar va modullar qo'shing, o'quvchilar bilan bevosita ishlang.
            Ariza to'ldirilgach, instruktor paneli darhol ochiladi.
          </p>
          <ul className="space-y-3 text-sm" style={{ color: "var(--ink-60)" }}>
            {[
              "O'z kurslaringizni yarating va chop eting",
              "Modul va darslarni bemalol boshqaring",
              "O'quvchilar sonini va daromadni kuzating",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#813BFF]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* O'ng — ariza formasi */}
        <div className="card rounded-2xl p-6 sm:p-8 lg:p-10">
          <h2 className="font-serif text-3xl font-semibold text-ink mb-2">
            Ariza to'ldiring
          </h2>
          <p
            className="text-sm leading-7 mb-8"
            style={{ color: "var(--ink-60)" }}
          >
            Bir necha soniyada instruktorlik faollashadi.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">
                Ism va familiya
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="input-field"
                placeholder="Masalan: Dilnoza Rasulova"
                minLength={2}
                maxLength={100}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">
                Qisqacha ma'lumot (nima o'rgatasiz)
              </span>
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bio: e.target.value }))
                }
                className="input-field min-h-[110px] resize-y"
                placeholder="Tajribangiz, yo'nalishingiz va nimani o'rgatmoqchiligingiz haqida qisqacha (kamida 10 belgi)."
                minLength={10}
                maxLength={500}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">
                Portfolio havolasi (ixtiyoriy)
              </span>
              <input
                type="url"
                value={form.portfolio_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, portfolio_url: e.target.value }))
                }
                className="input-field"
                placeholder="https://behance.net/siz yoki shaxsiy sayt"
              />
            </label>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "#fff0ef", color: "#c0392b" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-dark w-full py-3.5 justify-center"
            >
              {submitting ? "Yuborilmoqda..." : "Instruktor bo'lish"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
