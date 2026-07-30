import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applyInstructor } from "../lib/authExtra";

const INSTRUCTOR_ROLES = ["instructor", "admin", "superadmin"];
export default function InstructorApplyPage() {
  const navigate = useNavigate();
  const { user, token, loading, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: "", bio: "", portfolio_url: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isInstructor = Boolean(user && INSTRUCTOR_ROLES.includes(user.role));
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated)
      navigate("/?modal=login", {
        replace: true,
        state: { from: "/instruktor-boshlash" },
      });
    else if (isInstructor) navigate("/instruktor-panel", { replace: true });
  }, [loading, isAuthenticated, isInstructor, navigate]);
  useEffect(() => {
    if (user)
      setForm((p) => ({
        ...p,
        name: p.name || user.name || "",
        bio: p.bio || user.bio || "",
        portfolio_url: p.portfolio_url || user.website || "",
      }));
  }, [user]);
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await applyInstructor(token, {
        name: form.name,
        bio: form.bio,
        portfolio_url: form.portfolio_url || undefined,
      });
      setError(result.message || "Ariza yuborildi.");
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }
  if (loading || !isAuthenticated || isInstructor)
    return (
      <section className="shell py-16 flex min-h-[50vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--ink-60)" }}>
          Yuklanmoqda...
        </p>
      </section>
    );
  return (
    <section className="shell py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className="max-w-lg">
          <p className="label mb-3">O'qituvchi bo'lish</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-tight mb-5">
            Bilimingizni ulashing, daromad qiling
          </h1>
          <p
            className="text-base leading-8 mb-6"
            style={{ color: "var(--ink-60)" }}
          >
            Ariza yuborilgach, admin ko'rib chiqadi. Tasdiqlangandan keyin
            instruktor paneli ochiladi.
          </p>
        </div>
        <div className="card rounded-2xl p-6 sm:p-8 lg:p-10">
          <h2 className="font-serif text-3xl font-semibold text-ink mb-2">
            Ariza to'ldiring
          </h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Ism va familiya"
              minLength={2}
              maxLength={100}
              required
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="input-field min-h-[110px] resize-y"
              placeholder="Tajribangiz va nimani o'rgatishingiz haqida"
              minLength={10}
              maxLength={500}
              required
            />
            <input
              type="url"
              value={form.portfolio_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, portfolio_url: e.target.value }))
              }
              className="input-field"
              placeholder="Portfolio havolasi (ixtiyoriy)"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-dark w-full py-3.5 justify-center"
            >
              {submitting ? "Yuborilmoqda..." : "Ariza yuborish"}
            </button>
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "#eefaf0", color: "#257a35" }}
              >
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
