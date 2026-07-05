import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { learningApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function MyCoursesPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    learningApi
      .myCourses(token)
      .then(setCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <section className="shell py-16 sm:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="label mb-3">Shaxsiy kabinet</p>
        <h1
          className="font-serif font-semibold text-ink leading-tight"
          style={{ fontSize: "clamp(2rem,4.5vw,3rem)" }}
        >
          Mening kurslarim
        </h1>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Yuklanmoqda...
        </p>
      ) : error ? (
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-10 text-center"
          style={{ background: "var(--surface)" }}
        >
          <p className="text-ink">Siz hali birorta kursga yozilmagansiz.</p>
          <Link
            to="/kurslar"
            className="mt-4 inline-block rounded-full px-6 py-3 text-sm font-bold text-white"
            style={{ background: "var(--amber)" }}
          >
            Kurslarni ko'rish
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.course_id}
              to={`/organish/${c.course_id}`}
              className="card-white block overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
              style={{ boxShadow: "0 4px 24px rgba(26,18,8,0.08)" }}
            >
              <div className="aspect-[16/10] bg-surface">
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    Designora
                  </div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="label">{c.level || "Kurs"}</span>
                  {c.is_completed && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase text-white"
                      style={{ background: "var(--amber)" }}
                    >
                      Tugatildi
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink leading-snug">
                  {c.title}
                </h3>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: "var(--surface)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.progress_percent}%`,
                      background: "var(--amber)",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {c.progress_percent}% · {c.lessons_count} dars
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
