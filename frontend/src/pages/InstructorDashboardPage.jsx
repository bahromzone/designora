import { useCallback, useEffect, useState } from "react";
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

// Grafiklar uchun brend palitrasi (index.css tokenlariga mos).
const BAR_COLORS = ["#7c3aed", "#a855f7", "#ec4899", "#4f46e5", "#6366f1"];

function StatCard({ label, value, hint }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// So'mni ixcham ko'rsatish (grafik o'qi uchun): 1.2M, 340K.
function compactSom(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
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
          icon="📊"
          title="Dashboard'ni ochib bo'lmadi"
          description={
            error ||
            "Bu sahifa faqat instruktor yoki admin uchun. Ruxsatingiz borligiga ishonch hosil qiling."
          }
        />
      </section>
    );
  }

  const revenue = data.revenue ?? {};
  const perCourse = data.per_course ?? [];

  // Grafik ma'lumotlari — uzun sarlavhalarni qisqartiramiz.
  const chartData = perCourse.map((c) => ({
    name: c.title?.length > 18 ? `${c.title.slice(0, 18)}…` : c.title,
    fullName: c.title,
    revenue: c.net_revenue || 0,
    students: c.students_count || 0,
  }));

  return (
    <section className="shell py-16 sm:py-20">
      <p className="label mb-2">Instruktor paneli</p>
      <h1 className="font-serif text-3xl font-semibold text-ink">
        Boshqaruv paneli
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
        Kurslaringiz bo'yicha daromad, talabalar va tugatish ko'rsatkichlari.
      </p>

      {/* KPI kartalari */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kurslar" value={data.courses_count ?? 0} />
        <StatCard
          label="Sof daromad"
          value={formatPrice(revenue.net_revenue ?? 0)}
          hint={`${revenue.paid_orders ?? 0} ta to'lov`}
        />
        <StatCard
          label="Tugatish darajasi"
          value={`${data.completion_rate ?? 0}%`}
          hint={`O'rtacha progress ${data.average_progress ?? 0}%`}
        />
        <StatCard
          label="O'rtacha chek"
          value={formatPrice(revenue.average_order_value ?? 0)}
        />
      </div>

      {perCourse.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Hozircha ma'lumot yo'q"
            description="Kurs chop etib, birinchi talabalaringizni qabul qilganingizdan so'ng bu yerda grafiklar paydo bo'ladi."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Daromad grafigi */}
          <ChartCard
            title="Kurslar bo'yicha daromad"
            subtitle="Sof daromad (so'm)"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <YAxis
                  tickFormatter={compactSom}
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(value), "Sof daromad"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Talabalar grafigi */}
          <ChartCard
            title="Kurslar bo'yicha talabalar"
            subtitle="Har kursdagi o'quvchilar soni"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--muted)" }}
                />
                <Tooltip
                  formatter={(value) => [value, "Talabalar"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Per-course jadval */}
      {perCourse.length > 0 && (
        <div
          className="mt-8 overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  <th className="px-5 py-3 font-semibold text-ink">Kurs</th>
                  <th className="px-5 py-3 font-semibold text-ink">Talabalar</th>
                  <th className="px-5 py-3 font-semibold text-ink">
                    Sof daromad
                  </th>
                  <th className="px-5 py-3 font-semibold text-ink">To'lovlar</th>
                  <th className="px-5 py-3 font-semibold text-ink">Tugatish</th>
                  <th className="px-5 py-3 font-semibold text-ink">Reyting</th>
                </tr>
              </thead>
              <tbody>
                {perCourse.map((c) => (
                  <tr
                    key={c.course_id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-5 py-3 font-medium text-ink">
                      {c.title}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--ink-60)" }}>
                      {c.students_count || 0}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--ink-60)" }}>
                      {formatPrice(c.net_revenue || 0)}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--ink-60)" }}>
                      {c.paid_orders || 0}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--ink-60)" }}>
                      {c.completion_rate || 0}%
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--ink-60)" }}>
                      ⭐ {Number(c.rating_avg || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
