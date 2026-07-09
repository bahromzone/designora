import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../lib/authExtra";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell py-12 sm:py-16">
      <div className="mx-auto max-w-md card rounded-2xl p-6 sm:p-8 lg:p-10">
        <p className="label mb-3">Parolni tiklash</p>
        <h2 className="font-serif text-4xl font-semibold text-ink mb-2">
          Parolni unutdingizmi?
        </h2>
        <p
          className="text-sm leading-7 mb-8"
          style={{ color: "var(--ink-60)" }}
        >
          Hisobingizga bog'langan elektron pochtani kiriting. Agar u tizimda
          mavjud bo'lsa, parolni tiklash havolasini yuboramiz.
        </p>

        {sent ? (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#eefaf0", color: "#1b7a3d" }}
          >
            Agar email tizimda mavjud bo'lsa, parolni tiklash havolasi
            yuborildi. Pochtangizni tekshiring (havola 15 daqiqa amal qiladi).
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">
                Elektron pochta
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="siz@designora.uz"
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
              {submitting ? "Yuborilmoqda..." : "Tiklash havolasini yuborish"}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm" style={{ color: "var(--ink-60)" }}>
          <Link
            to="/kirish"
            className="font-semibold text-ink underline underline-offset-2"
          >
            ← Kirishga qaytish
          </Link>
        </p>
      </div>
    </section>
  );
}
