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

// Grafiklar uchun binafsha palitra (dizayn tizimiga mos).
const BAR_COLORS = [
  "#7c3aed",
  "#a855f7",
  "#4f46e5",
  "#ec4899",
  "#8b5cf6",
];

// Uzun kurs nomlarini grafik o'qida qisqartirish.
function shortLabel(title, max = 14) {
  if (!title) return "";
  return title.length > max ? `${title.slice(0, max)}\u2026` : title;
}

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

export default function InstructorDashboardPage() {
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    analyticsApi
      .instructor(token)
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
            "Bu sahifa faqat instruktor va admin uchun. Ruxsatingiz yo'q bo'lishi mumkin."
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
  const perCourse = data.per_course ?? [];
  const topCourses = data.top_courses ?? [];

  const revenueChart = perCourse.map((c) => ({
    name: shortLabel(c.title),
    fullName: c.title,
    revenue: c.net_revenue || 0,
  }));
  const completionChart = perCourse.map((c) => ({
    name: shortLabel(c.title),
    fullName: c.title,
    completion: c.completion_rate || 0,
  }));

  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Instruktor paneli</p>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Dashboard
          </h1>
        </div>
        <Link to="/profil" className="btn-outline">
          Profil
        </Link>
      </div>

      {/* KPI kartalar */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Kurslar" value={data.courses_count ?? 0} />
        <KpiCard
          label="Sof daromad"
          value={formatPrice(rev.net_revenue ?? 0)}
          hint={`${rev.paid_orders ?? 0} ta to'lov`}
        />
        <KpiCard
          label="Tugatish darajasi"
          value={`${data.completion_rate ?? 0}%`}
          hint={`O'rtacha progress ${data.average_progress ?? 0}%`}
        />
        <KpiCard
          label="O'rtacha chek"
          value={formatPrice(rev.average_order_value ?? 0)}
        />
      </div>

      {perCourse.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Hozircha ma'lumot yo'q"
            description="Kurslaringiz bo'yicha savdo va progress paydo bo'lgach, grafiklar shu yerda ko'rinadi."
          />
        </div>
      ) : (
        <>
          {/* Grafiklar */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Kurslar bo'yicha daromad"
              subtitle="Sof daromad (so'm)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueChart}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={70}
                    tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    formatter={(v) => [formatPrice(v), "Daromad"]}
                    labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ""}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {revenueChart.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Kurslar bo'yicha tugatish"
              subtitle="Tugatish darajasi (%)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completionChart}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    width={40}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "Tugatish"]}
                    labelFormatter={(_, p) => p?.[0]?.payload?.fullName ?? ""}
                  />
                  <Bar
                    dataKey="completion"
                    radius={[6, 6, 0, 0]}
                    fill="#4f46e5"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top kurslar jadvali */}
          <div
            className="mt-8 rounded-2xl border p-6"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="font-serif text-lg font-semibold text-ink">
              Eng daromadli kurslar
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr style={{ color: "var(--muted)" }}>
                    <th className="pb-3 font-medium">Kurs</th>
                    <th className="pb-3 font-medium">O'quvchilar</th>
                    <th className="pb-3 font-medium">To'lovlar</th>
                    <th className="pb-3 font-medium">Tugatish</th>
                    <th className="pb-3 text-right font-medium">Daromad</th>
                  </tr>
                </thead>
                <tbody>
                  {topCourses.map((c) => (
                    <tr
                      key={c.course_id}
                      className="border-t"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="py-3 font-medium text-ink">
                        <Link
                          to={`/kurslar/${c.course_id}`}
                          className="hover:underline"
                        >
                          {c.title}
                        </Link>
                      </td>
                      <td className="py-3" style={{ color: "var(--ink-60)" }}>
                        {c.students_count ?? 0}
                      </td>
                      <td className="py-3" style={{ color: "var(--ink-60)" }}>
                        {c.paid_orders ?? 0}
                      </td>
                      <td className="py-3" style={{ color: "var(--ink-60)" }}>
                        {c.completion_rate ?? 0}%
                      </td>
                      <td className="py-3 text-right font-semibold text-ink">
                        {formatPrice(c.net_revenue ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
