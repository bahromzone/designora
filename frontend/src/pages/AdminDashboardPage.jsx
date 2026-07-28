import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, formatPrice } from "../lib/api";

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    analyticsApi.admin(token)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (loading) return <AdminWorkspaceShell><div className="admin-section"><Spinner /></div></AdminWorkspaceShell>;
  if (error || !data) return <AdminWorkspaceShell><EmptyState title="Admin workspace yuklanmadi" description={error} /></AdminWorkspaceShell>;

  const revenue = data.revenue ?? {};
  const users = data.users ?? {};
  const courses = data.courses ?? {};
  return <AdminWorkspaceShell><header className="admin-page-head"><div><div className="admin-kicker">Operations workspace</div><h1>Platforma nazorati</h1><p>Kontent, foydalanuvchilar va daromadni bir joydan boshqaring.</p></div><div className="admin-actions"><Link className="admin-btn" to="/admin/courses">Kurslar</Link><Link className="admin-btn primary" to="/profil">Profil</Link></div></header><section className="admin-stat-grid"><article className="admin-stat"><small>Net revenue</small><strong>{formatPrice(revenue.net_revenue ?? 0)}</strong></article><article className="admin-stat"><small>Jami foydalanuvchi</small><strong>{users.total ?? 0}</strong></article><article className="admin-stat"><small>Faol userlar</small><strong>{users.active ?? 0}</strong></article><article className="admin-stat"><small>Published kurslar</small><strong>{courses.published ?? 0}</strong></article></section><section className="admin-section"><h2>Top kurslar</h2><div className="admin-list">{(data.top_courses ?? []).map((course,index)=><div className="admin-list-row" key={course.course_id}><strong>{index+1}. {course.title}</strong><small>{course.students_count ?? 0} o'quvchi</small></div>)}{!data.top_courses?.length&&<p>Hali statistika yo'q.</p>}</div></section></AdminWorkspaceShell>;
}
