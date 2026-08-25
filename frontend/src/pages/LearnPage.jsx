import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AssignmentSection from "../components/AssignmentSection";
import CertificateSection from "../components/CertificateSection";
import LessonSidebar from "../components/LessonSidebar";
import NotesSection from "../components/NotesSection";
import QASection from "../components/QASection";
import QuizSection from "../components/QuizSection";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context/AuthContext";
import { learningApi, quizApi } from "../lib/api";
import { assignmentsApi } from "../lib/assignmentsApi";

export default function LearnPage() {
  const { courseId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      const [course, assignmentRows, quizRows] = await Promise.all([
        learningApi.learn(courseId),
        assignmentsApi.forCourse(courseId).catch(() => []),
        quizApi.courseQuizzes(courseId).catch(() => []),
      ]);
      setData(course);
      setAssignments(assignmentRows);
      setQuizzes(quizRows);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(Boolean(user));
    if (user) load();
  }, [authLoading, load, user]);

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
        await learningApi.uncompleteLesson(lesson.id);
      } else {
        await learningApi.completeLesson(lesson.id);
      }
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setMarking(false);
    }
  }

  // MUHIM: bu yerda hech qachon `return null` bo'lmasligi kerak. Ilgari
  // `if (!data) return null;` bor edi va API xato qaytarganda sahifa
  // butunlay bo'sh render bo'lardi — na foydalanuvchi, na E2E test
  // sababni ko'ra olmasdi. Har bir holat o'z ovoziga ega bo'lsin.
  if (authLoading || loading)
    return (
      <section className="shell py-24" data-testid="learn-loading">
        Dars yuklanmoqda...
      </section>
    );

  if (!user)
    return (
      <section
        className="shell py-24"
        role="alert"
        data-testid="learn-unauthenticated"
      >
        <h1>Sessiya topilmadi</h1>
        <p>Iltimos, qaytadan tizimga kiring.</p>
        <Link to="/?modal=login">Kirish</Link>
      </section>
    );

  if (error && !data)
    return (
      <section className="shell py-24" role="alert" data-testid="learn-error">
        <h1>Darsni ochib bo'lmadi</h1>
        <p data-testid="learn-error-message">{error}</p>
        <button onClick={load}>Qayta urinish</button>
      </section>
    );

  if (!data)
    return (
      <section className="shell py-24" role="alert" data-testid="learn-empty">
        <h1>Kurs ma'lumoti bo'sh keldi</h1>
        <p>Kurs ID'sini tekshirib, sahifani yangilang.</p>
        <button onClick={load}>Qayta urinish</button>
      </section>
    );

  if (!data.is_enrolled)
    return (
      <section className="shell py-24" data-testid="learn-not-enrolled">
        <h1>Bu kursga hali yozilmagansiz</h1>
        <p>To'liq darslarga kirish uchun avval kursga yoziling.</p>
        <Link to={`/kurslar/${courseId}`}>Kurs sahifasiga o'tish</Link>
      </section>
    );

  const courseCompleted =
    Number(data.progress_percent) >= 100 && Number(data.total_lessons) > 0;

  return (
    <section className="shell py-12" data-testid="learn-ready">
      <div className="mb-8 flex flex-col gap-4">
        <Link
          to="/kurslarim"
          data-testid="back-to-my-courses"
          className="group inline-flex w-fit min-h-10 items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <span
            className="text-base leading-none transition-transform duration-200 group-hover:-translate-x-1"
            aria-hidden="true"
          >
            ←
          </span>
          <span>Kurslarimga qaytish</span>
        </Link>
        <div className="max-w-4xl">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                courseCompleted
                  ? "border border-emerald-200/60 bg-emerald-50 text-emerald-700"
                  : "border border-violet-200/60 bg-violet-50 text-violet-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  courseCompleted ? "bg-emerald-500" : "bg-violet-500"
                }`}
                aria-hidden="true"
              />
              {courseCompleted ? "Kurs yakunlangan" : "O'rganilmoqda"}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            {data.title}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 sm:text-sm">
            {data.modules?.length > 0 && (
              <span>{data.modules.length} ta modul</span>
            )}
            {data.total_lessons > 0 && (
              <>
                {data.modules?.length > 0 && <span aria-hidden="true">·</span>}
                <span>
                  {data.completed_lessons || 0}/{data.total_lessons} ta dars
                  tugatildi
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-medium text-violet-700">
              {data.progress_percent || 0}% progress
            </span>
          </div>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          {activeLesson && (
            <VideoPlayer
              lessonId={activeLesson.id}
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
              <h2 className="font-serif text-3xl">{activeLesson.title}</h2>
              {activeLesson.description && <p>{activeLesson.description}</p>}
              {activeLesson.content && <div>{activeLesson.content}</div>}
              {(activeLesson.resources || []).length > 0 && (
                <div>
                  <h3>Materiallar</h3>
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
          <QuizSection
            courseId={Number(courseId)}
            isEnrolled={data.is_enrolled}
          />
          <CertificateSection
            courseId={Number(courseId)}
            isEnrolled={data.is_enrolled}
            progress={data.progress_percent}
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
