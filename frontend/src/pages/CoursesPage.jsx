import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import { authApi } from "../lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi
      .courses()
      .then(setCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="shell py-16 sm:py-20">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <p className="label mb-3">Kurslar katalogi</p>
        <h1
          className="font-serif font-semibold text-ink leading-tight"
          style={{ fontSize: "clamp(2.2rem,5vw,3.5rem)" }}
        >
          Liboslar olami uchun chuqur va amaliy dasturlar
        </h1>
        <p
          className="mt-5 text-base leading-8 max-w-xl"
          style={{ color: "var(--ink-60)" }}
        >
          Har bir modul dizayn, styling, ishlab chiqarish va premium
          taqdimotning real ehtiyojlari asosida tuzilgan.
        </p>
      </div>

      {loading ? (
        <div
          className="card rounded-2xl px-6 py-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Kurslar yuklanmoqda...
        </div>
      ) : error ? (
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
