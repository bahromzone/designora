import { useCallback, useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { request } from "../lib/request";

// ✅ TUZATILDI: eski yozuvlarda refund_status NULL bo'lishi mumkin. Avval kod
// `row.refund_status === "none"` deb tekshirardi — NULL bo'lsa Refund tugmasi
// umuman chiqmasdi va status ustunida "refund: null" ko'rinardi.
const refundStatusOf = (row) => row?.refund_status || "none";

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [coupon, setCoupon] = useState({ code: "", type: "percent", value: 10 });

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = status === "all" ? "" : `?status=${status}`;
      const [o, c] = await Promise.all([
        request(`/api/admin/orders${qs}`, { token }),
        request("/api/admin/coupons", { token }),
      ]);
      setOrders(Array.isArray(o) ? o : []);
      setCoupons(Array.isArray(c) ? c : []);
    } catch (err) { setError(err.message); }
  }, [token, status]);

  useEffect(() => { load(); }, [load]);

  async function refund(id) {
    setBusyId(id); setError("");
    try { await request(`/api/admin/orders/${id}/refund`, { method: "POST", token }); await load(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  async function createCoupon(e) {
    e.preventDefault(); setError("");
    try {
      await request("/api/admin/coupons", { method: "POST", body: JSON.stringify({ ...coupon, code: coupon.code.trim().toUpperCase(), value: Number(coupon.value) }), token });
      setCoupon({ code: "", type: "percent", value: 10 });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function toggleCoupon(id) {
    setError("");
    try { await request(`/api/admin/coupons/${id}/toggle`, { method: "PATCH", token }); await load(); }
    catch (err) { setError(err.message); }
  }

  return <AdminWorkspaceShell><header className="admin-page-head"><div><div className="admin-kicker">Revenue operations</div><h1>Orders & payments</h1><p>Buyurtmalar, refund so'rovlari va kuponlarni boshqaring.</p></div></header>{error && <div className="admin-inline-error">{error}</div>}<section className="admin-section"><h2>Buyurtmalar</h2><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Barcha statuslar</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Kurs</th><th>Summa</th><th>Provider</th><th>Status</th><th>Amal</th></tr></thead><tbody>{orders.map((row) => { const refundStatus = refundStatusOf(row); return <tr key={row.id}><td>{row.user_email || `User #${row.user_id}`}</td><td>{row.course_title || "-"}</td><td>{row.amount} so'm</td><td>{row.provider || "-"}</td><td>{row.status}{refundStatus !== "none" ? ` / refund: ${refundStatus}` : ""}</td><td>{row.status === "paid" && refundStatus === "none" && <button className="admin-btn" disabled={busyId === row.id} onClick={() => refund(row.id)}>Refund so'rovi</button>}</td></tr>; })}</tbody></table>{!orders.length && <p className="admin-empty">Order topilmadi.</p>}</div></section><section className="admin-section"><h2>Kupon yaratish</h2><form className="admin-user-filters" onSubmit={createCoupon}><input required placeholder="CODE" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value })} /><select value={coupon.type} onChange={(e) => setCoupon({ ...coupon, type: e.target.value })}><option value="percent">Foiz</option><option value="fixed">So'm</option></select><input type="number" min="1" value={coupon.value} onChange={(e) => setCoupon({ ...coupon, value: e.target.value })} /><button className="admin-btn primary">Qo'shish</button></form><div className="admin-list">{coupons.map((row) => <div className="admin-list-row" key={row.id}><strong>{row.code}</strong><small>{row.type}: {row.value}, ishlatilgan: {row.used_count}, {row.is_active ? "faol" : "yopiq"}</small><button className="admin-btn" onClick={() => toggleCoupon(row.id)}>{row.is_active ? "Yopish" : "Ochish"}</button></div>)}{!coupons.length && <p className="admin-empty">Kupon yo'q.</p>}</div></section></AdminWorkspaceShell>;
}
