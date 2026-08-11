import { useEffect, useState } from "react";
import { accountApi } from "../lib/accountApi";
import { formatPrice } from "../lib/api";

function date(value) { return value ? new Date(value).toLocaleDateString("uz-UZ") : "—"; }

export default function PaymentHistoryPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { accountApi.paymentHistory().then(setItems).catch((e) => setError(e.message)); }, []);
  return <section className="shell py-16 sm:py-20"><p className="label">Hisob-kitoblar</p><h1 className="mt-3 font-serif text-4xl font-semibold text-ink">To‘lovlar tarixi</h1><p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--muted)" }}>Buyurtmalar, chegirmalar va to‘lov holati bir joyda.</p>{error && <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{items === null && !error && <p className="mt-10 text-sm" style={{ color: "var(--muted)" }}>To‘lovlar yuklanmoqda...</p>}{items?.length === 0 && <div className="mt-10 rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: "var(--border)" }}><p className="font-semibold text-ink">Hali buyurtmalar yo‘q</p><p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Kurs tanlaganingizdan keyin tarix shu yerda ko‘rinadi.</p></div>}<div className="mt-10 overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "var(--border)" }}><div className="divide-y">{items?.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold text-ink">{item.course_title || `Buyurtma #${item.id}`}</p><p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{date(item.created_at)} · {item.provider || "—"}</p></div><div className="text-right"><p className="font-semibold text-ink">{formatPrice(item.amount)}</p><p className={`mt-1 text-xs font-bold ${item.status === "paid" ? "text-emerald-600" : item.status === "cancelled" ? "text-red-600" : "text-amber-600"}`}>{item.status}</p></div></div>)}</div></div></section>;
}
