import { useEffect, useState } from "react";
import { accountApi } from "../lib/accountApi";

export default function CertificatesPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    accountApi.certificates().then(setItems).catch((e) => setError(e.message));
  }, []);
  return (
    <section className="shell py-16 sm:py-20">
      <p className="label">Tasdiqlangan natijalar</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">Sertifikatlarim</h1>
      <p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--muted)" }}>Kurslarni yakunlaganingiz sari verifikatsiya qilinadigan sertifikatlaringiz shu yerda jamlanadi.</p>
      {error && <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {items === null && !error && <p className="mt-10 text-sm" style={{ color: "var(--muted)" }}>Sertifikatlar yuklanmoqda...</p>}
      {items?.length === 0 && <div className="mt-10 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}><p className="font-semibold text-ink">Hali sertifikat yo‘q</p><p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Kursni 100% tugating va yakuniy testlardan o‘ting.</p></div>}
      <div className="mt-10 grid gap-5 md:grid-cols-2">{items?.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: "var(--border)" }}><p className="label">{item.grade || "Bitirildi"}</p><h2 className="mt-3 font-serif text-2xl font-semibold text-ink">{item.title}</h2><p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>Serial: {item.serial || "tayyorlanmoqda"}</p><div className="mt-6 flex flex-wrap gap-3"><a className="btn-outline" href={`/verify/${item.verification_code}`}>Tekshirish</a>{item.pdf_url ? <a className="btn-primary" href={item.pdf_url} target="_blank" rel="noreferrer">PDF yuklash</a> : <span className="self-center text-sm" style={{ color: "var(--muted)" }}>PDF hali tayyor emas</span>}</div></article>)}</div>
    </section>
  );
}
