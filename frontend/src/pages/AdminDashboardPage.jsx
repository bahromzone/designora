import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { adminOperationsApi } from "../lib/adminApi";
import { formatPrice } from "../lib/api";
import "./AdminDashboardPage.css";

const dateTime = (value) => value ? new Date(value).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" }) : "";

function Stat({ label, value, note }) {
  return <div className="admin-stat"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await adminOperationsApi.dashboard(token)); }
    catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <main className="admin-shell" aria-busy="true"><div className="admin-skeleton admin-skeleton-title" /><div className="admin-skeleton-grid">{Array.from({ length: 6 }).map((_, index) => <div className="admin-skeleton" key={index} />)}</div></main>;
  if (error || !data) return <main className="admin-shell"><h1>Admin paneli yuklanmadi</h1><p>{error}</p><button className="btn btn-primary" type="button" onClick={load}>Qayta urinish</button></main>;

  const queues = data.queues || {};
  return (
    <main className="admin-shell">
      <header className="admin-header"><div><p className="admin-eyebrow">OPERATSIYALAR</p><h1>Platforma nazorati</h1><p>Yangilangan: {dateTime(data.generated_at)}</p></div><div className="admin-header-actions"><Link to="/profil">Profil</Link><button type="button" onClick={load}>Yangilash</button></div></header>

      <section className="admin-pulse" aria-label="Asosiy ko‘rsatkichlar">
        <Stat label="Yangi foydalanuvchilar" value={data.users.new_30d} note="so‘nggi 30 kun" />
        <Stat label="Faol o‘quvchilar" value={data.users.active_learners} note={`${data.users.total} jami`} />
        <Stat label="Enrollment" value={data.learning.enrollments} note={`+${data.learning.enrollments_30d} bu oy`} />
        <Stat label="Sof daromad" value={formatPrice(data.revenue.net)} note={`${data.revenue.paid_orders} to‘lov`} />
        <Stat label="Completion" value={`${data.learning.completion_rate}%`} note={`${data.learning.completed} yakunlangan`} />
        <Stat label="Kurslar" value={data.courses.published} note={`${data.courses.total} jami`} />
      </section>

      <section className="admin-workbench">
        <div className="admin-priority">
          <div className="admin-section-heading"><div><p className="admin-eyebrow">NAVBATLAR</p><h2>Bugun e’tibor kerak</h2></div><span>{queues.review_count + queues.report_count + data.revenue.payment_failures} ochiq</span></div>
          <div className="admin-queue-row"><strong>{queues.review_count}</strong><div><h3>Instructor review</h3><p>Talaba ishlari tekshiruv kutmoqda.</p></div><Link to="/instruktor-boshqaruv">Navbatni ochish</Link></div>
          <div className="admin-queue-row"><strong>{queues.report_count}</strong><div><h3>Reported content</h3><p>Moderator qarorini kutayotgan kontent.</p></div><Link to="/forum">Reportlarni ko‘rish</Link></div>
          <div className="admin-queue-row"><strong>{data.revenue.payment_failures}</strong><div><h3>Payment failures</h3><p>Provider yoki mijoz to‘lovi muvaffaqiyatsiz.</p></div><a href="#payment-failures">Tafsilotlar</a></div>
        </div>

        <aside className={`admin-health admin-health-${data.system.status}`}><p className="admin-eyebrow">SYSTEM HEALTH</p><div className="admin-health-status"><span aria-hidden="true" /> <h2>{data.system.status === "healthy" ? "Tizim sog‘lom" : "Tekshiruv kerak"}</h2></div><dl><div><dt>Database</dt><dd>{data.system.database}</dd></div><div><dt>Cache</dt><dd>{data.system.cache}</dd></div><div><dt>Tekshirildi</dt><dd>{dateTime(data.system.checked_at)}</dd></div></dl></aside>
      </section>

      <section className="admin-detail-grid">
        <div id="payment-failures"><div className="admin-section-heading"><h2>Oxirgi payment failure’lar</h2></div>{queues.payment_failures?.length ? <div className="admin-table-wrap"><table><thead><tr><th>Buyurtma</th><th>Provider</th><th>Summa</th><th>Sabab</th></tr></thead><tbody>{queues.payment_failures.map((row) => <tr key={row.id}><td>#{row.id}<small>{dateTime(row.created_at)}</small></td><td>{row.provider || "Noma’lum"}</td><td>{formatPrice(row.amount)}</td><td>{row.reason || row.status}</td></tr>)}</tbody></table></div> : <p className="admin-empty">Payment failure yo‘q. Aynan shunday qolaversin.</p>}</div>
        <div><div className="admin-section-heading"><h2>Audit log</h2></div>{data.audit_log?.length ? <ol className="admin-audit">{data.audit_log.map((row) => <li key={row.id}><span>{row.action}</span><small>{row.target_type}{row.target_id ? ` #${row.target_id}` : ""} · {dateTime(row.created_at)}</small></li>)}</ol> : <p className="admin-empty">Audit yozuvlari hali yo‘q.</p>}</div>
      </section>
    </main>
  );
}
