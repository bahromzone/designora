import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fashionImages } from "../data/fashionImages";

export default function LoginPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { login }  = useAuth();
  const [form,      setForm]      = useState({ email: "", password: "" });
  const [error,     setError]     = useState("");
  const [submitting,setSubmitting]= useState(false);

  const redirectTo = location.state?.from ?? "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell py-12 sm:py-16">
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left — image */}
        <div
          className="relative min-h-[28rem] overflow-hidden rounded-2xl lg:min-h-[36rem]"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(26,18,8,0.18),rgba(26,18,8,0.65)), url(${fashionImages[1].url})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,112,58,0.22),transparent_36%)]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white sm:p-10">
            <p className="label-amber mb-3">Designora</p>
            <h1 className="font-serif text-5xl font-semibold leading-none sm:text-6xl">
              Premium uslubga qayting
            </h1>
            <p className="mt-5 max-w-md text-base leading-8" style={{ color: "rgba(255,255,255,0.72)" }}>
              Hisobingizga kirib, shaxsiy tavsiyalar va moda kurslari maydonini davom ettiring.
            </p>
          </div>
        </div>

        {/* Right — form */}
        <div className="card rounded-2xl p-6 sm:p-8 lg:p-10">
          <p className="label mb-3">Kirish</p>
          <h2 className="font-serif text-4xl font-semibold text-ink mb-2">Hisobingizni oching</h2>
          <p className="text-sm leading-7 mb-8" style={{ color: "var(--ink-60)" }}>
            Elektron pochta va parol orqali xavfsiz kirish amalga oshiriladi.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                placeholder="Kamida 8 ta belgi"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#fff0ef", color: "#c0392b" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-dark w-full py-3.5 justify-center">
              {submitting ? "Kirish amalga oshirilmoqda..." : "Kirish ↗"}
            </button>
          </form>

          <p className="mt-6 text-sm" style={{ color: "var(--ink-60)" }}>
            Hali hisob yo'qmi?{" "}
            <Link to="/royxatdan-otish" className="font-semibold text-ink underline underline-offset-2">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}