import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="shell py-16 sm:py-24">
      <div className="card rounded-2xl p-10 sm:p-16 text-center max-w-2xl mx-auto">
        <p className="label mb-3">404 — Topilmadi</p>
        <h1 className="font-serif text-5xl font-semibold text-ink mb-5">
          Bu sahifa mavjud emas
        </h1>
        <p
          className="text-base leading-8 mb-8"
          style={{ color: "var(--ink-60)" }}
        >
          Kerakli bo'limga qaytish uchun bosh sahifaga yoki kurslar ro'yxatiga
          o'ting.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-dark py-3 px-6">
            Bosh sahifa
          </Link>
          <Link to="/kurslar" className="btn-outline py-3 px-6">
            Kurslar
          </Link>
        </div>
      </div>
    </section>
  );
}
