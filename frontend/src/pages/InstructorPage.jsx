import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { instructorsApi } from "../lib/api";
import SearchResultCard from "../components/SearchResultCard";
import { EmptyState, Spinner } from "../components/ui";

export default function InstructorPage() {
  const { instructorId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    instructorsApi
      .get(instructorId)
      .then((res) => active && setData(res))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [instructorId]);

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
          title="Instruktor topilmadi"
          description={error || "Bunday instruktor mavjud emas yoki o'chirilgan."}
        />
        <div className="mt-6 text-center">
          <Link to="/kurslar" className="btn-outline">
            ← Kataloga qaytish
          </Link>
        </div>
      </section>
    );
  }

  const initials = data.name?.charAt(0)?.toUpperCase() ?? "D";
  const courses = data.courses ?? [];
  const stats = [
    { label: "Kurslar", value: data.courses_count ?? courses.length },
    { label: "O'quvchilar", value: data.total_students ?? 0 },
    { label: "O'rtacha reyting", value: Number(data.avg_rating ?? 0).toFixed(1) },
  ];

  return (
    <section className="shell py-16 sm:py-20">
      {/* Profil kartasi */}
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ background: "var(--amber)" }}
            >
              {initials}
            </div>
          )}

          <div className="flex-1">
            <p className="label">Instruktor</p>
            <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
              {data.name}
            </h1>
            {data.location && (
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                📍 {data.location}
              </p>
            )}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-medium"
                style={{ color: "var(--brand)" }}
              >
                {data.website}
              </a>
            )}
          </div>
        </div>

        {data.bio && (
          <p
            className="mt-6 text-sm leading-7"
            style={{ color: "var(--ink-60)" }}
          >
            {data.bio}
          </p>
        )}

        {/* Statistika */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="font-serif text-2xl font-semibold text-ink">
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kurslar */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-semibold text-ink">
          {data.name} kurslari
        </h2>
        {courses.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Hozircha kurs yo'q"
              description="Bu instruktor hali kurs chop etmagan."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <SearchResultCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
