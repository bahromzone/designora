import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, formatPrice } from "../lib/api";

const STEP_LABELS = {
  course_view: "Kurs ko'rildi",
  enroll: "Ro'yxatdan o'tdi",
  paid: "To'lov qilindi",
};

export default function AdminAnalyticsPage() {
  const { token, user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
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

  if (loading) {
    return (
      <AdminWorkspaceShell superadmin={isSuperadmin}>
        <div className="admin-section">
          <Spinner />
        </div>
      </AdminWorkspaceShell>
    );
  }

  if (error || !data) {
    return (
      <AdminWorkspaceShell superadmin={isSuperadmin}>
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
    <AdminWorkspaceShell superadmin={isSuperadmin}>
      <header className="admin-page-head">
        <div>
          <div className="admin-kicker">Analytics</div>
          <h1>Platforma analitikasi</h1>
          <p>Konversiya voronkasi, daromad va hodisalar bir ekranda.</p>
        </div>
        <div className="admin-actions">
          <Link className="admin-btn" to="/admin">
            Overview
          </Link>
          <button className="admin-btn primary" onClick={load}>
            Yangilash
          </button>
        </div>
      </header>

      <section className="admin-stat-grid">
        <article className="admin-stat">
          <small>Net revenue</small>
          <strong>{formatPrice(revenue.net_verue ?? revenue.net_revenue ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>O'rtacha chek</small>
          <strong>{formatPrice(revenue.average_order_value ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>To'langan buyurtma</small>
          <strong>{revenue.paid_orders ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Chegirmalar</small>
          <strong>{formatPrice(revenue.discounts ?? 0)}</strong>
        </article>
        <article className="admin-stat">
          <small>Yangi user (30 kun)</small>
          <strong>{users.new_30d ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Jami enrollment</small>
          <strong>{data.enrollments ?? 0}</strong>
        </article>
        <article className="admin-stat">
          <small>Faol / jami user</small>
          <strong>
            {users.active ?? 0} / {users.total ?? 0}
          </strong>
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
        {funnel.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bosqich</th>
                  <th>Soni</th>
                  <th>Oldingidan</th>
                  <th>Boshidan</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((step) => (
                  <tr key={step.step}>
                    <td>
                      <strong>{STEP_LABELS[step.step] ?? step.step}</strong>
                    </td>
                    <td>{step.count ?? 0}</td>
                    <td>{step.pct_from_prev ?? 0}%</td>
                    <td>{step.pct_from_top ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Voronka uchun hali ma'lumot yo'q.</p>
        )}
      </section>

      <section className="admin-section">
        <h2>Top kurslar</h2>
        <div className="admin-list">
          {(data.top_courses ?? []).map((course, index) => (
            <div className="admin-list-row" key={course.course_id}>
              <strong>
                {index + 1}. {course.title}
              </strong>
              <small>{course.students_count ?? 0} o'quvchi</small>
            </div>
          ))}
          {!data.top_courses?.length && (
            <p className="admin-empty">Hali statistika yo'q.</p>
          )}
        </div>
      </section>

      <section className="admin-section">
        <h2>Hodisalar</h2>
        <div className="admin-list">
          {events.map(([name, count]) => (
            <div className="admin-list-row" key={name}>
              <strong>{name}</strong>
              <small>{count}</small>
            </div>
          ))}
          {!events.length && (
            <p className="admin-empty">Hali hodisa yozilmagan.</p>
          )}
        </div>
      </section>
    </AdminWorkspaceShell>
  );
}
