import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { formatPrice, instructorsApi } from "../lib/api";

// Ism bo'yicha bosh harflar (avatar fallback uchun)
function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function InstructorCourseCard({ course }) {
  const rating = Number(course.rating_avg ?? 0).toFixed(1);
  const hasRating = (course.rating_count ?? 0) > 0;
  const hasStudents = (course.students_count ?? 0) > 0;

  return (
    <Link
      to={`/kurslar/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-sky-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            DA
          </div>
        )}
        {course.level ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
            {course.level}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-indigo-600">
          {course.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
          {hasRating ? <span>{rating} reyting</span> : null}
          {hasStudents ? <span>{course.students_count} o'quvchi</span> : null}
        </div>
        <div className="mt-auto pt-3 text-lg font-bold text-slate-900">
          {formatPrice(course.price)}
        </div>
      </div>
    </Link>
  );
}

export default function InstructorProfilePage() {
  const { instructorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="animate-pulse">
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-1/3 rounded bg-slate-200" />
              <div className="h-4 w-1/4 rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Instruktor topilmadi
        </h1>
        <p className="mt-2 text-slate-500">
          {error || "Bunday instruktor mavjud emas yoki o'chirilgan."}
        </p>
        <Link
          to="/kurslar"
          className="mt-6 inline-block rounded-full bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-700"
        >
          Kurslar katalogiga qaytish
        </Link>
      </div>
    );
  }

  const courses = data.courses ?? [];
  const avgRating = data.avg_rating
    ? Number(data.avg_rating).toFixed(1)
    : "0.0";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-3xl font-bold text-white shadow-md">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt={data.name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(data.name)
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            Instruktor
          </span>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{data.name}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500 sm:justify-start">
            {data.location ? <span>{data.location}</span> : null}
            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Veb-sayt
              </a>
            ) : null}
          </div>
          {data.bio ? (
            <p className="mt-4 max-w-2xl text-slate-600">{data.bio}</p>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-3 gap-4">
        <StatCard value={data.courses_count ?? 0} label="Kurslar" />
        <StatCard value={data.total_students ?? 0} label="O'quvchilar" />
        <StatCard value={avgRating} label="O'rtacha reyting" />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          {data.name} ning kurslari
        </h2>
        {courses.length === 0 ? (
          <p className="mt-4 text-slate-500">
            Hozircha chop etilgan kurslar yo'q.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <InstructorCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
