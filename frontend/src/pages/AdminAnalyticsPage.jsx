import { useCallback, useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, formatPrice } from "../lib/api";

const STEP_LABELS = {
  course_view: "Kurs ko'rildi",
  enroll: "Ro'yxatdan o'tdi",
  paid: "To'lov qildi",
};

export default function AdminAnalyticsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    analyticsApi
      .admin(token)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => load(), [load]);

  const superadmin = user?.role === "superadmin";

  if (loading) {
    return (
      <AdminWorkspaceShell superadmin={superadmin}>
        <div className="admin-section">
          <Spinner />
        </div>
      </AdminWorkspaceShell>
    );
  }

  if (error || !data) {
    return (
      <AdminWorkspaceShell superadmin={superadmin}>
        <EmptyState title="Analitika yuklanmadi" description={error} />
      </AdminWorkspaceShell>
    );
  }

  const revenue = data.revenue ?? {};
  const users = data.users ?? {};
  const courses = data.courses ?? {};
  const funnel = data.funnel ?? [];
  const events = Object.entries(data.events ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <AdminWorkspaceShell superadmin={superadmin}>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Analytics</div>
          <h1>Konversiya va daromad</h1>
          <p>Voronka, daromad tarkibi va foydalanuvchi hodisalari.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn" onClick={load} type="button">
            Yangilash
          </button>
        </div>
      </header>

      <section className="admin-stat-grid">
        <article className="admin-stat">
          <small>Net revenue</small>
          <strong>{formatPrice(revenue.net_revenue ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>Gross revenue</small>
          <strong>{formatPrice(revenue.gross_revenue ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>Chegirmalar</small>
          <strong>{formatPrice(revenue.discounts ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>O&apos;rtacha chek</small>
          <strong>{formatPrice(revenue.average_order_value ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>To&apos;langan buyurtma</small>
          <strong>{revenue.paid_orders ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>30 kunda yangi user</small>
          <strong>{users.new_30d ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Enrollment</small>
          <strong>{data.enrollments ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Published / jami kurs</small>
          <strong>
            {courses.published ?? 0} / {courses.total ?? 0}
          </strong>
        </article>
      </section>

      <section className="admin-section">
        <h2>Konversiya voronkasi</h2>
        <div className="admin-list">
          {funnel.map((step) => (
            <div className="admin-list-row" key={step.step}>
              <div style={{ flex: 1 }}>
                <strong>{STEP_LABELS[step.step] ?? step.step}</strong>
                <div
                  aria-hidden="true"
                  style={{
                    marginTop: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--brand, #6366f1)",
                    width: `${Math.max(2, Math.min(100, step.pct_from_top ?? 0))}%`,
                  }}
                />
              </div>
              <small>
                {step.count} · oldingidan {step.pct_from_prev}% · boshidan{" "}
                {step.pct_from_top}%
              </small>
            </div>
          ))}
          {!funnel.length && <p>Hali voronka uchun ma&apos;lumot yo&apos;q.</p>}
        </div>
      </section>

      <section className="admin-section">
        <h2>Hodisalar</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hodisa</th>
                <th>Soni</th>
              </tr>
            </thead>
            <tbody>
              {events.map(([name, count]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!events.length && (
            <p className="admin-empty">Hali hodisa yozilmagan.</p>
          )}
        </div>
      </section>

      <section className="admin-section">
        <h2>Top kurslar</h2>
        <div className="admin-list">
          {(data.top_courses ?? []).map((course, index) => (
            <div className="admin-list-row" key={course.course_id}>
              <strong>
                {index + 1}. {course.title}
              </strong>
              <small>{course.students_count ?? 0} o&apos;quvchi</small>
            </div>
          ))}
          {!data.top_courses?.length && <p>Hali statistika yo&apos;q.</p>}
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
