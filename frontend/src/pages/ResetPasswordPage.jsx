import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resetPassword } from "../lib/authExtra";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (form.password.length < 8) {
      return "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";
    }
    if (!/[A-Z]/.test(form.password)) {
      return "Parolda kamida 1 ta katta harf bo'lishi kerak.";
    }
    if (!/[0-9]/.test(form.password)) {
      return "Parolda kamida 1 ta raqam bo'lishi kerak.";
    }
    if (form.password !== form.confirm) {
      return "Parollar mos kelmadi.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await resetPassword(token, form.password);
      // Backend yangi access-token qaytaradi — foydalanuvchini darhol kiritamiz.
      if (res?.access_token) {
        loginWithToken(res.access_token);
      }
      navigate(res?.redirect ?? "/profil", { replace: true });
    } catch (err) {
      setError(err.message || "Token yaroqsiz yoki muddati o'tgan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <section className="shell py-12 sm:py-16">
        <div className="mx-auto max-w-md card rounded-2xl p-6 sm:p-8 lg:p-10">
          <h2 className="font-serif text-3xl font-semibold text-ink mb-3">
            Havola yaroqsiz
          </h2>
          <p
            className="text-sm leading-7 mb-6"
            style={{ color: "var(--ink-60)" }}
          >
            Parolni tiklash havolasi to'liq emas yoki muddati o'tgan. Iltimos,
            qaytadan urinib ko'ring.
          </p>
          <Link
            to="/forgot-password"
            className="font-semibold text-ink underline underline-offset-2 text-sm"
          >
            Yangi havola so'rash
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell py-12 sm:py-16">
      <div className="mx-auto max-w-md card rounded-2xl p-6 sm:p-8 lg:p-10">
        <p className="label mb-3">Parolni tiklash</p>
        <h2 className="font-serif text-4xl font-semibold text-ink mb-2">
          Yangi parol o'rnating
        </h2>
        <p
          className="text-sm leading-7 mb-8"
          style={{ color: "var(--ink-60)" }}
        >
          Kamida 8 ta belgi, 1 ta katta harf va 1 ta raqamdan iborat kuchli
          parol tanlang.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">
              Yangi parol
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              className="input-field"
              placeholder="Kamida 8 ta belgi"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">
              Parolni tasdiqlang
            </span>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) =>
                setForm((p) => ({ ...p, confirm: e.target.value }))
              }
              className="input-field"
              placeholder="Parolni qayta kiriting"
              required
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
            {submitting ? "Saqlanmoqda..." : "Parolni yangilash"}
          </button>
        </form>
      </div>
    </section>
  );
}
