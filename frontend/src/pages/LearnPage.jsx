import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AssignmentSection from "../components/AssignmentSection";
import LessonSidebar from "../components/LessonSidebar";
import NotesSection from "../components/NotesSection";
import QASection from "../components/QASection";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context/AuthContext";
import { learningApi, quizApi } from "../lib/api";
import { assignmentsApi } from "../lib/assignmentsApi";

export default function LearnPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [course, assignmentRows, quizRows] = await Promise.all([
        learningApi.learn(courseId, token),
        assignmentsApi.forCourse(courseId, token).catch(() => []),
        quizApi.courseQuizzes(courseId, token).catch(() => []),
      ]);
      setData(course);
      setAssignments(assignmentRows);
      setQuizzes(quizRows);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const flatLessons = useMemo(() => data ? (data.modules || []).flatMap((module) => module.lessons || []) : [], [data]);
  useEffect(() => {
    if (!data || activeId !== null) return;
    const firstOpen = flatLessons.find((lesson) => !lesson.is_locked && !lesson.is_completed) || flatLessons.find((lesson) => !lesson.is_locked);
    setActiveId(firstOpen?.id ?? flatLessons[0]?.id ?? null);
  }, [data, flatLessons, activeId]);
  const activeLesson = flatLessons.find((lesson) => lesson.id === activeId) || null;

  async function toggleComplete(lesson) {
    if (!lesson || lesson.is_locked) return;
    setMarking(true); setError("");
    try {
      if (lesson.is_completed) await learningApi.uncompleteLesson(lesson.id, token);
      else await learningApi.completeLesson(lesson.id, token);
      await load();
    } catch (reason) { setError(reason.message); }
    finally { setMarking(false); }
  }

  if (loading) return <section className="shell py-24">Dars yuklanmoqda...</section>;
  if (error && !data) return <section className="shell py-24" role="alert">{error} <button onClick={load}>Qayta urinish</button></section>;
  if (!data) return null;
  if (!data.is_enrolled) return <section className="shell py-24"><h1>Bu kursga hali yozilmagansiz</h1><p>To‘liq darslarga kirish uchun avval kursga yoziling.</p><Link to={`/kurslar/${courseId}`}>Kurs sahifasiga o‘tish</Link></section>;

  return (
    <section className="shell py-16">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10">
        <Link
          to="/kurslarim"
          aria-label="Kurslarim sahifasiga qaytish"
          className="group inline-flex w-fit min-h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:px-6 sm:text-lg"
        >
          <span className="text-xl leading-none transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true">←</span>
          <span>Kurslarimga qaytish</span>
        </Link>
        <div className="max-w-4xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Hozir o‘rganilmoqda</p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{data.title}</h1>
          <div className="mt-4 h-1.5 w-20 rounded-full bg-violet-500" aria-hidden="true" />
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          {activeLesson && <VideoPlayer lessonId={activeLesson.id} token={token} src={activeLesson.video_url} storageKey={`lesson-${activeLesson.id}-position`} poster={activeLesson.thumbnail_url} onEnded={() => activeLesson && !activeLesson.is_completed && toggleComplete(activeLesson)} />}
          {activeLesson && <article className="mt-6"><h2 className="font-serif text-3xl">{activeLesson.title}</h2>{activeLesson.description && <p>{activeLesson.description}</p>}{activeLesson.content && <div>{activeLesson.content}</div>}
            {(activeLesson.resources || []).length > 0 && <div><h3>Materiallar</h3>{activeLesson.resources.map((resource, index) => <a key={index} href={resource.url}>↓ {resource.title || resource.url}</a>)}</div>}
            <button className="mt-6" onClick={() => toggleComplete(activeLesson)} disabled={marking}>{activeLesson.is_completed ? "✓ Tugatilgan (bekor qilish)" : "Tugatilgan deb belgilash"}</button>
          </article>}
          {activeLesson && <><AssignmentSection courseId={Number(courseId)} lessonId={activeLesson.id} /><QASection lessonId={activeLesson.id} /><NotesSection lessonId={activeLesson.id} /></>}
        </main>
        <LessonSidebar modules={data.modules || []} activeId={activeId} assignments={assignments} quizzes={quizzes} progressPercent={data.progress_percent || 0} completedLessons={data.completed_lessons || 0} totalLessons={data.total_lessons || 0} onSelect={setActiveId} />
      </div>
    </section>
  );
}
