import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyticsApi, formatPrice } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, Spinner } from "../components/ui";

const BAR_COLORS = ["#7c3aed", "#a855f7", "#4f46e5", "#ec4899", "#8b5cf6"];

// Voronka bosqichlari uchun o'qiladigan nomlar.
const FUNNEL_LABELS = {
  course_view: "Ko'rishlar",
  enroll: "Yozilish",
  paid: "To'lov",
};

function KpiCard({ label, value, hint }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-1.5 font-serif text-2xl font-semibold text-ink">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {subtitle}
        </p>
      )}
      <div className="mt-5 h-72 w-full">{children}</div>
    </div>
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
      .then((res) => active && setData(res))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (loading) {
    return (
      <section className="shell flex justify-center py-24">
        <Spinner />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="shell py-24">
        <EmptyState
          title="Dashboard ochilmadi"
          description={
            error ||
            "Bu sahifa faqat admin uchun. Ruxsatingiz yo'q bo'lishi mumkin."
          }
        />
        <div className="mt-6 text-center">
          <Link to="/profil" className="btn-outline">
            ← Profilga qaytish
          </Link>
        </div>
      </section>
    );
  }

  const rev = data.revenue ?? {};
  const users = data.users ?? {};
  const courses = data.courses ?? {};
  const funnel = data.funnel ?? [];
  const topCourses = data.top_courses ?? [];
  const events = data.events ?? {};

  const funnelChart = funnel.map((f) => ({
    name: FUNNEL_LABELS[f.step] ?? f.step,
    count: f.count || 0,
    pct: f.pct_from_top ?? 0,
  }));
  const eventsChart = Object.entries(events).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin paneli</p>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Platforma dashboard
          </h1>
        </div>
        <Link to="/profil" className="btn-outline">
          Profil
        </Link>
      </div>

      {/* KPI kartalar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Sof daromad"
          value={formatPrice(rev.net_revenue ?? 0)}
          hint={`${rev.paid_orders ?? 0} ta to'lov`}
        />
        <KpiCard
          label="Foydalanuvchilar"
          value={users.total ?? 0}
          hint={`${users.active ?? 0} faol · +${users.new_30d ?? 0} (30 kun)`}
        />
        <KpiCard
          label="Kurslar"
          value={courses.total ?? 0}
          hint={`${courses.published ?? 0} ta chop etilgan`}
        />
        <KpiCard label="Yozilishlar" value={data.enrollments ?? 0} />
      </div>

      {/* Grafiklar */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Konversiya voronkasi"
          subtitle="Ko'rish → yozilish → to'lov"
        >
          {funnelChart.length === 0 ? (
            <EmptyState title="Hodisa yo'q" description="Voronka bo'sh." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelChart}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                  width={50}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v, _n, p) => [
                    `${v} (${p?.payload?.pct ?? 0}%)`,
                    "Soni",
                  ]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnelChart.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Hodisalar taqsimoti"
          subtitle="Nom bo'yicha hodisalar soni"
        >
          {eventsChart.length === 0 ? (
            <EmptyState
              title="Hodisa yo'q"
              description="Hali hodisa yozilmagan."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={eventsChart}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  width={110}
                />
                <Tooltip formatter={(v) => [v, "Soni"]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Top kurslar */}
      <div
        className="mt-8 rounded-2xl border p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-serif text-lg font-semibold text-ink">
          Top kurslar (o'quvchilar bo'yicha)
        </h2>
        {topCourses.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Hozircha kurs yo'q.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Kurs</th>
                  <th className="pb-3 text-right font-medium">O'quvchilar</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((c, i) => (
                  <tr
                    key={c.course_id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="py-3" style={{ color: "var(--muted)" }}>
                      {i + 1}
                    </td>
                    <td className="py-3 font-medium text-ink">
                      <Link
                        to={`/kurslar/${c.course_id}`}
                        className="hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="py-3 text-right font-semibold text-ink">
                      {c.students_count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
