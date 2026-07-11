import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import AssignmentSection from "../components/AssignmentSection";
import NotesSection from "../components/NotesSection";
import QASection from "../components/QASection";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context/AuthContext";
import { formatSeconds, learningApi } from "../lib/api";

export default function LearnPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try { setData(await learningApi.learn(courseId, token)); }
    catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
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

  function goNext() {
    const index = flatLessons.findIndex((lesson) => lesson.id === activeId);
    const next = flatLessons.slice(index + 1).find((lesson) => !lesson.is_locked);
    if (next) { setActiveId(next.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  if (loading) return <section className="shell py-24">Dars yuklanmoqda...</section>;
  if (error && !data) return <section className="shell py-24" role="alert">{error} <button onClick={load}>Qayta urinish</button></section>;
  if (!data) return null;
  if (!data.is_enrolled) return <section className="shell py-24"><h1>Bu kursga hali yozilmagansiz</h1><p>To‘liq darslarga kirish uchun avval kursga yoziling.</p><Link to={`/kurslar/${courseId}`}>Kurs sahifasiga o‘tish</Link></section>;

  return (
    <section className="shell py-16">
      <Link to="/kurslarim">← {data.title}</Link>
      {error && <p role="alert">{error}</p>}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <main>
          {activeLesson && <VideoPlayer lessonId={activeLesson.id} token={token} src={activeLesson.video_url} storageKey={`lesson-${activeLesson.id}-position`} poster={activeLesson.thumbnail_url} onEnded={() => activeLesson && !activeLesson.is_completed && toggleComplete(activeLesson)} />}
          {activeLesson && <article className="mt-6"><h1 className="font-serif text-3xl">{activeLesson.title}</h1>{activeLesson.description && <p>{activeLesson.description}</p>}{activeLesson.content && <div>{activeLesson.content}</div>}
            {(activeLesson.resources || []).length > 0 && <div><h2>Materiallar</h2>{activeLesson.resources.map((resource, index) => <a key={index} href={resource.url}>↓ {resource.title || resource.url}</a>)}</div>}
            <div className="mt-6 flex gap-3"><button onClick={() => toggleComplete(activeLesson)} disabled={marking}>{activeLesson.is_completed ? "✓ Tugatilgan (bekor qilish)" : "Tugatilgan deb belgilash"}</button><button onClick={goNext}>Keyingi dars →</button></div>
          </article>}
          {activeLesson && <><AssignmentSection courseId={Number(courseId)} lessonId={activeLesson.id} /><QASection lessonId={activeLesson.id} /><NotesSection lessonId={activeLesson.id} /></>}
        </main>
        <aside><h2>Umumiy progress {data.progress_percent}%</h2><p>{data.completed_lessons} / {data.total_lessons} dars tugatildi</p>{(data.modules || []).map((module) => <div key={module.id}><h3>{module.title}</h3>{(module.lessons || []).map((lesson) => <button key={lesson.id} onClick={() => !lesson.is_locked && setActiveId(lesson.id)} disabled={lesson.is_locked}>{lesson.is_completed ? "✓" : lesson.is_locked ? "◇" : "▶"} {lesson.title} {lesson.duration_seconds ? formatSeconds(lesson.duration_seconds) : ""}</button>)}</div>)}</aside>
      </div>
    </section>
  );
}
