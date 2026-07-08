import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { analyticsApi, formatPrice } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import BarList from "../components/charts/BarList";
import DonutStat from "../components/charts/DonutStat";
import { EmptyState, Spinner } from "../components/ui";

const INSTRUCTOR_ROLES = ["instructor", "admin", "superadmin"];

function KpiCard({ label, value }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const { token, user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isInstructor = INSTRUCTOR_ROLES.includes(user?.role);

  const load = useCallback(() => {
    if (!token) return undefined;
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
    if (!isInstructor) {
      setLoading(false);
      return undefined;
    }
    const cleanup = load();
    return cleanup;
  }, [isInstructor, load]);

  // Rol ruxsat bermasa
  if (!isInstructor) {
    return (
      <section className="shell py-24">
        <EmptyState
          icon="🔒"
          title="Ruxsat yo'q"
          description="Bu sahifa faqat instruktor va adminlar uchun."
          action={
            <Link to="/profil" className="btn-outline">
              Profilga qaytish
            </Link>
          }
        />
      </section>
    );
  }

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
          title="Ma'lumotni yuklab bo'lmadi"
          description={error || "Keyinroq qayta urinib ko'ring."}
        />
      </section>
    );
  }

  const revenue = data.revenue || {};
  const perCourse = data.per_course || [];
  const topCourses = data.top_courses || [];

  const revenueBars = topCourses.map((c) => ({
    label: c.title,
    value: c.net_revenue || 0,
  }));
  const studentBars = perCourse
    .map((c) => ({ label: c.title, value: c.students_count || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <section className="shell py-16 sm:py-20">
      {/* Sarlavha */}
      <div className="mb-8">
        <p className="label mb-2">Instruktor paneli</p>
        <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
          Boshqaruv paneli
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Kurslaringiz bo'yicha daromad, talabalar va tugatish ko'rsatkichlari.
        </p>
      </div>

      {/* KPI kartalar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Kurslar" value={data.courses_count ?? 0} />
        <KpiCard
          label="Sof daromad"
          value={formatPrice(revenue.net_revenue ?? 0)}
        />
        <KpiCard label="To'langan buyurtmalar" value={revenue.paid_orders ?? 0} />
        <KpiCard
          label="O'rtacha buyurtma"
          value={formatPrice(revenue.average_order_value ?? 0)}
        />
      </div>

      {/* Grafiklar qatori */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Daromad bo'yicha top kurslar */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">
            Daromad bo'yicha top kurslar
          </h2>
          <BarList
            data={revenueBars}
            formatValue={(n) => formatPrice(n)}
            emptyText="Hozircha daromad yo'q"
          />
        </div>

        {/* Tugatish darajasi donut */}
        <div
          className="flex flex-col items-center justify-center rounded-2xl border p-6"
          style={{ borderColor: "var(--border)" }}
        >
          <DonutStat value={data.completion_rate ?? 0} label="Tugatish darajasi" />
          <p
            className="mt-3 text-center text-xs"
            style={{ color: "var(--muted)" }}
          >
            O'rtacha progress: {data.average_progress ?? 0}%
          </p>
        </div>
      </div>

      {/* Talabalar bo'yicha kurslar */}
      <div
        className="mt-6 rounded-2xl border p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="mb-4 font-serif text-lg font-semibold text-ink">
          Talabalar bo'yicha kurslar
        </h2>
        <BarList
          data={studentBars}
          formatValue={(n) => `${n} o'quvchi`}
          emptyText="Hozircha talaba yo'q"
        />
      </div>

      {/* Kurslar jadvali */}
      <div
        className="mt-6 overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-6 pb-3">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Barcha kurslar
          </h2>
        </div>
        {perCourse.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              title="Kurs yo'q"
              description="Siz hali kurs chop etmagansiz."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left"
                  style={{ color: "var(--muted)", background: "var(--surface)" }}
                >
                  <th className="px-6 py-3 font-medium">Kurs</th>
                  <th className="px-4 py-3 text-right font-medium">O'quvchi</th>
                  <th className="px-4 py-3 text-right font-medium">Sof daromad</th>
                  <th className="px-4 py-3 text-right font-medium">Tugatish</th>
                  <th className="px-6 py-3 text-right font-medium">Reyting</th>
                </tr>
              </thead>
              <tbody>
                {perCourse.map((c) => (
                  <tr
                    key={c.course_id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-6 py-3 font-medium text-ink">
                      <Link
                        to={`/kurslar/${c.course_id}`}
                        className="hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {c.students_count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatPrice(c.net_revenue ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {c.completion_rate ?? 0}%
                    </td>
                    <td className="px-6 py-3 text-right text-ink">
                      ⭐ {Number(c.rating_avg ?? 0).toFixed(1)}
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
