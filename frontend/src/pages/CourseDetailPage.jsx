import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  coursesApi,
  discoveryApi,
  formatDuration,
  formatPrice,
  formatSeconds,
  learningApi,
  paymentsApi,
} from "../lib/api";
import CertificateSection from "../components/CertificateSection";
import QuizSection from "../components/QuizSection";
import RecommendationSection from "../components/RecommendationSection";
import ReviewsSection from "../components/ReviewsSection";
import { useAuth } from "../context/AuthContext";

const PROVIDERS = [
  { value: "payme", label: "Payme" },
  { value: "click", label: "Click" },
];

function Stat({ label, value }) {
  return (
    <div>
      <p className="label mb-1">{label}</p>
      <p className="font-serif text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function ModuleBlock({ module, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const lessons = module.lessons || [];
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        style={{ background: "var(--surface)" }}
      >
        <span className="font-semibold text-ink">{module.title}</span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {lessons.length} dars {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="flex items-center gap-2 text-ink">
                <span aria-hidden>
                  {lesson.is_free_preview
                    ? "▶"
                    : lesson.type === "quiz"
                      ? "❓"
                      : "🔒"}
                </span>
                {lesson.title}
                {lesson.is_free_preview && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase"
                    style={{ background: "var(--amber)", color: "#fff" }}
                  >
                    Bepul
                  </span>
                )}
              </span>
              <span style={{ color: "var(--muted)" }}>
                {lesson.duration_seconds
                  ? formatSeconds(lesson.duration_seconds)
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  // Checkout holati
  const [provider, setProvider] = useState("payme");
  const [couponCode, setCouponCode] = useState("");

  const loadEnrollment = useCallback(async () => {
    if (!token) {
      setIsEnrolled(false);
      return;
    }
    try {
      const view = await learningApi.learn(courseId, token);
      setIsEnrolled(Boolean(view.is_enrolled));
      setProgress(view.progress_percent || 0);
    } catch {
      setIsEnrolled(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    coursesApi
      .detail(courseId)
      .then((data) => active && setCourse(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    loadEnrollment();
  }, [loadEnrollment]);

  async function handleEnroll() {
    if (!isAuthenticated) {
      navigate("/kirish");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Checkout: bepul kurs darhol enroll bo'ladi, pullik kurs tanlangan
      // to'lov provayderiga (Payme/Click) yo'naltiriladi.
      const res = await paymentsApi.checkout(
        {
          course_id: Number(courseId),
          provider,
          coupon_code: couponCode.trim() || undefined,
        },
        token
      );
      if (res.free) {
        setIsEnrolled(true);
        navigate(`/organish/${courseId}`);
      } else {
        window.location.href = res.pay_url;
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section
        className="shell py-24 text-sm"
        style={{ color: "var(--muted)" }}
      >
        Kurs yuklanmoqda...
      </section>
    );
  }
  if (error && !course) {
    return (
      <section className="shell py-24">
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error || "Kurs topilmadi"}
        </div>
        <Link
          to="/kurslar"
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: "var(--amber)" }}
        >
          ← Kurslarga qaytish
        </Link>
      </section>
    );
  }
  if (!course) return null;

  const outcomes = course.learning_outcomes || [];
  const requirements = course.requirements || [];
  const modules = course.modules || [];
  const isPaid = (course.price || 0) > 0;

  return (
    <section className="shell py-16 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        {/* Chap ustun */}
        <div>
          <Link
            to="/kurslar"
            className="mb-6 inline-block text-sm font-semibold"
            style={{ color: "var(--muted)" }}
          >
            ← Kurslar katalogi
          </Link>
          <p className="label mb-3">{course.category || "Kurs"}</p>
          <h1
            className="font-serif font-semibold text-ink leading-tight"
            style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)" }}
          >
            {course.title}
          </h1>
          {course.subtitle && (
            <p
              className="mt-4 text-lg leading-8"
              style={{ color: "var(--ink-60)" }}
            >
              {course.subtitle}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-10">
            <Stat label="Daraja" value={course.level || "—"} />
            <Stat label="Darslar" value={`${course.lessons_count} ta`} />
            <Stat
              label="Davomiylik"
              value={formatDuration(course.duration_minutes)}
            />
            <Stat label="O'quvchilar" value={`${course.students_count}`} />
          </div>

          {course.description && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Kurs haqida
              </h2>
              <p
                className="mt-3 text-base leading-8"
                style={{ color: "var(--ink-60)" }}
              >
                {course.description}
              </p>
            </div>
          )}

          {outcomes.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Nimalarni o'rganasiz
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {outcomes.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-7"
                    style={{ color: "var(--ink-60)" }}
                  >
                    <span style={{ color: "var(--amber)" }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requirements.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Talablar
              </h2>
              <ul
                className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7"
                style={{ color: "var(--ink-60)" }}
              >
                {requirements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Syllabus */}
          <div className="mt-10">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Kurs dasturi
            </h2>
            <div className="mt-4 space-y-3">
              {modules.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Dastur tez orada e'lon qilinadi.
                </p>
              ) : (
                modules.map((m, i) => (
                  <ModuleBlock
                    key={m.id ?? `orphan-${i}`}
                    module={m}
                    defaultOpen={i === 0}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* O'ng ustun — yopishqoq karta */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div
            className="card-white overflow-hidden rounded-2xl"
            style={{ boxShadow: "0 4px 24px rgba(26,18,8,0.08)" }}
          >
            <div className="aspect-[16/10] bg-surface">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
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
            <div className="space-y-4 p-6">
              <p className="font-serif text-3xl font-semibold text-ink">
                {formatPrice(course.price)}
              </p>

              {isEnrolled ? (
                <>
                  <Link
                    to={`/organish/${courseId}`}
                    className="block w-full rounded-full px-6 py-3 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                    style={{ background: "var(--ink)" }}
                  >
                    O'qishni davom ettirish
                  </Link>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--surface)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: "var(--amber)",
                      }}
                    />
                  </div>
                  <p
                    className="text-center text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {progress}% tugallandi
                  </p>
                </>
              ) : (
                <>
                  {isPaid && (
                    <div className="space-y-3">
                      {/* To'lov provayderi tanlash */}
                      <div>
                        <p className="label mb-1.5">To'lov usuli</p>
                        <div className="grid grid-cols-2 gap-2">
                          {PROVIDERS.map((p) => {
                            const active = provider === p.value;
                            return (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => setProvider(p.value)}
                                className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors"
                                style={{
                                  borderColor: active
                                    ? "var(--amber)"
                                    : "var(--border)",
                                  background: active
                                    ? "var(--amber)"
                                    : "transparent",
                                  color: active ? "#fff" : "var(--ink)",
                                }}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kupon kodi */}
                      <div>
                        <p className="label mb-1.5">Chegirma kodi (ixtiyoriy)</p>
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="masalan: SALE20"
                          className="w-full rounded-xl border px-4 py-2.5 text-sm uppercase outline-none"
                          style={{ borderColor: "var(--border)" }}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p
                      className="rounded-xl px-4 py-2.5 text-xs"
                      style={{ background: "#fff0ef", color: "#c0392b" }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleEnroll}
                    disabled={busy}
                    className="block w-full rounded-full px-6 py-3 text-center text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background: "var(--amber)" }}
                  >
                    {busy
                      ? "..."
                      : isPaid
                        ? "Sotib olish"
                        : "Kursga yozilish"}
                  </button>
                </>
              )}

              <p
                className="text-center text-xs leading-6"
                style={{ color: "var(--muted)" }}
              >
                Umrbod kirish · Bepul preview darslar mavjud
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Testlar */}
      <QuizSection courseId={courseId} isEnrolled={isEnrolled} />

      {/* Sertifikat */}
      <CertificateSection
        courseId={courseId}
        isEnrolled={isEnrolled}
        progress={progress}
      />

      {/* Sharhlar va reyting */}
      <ReviewsSection courseId={courseId} isEnrolled={isEnrolled} />

      {/* Tavsiya: o'xshash kurslar */}
      <RecommendationSection
        title="O'xshash kurslar"
        subtitle="Shu yo'nalishdagi boshqa dasturlar"
        fetcher={() => discoveryApi.similar(courseId, 6)}
        limit={3}
      />
    </section>
  );
}
