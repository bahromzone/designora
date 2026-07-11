import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, formatPrice } from "../lib/api";

function Metric({ label, value }) {
  return (
    <article className="card rounded-2xl p-5">
      <span className="text-sm text-gray-500">{label}</span>
      <strong className="mt-2 block text-3xl">{value}</strong>
    </article>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
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
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><Spinner /></div>;
  if (error || !data) return <div className="shell py-12"><EmptyState title="Admin dashboard yuklanmadi" description={error} /><button className="btn-primary mt-4" onClick={load}>Qayta urinish</button></div>;

  const revenue = data.revenue ?? {};
  const users = data.users ?? {};
  const courses = data.courses ?? {};

  return (
    <main className="shell py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="label">Admin paneli</p><h1 className="mt-2 text-4xl font-extrabold">Platforma dashboard</h1></div>
        <Link className="btn-outline" to="/profil">Profil</Link>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Daromad" value={formatPrice(revenue.net_revenue ?? 0)} />
        <Metric label="Foydalanuvchilar" value={users.total ?? 0} />
        <Metric label="Faol foydalanuvchilar" value={users.active ?? 0} />
        <Metric label="Chop etilgan kurslar" value={courses.published ?? 0} />
      </section>
      <section className="card mt-6 rounded-2xl p-6">
        <h2 className="text-xl font-bold">Top kurslar</h2>
        <div className="mt-4 grid gap-3">
          {(data.top_courses ?? []).map((course, index) => (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4" key={course.course_id}>
              <strong>{index + 1}. {course.title}</strong>
              <span>{course.students_count ?? 0} o'quvchi</span>
            </div>
          ))}
          {!data.top_courses?.length && <p className="text-gray-500">Hali statistika yo'q.</p>}
        </div>
      </section>
    </main>
  );
}
