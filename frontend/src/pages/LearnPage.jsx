import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AssignmentSection from "../components/AssignmentSection";
import LessonSidebar from "../components/LessonSidebar";
import NotesSection from "../components/NotesSection";
import QASection from "../components/QASection";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignmentsApi";
import { certificatesApi, learningApi, quizApi } from "../lib/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function resolveCertificateUrl(url) {
  if (!url) return "";
  return url.startsWith("http")
    ? url
    : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function certificatePanelState(certificate, progress, quizzes = []) {
  if (certificate) return "issued";
  if (Number(progress) >= 100) return quizzes.length ? "quiz_required" : "ready";
  return "in_progress";
}

function CertificatePanel({
  certificate,
  progress,
  quizzes,
  issuing,
  error,
  onIssue,
}) {
  const progressValue = Math.min(100, Math.max(0, Number(progress) || 0));
  const state = certificatePanelState(certificate, progressValue, quizzes);

  if (state === "in_progress") return null;

  const issued = state === "issued";
  const verifyUrl = certificate
    ? `/verify/${certificate.verification_code}`
    : null;
  const panelStyle = {
    border: "1px solid rgba(124, 58, 237, 0.16)",
    background: issued
      ? "linear-gradient(135deg, rgba(236, 72, 153, 0.11), rgba(79, 70, 229, 0.11))"
      : "linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(236, 72, 153, 0.09))",
    boxShadow: "0 18px 48px rgba(79, 70, 229, 0.10)",
  };

  return (
    <section
      className="relative mt-14 overflow-hidden rounded-3xl"
      style={panelStyle}
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
        style={{ background: "rgba(236, 72, 153, 0.12)" }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: issued ? "var(--brand)" : "rgba(255, 255, 255, 0.78)",
              color: issued ? "#fff" : "var(--brand)",
              boxShadow: "0 10px 24px rgba(124, 58, 237, 0.18)",
            }}
            aria-hidden="true"
          >
            {issued ? "✓" : "✦"}
          </div>
          <div className="min-w-0">
            <p className="label mb-2">
              {issued ? "Sertifikat tayyor" : "Kurs yakunlandi"}
            </p>
            <h2 className="font-serif text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              {issued
                ? "Sizning natijangiz tasdiqlandi."
                : "Bilimingizni sertifikat bilan yakunlang."}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {issued
                ? `Serial: ${certificate.serial}${certificate.grade ? ` · ${certificate.grade}` : ""}`
                : state === "quiz_required"
                  ? `Sertifikat olishdan oldin ${quizzes.length} ta faol testdan o'ting.`
                  : "Barcha darslar tugadi. Sertifikatingizni hozir olishingiz mumkin."}
            </p>
          </div>
        </div>

        <div className="relative flex shrink-0 flex-wrap gap-3 lg:justify-end">
          {issued ? (
            <>
              {verifyUrl && (
                <a
                  className="btn-outline"
                  href={verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tekshirish
                </a>
              )}
              {certificate.pdf_url && (
                <a
                  className="btn-primary"
                  href={resolveCertificateUrl(certificate.pdf_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  PDF yuklash
                </a>
              )}
            </>
          ) : (
            <button
              className="btn-primary"
              type="button"
              onClick={onIssue}
              disabled={issuing}
            >
              {issuing ? "Tayyorlanmoqda..." : "Sertifikatni olish"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          className="relative mx-6 mb-6 rounded-2xl border px-4 py-3 text-sm sm:mx-8"
          style={{
            borderColor: "rgba(190, 24, 93, 0.22)",
            background: "rgba(255, 241, 242, 0.9)",
            color: "#9f1239",
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}

export default function LearnPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificateError, setCertificateError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [marking, setMarking] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [course, assignmentRows, quizRows, certificateRows] =
        await Promise.all([
          learningApi.learn(courseId, token),
          assignmentsApi.forCourse(courseId, token).catch(() => []),
          quizApi.courseQuizzes(courseId, token).catch(() => []),
          certificatesApi.mine(token).catch(() => []),
        ]);
      setData(course);
      setAssignments(assignmentRows);
      setQuizzes(quizRows);
      setCertificate(
        certificateRows.find(
          (item) => String(item.course_id) === String(courseId)
        ) || null
      );
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const flatLessons = useMemo(
    () =>
      data
        ? (data.modules || []).flatMap((module) => module.lessons || [])
        : [],
    [data]
  );

  useEffect(() => {
    if (!data || activeId !== null) return;
    const firstOpen =
      flatLessons.find((lesson) => !lesson.is_locked && !lesson.is_completed) ||
      flatLessons.find((lesson) => !lesson.is_locked);
    setActiveId(firstOpen?.id ?? flatLessons[0]?.id ?? null);
  }, [data, flatLessons, activeId]);

  const activeLesson =
    flatLessons.find((lesson) => lesson.id === activeId) || null;

  async function toggleComplete(lesson) {
    if (!lesson || lesson.is_locked) return;
    setMarking(true);
    setError("");
    try {
      if (lesson.is_completed) {
        await learningApi.uncompleteLesson(lesson.id, token);
      } else {
        await learningApi.completeLesson(lesson.id, token);
      }
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setMarking(false);
    }
  }

  async function issueCertificate() {
    setIssuing(true);
    setCertificateError("");
    try {
      setCertificate(await certificatesApi.issue(courseId, token));
    } catch (reason) {
      setCertificateError(reason.message);
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <section className="shell py-24">Dars yuklanmoqda...</section>;
  if (error && !data) {
    return (
      <section className="shell py-24" role="alert">
        {error} <button onClick={load}>Qayta urinish</button>
      </section>
    );
  }
  if (!data) return null;
  if (!data.is_enrolled) {
    return (
      <section className="shell py-24">
        <h1>Bu kursga hali yozilmagansiz</h1>
        <p>To'liq darslarga kirish uchun avval kursga yoziling.</p>
        <Link to={`/kurslar/${courseId}`}>Kurs sahifasiga o'tish</Link>
      </section>
    );
  }

  return (
    <section className="shell py-16">
      <Link to="/kurslarim">← {data.title}</Link>
      {error && <p role="alert">{error}</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          {activeLesson && (
            <VideoPlayer
              lessonId={activeLesson.id}
              token={token}
              src={activeLesson.video_url}
              storageKey={`lesson-${activeLesson.id}-position`}
              poster={activeLesson.thumbnail_url}
              onEnded={() =>
                activeLesson &&
                !activeLesson.is_completed &&
                toggleComplete(activeLesson)
              }
            />
          )}

          {activeLesson && (
            <article className="mt-6">
              <h1 className="font-serif text-3xl">{activeLesson.title}</h1>
              {activeLesson.description && <p>{activeLesson.description}</p>}
              {activeLesson.content && <div>{activeLesson.content}</div>}
              {(activeLesson.resources || []).length > 0 && (
                <div>
                  <h2>Materiallar</h2>
                  {activeLesson.resources.map((resource, index) => (
                    <a key={index} href={resource.url}>
                      ↓ {resource.title || resource.url}
                    </a>
                  ))}
                </div>
              )}
              <button
                className="mt-6"
                onClick={() => toggleComplete(activeLesson)}
                disabled={marking}
              >
                {activeLesson.is_completed
                  ? "✓ Tugatilgan (bekor qilish)"
                  : "Tugatilgan deb belgilash"}
              </button>
            </article>
          )}

          {activeLesson && (
            <>
              <AssignmentSection
                courseId={Number(courseId)}
                lessonId={activeLesson.id}
              />
              <QASection lessonId={activeLesson.id} />
              <NotesSection lessonId={activeLesson.id} />
            </>
          )}

          <CertificatePanel
            certificate={certificate}
            progress={data.progress_percent || 0}
            quizzes={quizzes}
            issuing={issuing}
            error={certificateError}
            onIssue={issueCertificate}
          />
        </main>

        <LessonSidebar
          modules={data.modules || []}
          activeId={activeId}
          assignments={assignments}
          quizzes={quizzes}
          progressPercent={data.progress_percent || 0}
          completedLessons={data.completed_lessons || 0}
          totalLessons={data.total_lessons || 0}
          onSelect={setActiveId}
        />
      </div>
    </section>
  );
}
