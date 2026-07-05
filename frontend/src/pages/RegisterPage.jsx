
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fashionImages } from "../data/fashionImages";

export default function RegisterPage() {
  const navigate       = useNavigate();
  const { register }   = useAuth();
  // ✅ TUZATILDI: full_name → username (backend RegisterRequest shunday kutadi)
  const [form,         setForm]      = useState({ username: "", email: "", password: "" });
  const [error,        setError]     = useState("");
  const [submitting,   setSubmitting]= useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      // ✅ TUZATILDI: recaptcha_token — backendda majburiy maydon.
      // Dev rejimida tekshirilmaydi (verify_recaptcha True qaytaradi),
      // production'da real reCAPTCHA token olish kerak bo'ladi.
      await register({ ...form, recaptcha_token: "" });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left — form */}
        <div className="card rounded-2xl p-6 sm:p-8 lg:p-10">
          <p className="label mb-3">Ro'yxatdan o'tish</p>
          <h1 className="font-serif text-4xl font-semibold text-ink mb-2">
            Premium maydonga qo'shiling
          </h1>
          <p className="text-sm leading-7 mb-8" style={{ color: "var(--ink-60)" }}>
            Hisob oching va liboslar bo'yicha amaliy darslar, styling va brending yo'nalishlarini darhol boshlang.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Ism</span>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="input-field"
                placeholder="Dilnoza Rasulova"
                minLength={3}
                maxLength={50}
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Elektron pochta</span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field"
                placeholder="siz@designora.uz"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">Parol</span>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field"
                placeholder="Kamida 8 belgi, katta harf va raqam"
                minLength={8}
                maxLength={128}
                required
              />
            </label>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#fff0ef", color: "#c0392b" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 justify-center">
              {submitting ? "Hisob yaratilmoqda..." : "Ro'yxatdan o'tish ↗"}
            </button>
          </form>

          <p className="mt-6 text-sm" style={{ color: "var(--ink-60)" }}>
            Avval hisob ochganmisiz?{" "}
            <Link to="/kirish" className="font-semibold text-ink underline underline-offset-2">
              Hisobga kiring
            </Link>
          </p>
        </div>

        {/* Right — image */}
        <div
          className="relative min-h-[28rem] overflow-hidden rounded-2xl lg:min-h-[36rem]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(26,18,8,0.18),rgba(26,18,8,0.65)), url(${fashionImages[0].url})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,112,58,0.22),transparent_36%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white sm:p-10">
            <p className="label-amber mb-3">Yangi bosqich</p>
            <h2 className="font-serif text-5xl font-semibold leading-none sm:text-6xl">
              Uslubingizni tizimga aylantiring
            </h2>
            <p className="mt-5 max-w-md text-base leading-8" style={{ color: "rgba(255,255,255,0.72)" }}>
              Designora nazariya va vizual ilhomni real moda mahsulotiga olib boradigan platforma.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
