import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import CourseAccessCodeForm from "../components/CourseAccessCodeForm";
import SavedCourseButton from "../components/SavedCourseButton";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";
import { coursesApi, formatPrice, learningApi } from "../lib/api";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolled, setEnrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadEnrollment = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setEnrolled(false);
      setSaved(false);
      return;
    }
    try {
      const response = await learningApi.learn(courseId);
      setEnrolled(Boolean(response.is_enrolled));
    } catch {
      setEnrolled(false);
    }
    try {
      const savedCourses = await accountApi.savedCourses();
      setSaved(
        savedCourses.some((item) => String(item.course_id) === String(courseId))
      );
    } catch {
      setSaved(false);
    }
  }, [courseId, isAuthenticated, authLoading]);

  useEffect(() => {
    coursesApi
      .detail(courseId)
      .then(setCourse)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    loadEnrollment();
  }, [loadEnrollment]);

  if (loading) return <main className="shell py-20">Kurs yuklanmoqda...</main>;
  if (error || !course)
    return <main className="shell py-20">{error || "Kurs topilmadi"}</main>;

  const buy = async () => {
    if (busy) return;
    if (authLoading || !isAuthenticated) {
      navigate("/?modal=login", { state: { from: location.pathname } });
      return;
    }
    if ((course.price || 0) > 0) {
      navigate(`/checkout/${courseId}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await learningApi.enroll(courseId);
      navigate(`/organish/${courseId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="shell py-10">
      <Link to="/kurslar">&larr; Kurslar</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p className="label">{course.category || "Kurs"}</p>
          <h1 className="mt-3 text-5xl font-extrabold">{course.title}</h1>
          <p className="mt-5 text-lg text-gray-600">{course.description}</p>
          <h2 className="mt-10 text-2xl font-bold">Kurs dasturi</h2>
          {(course.modules || []).map((module) => (
            <article className="card mt-3 rounded-xl p-4" key={module.id}>
              <strong>{module.title}</strong>
              <p>{(module.lessons || []).length} dars</p>
            </article>
          ))}
        </section>
        <aside className="card h-fit rounded-2xl p-6 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-3">
            <strong className="text-3xl">{formatPrice(course.price)}</strong>
            <SavedCourseButton courseId={courseId} initialSaved={saved} />
          </div>
          {enrolled ? (
            <Link
              className="btn-primary mt-5 w-full justify-center"
              to={`/organish/${courseId}`}
            >
              O'qishni davom ettirish
            </Link>
          ) : (
            <>
              <button
                className="btn-primary mt-5 w-full justify-center"
                onClick={buy}
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? "Yozilmoqda..." : "Kursga yozilish"}
              </button>
              {(course.price || 0) > 0 && (
                <CourseAccessCodeForm
                  courseId={courseId}
                  isAuthenticated={isAuthenticated}
                  authLoading={authLoading}
                  onRedeemed={() => {
                    setEnrolled(true);
                    navigate(`/organish/${courseId}`);
                  }}
                />
              )}
            </>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            Aniq narx, promo code, xavfsiz to'lov va chek.
          </p>
        </aside>
      </div>
    </main>
  );
}
