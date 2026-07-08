import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatSeconds, learningApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "../components/VideoPlayer";
import QASection from "../components/QASection";
import NotesSection from "../components/NotesSection";

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
    try {
      const view = await learningApi.learn(courseId, token);
      setData(view);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Barcha darslarni tekis ro'yxatga aylantiramiz (navigatsiya uchun)
  const flatLessons = useMemo(() => {
    if (!data) return [];
    return (data.modules || []).flatMap((m) => m.lessons || []);
  }, [data]);

  // Faol darsni tanlash (birinchi qulflanmagan yoki tugatilmagan)
  useEffect(() => {
    if (!data || activeId !== null) return;
    const firstOpen = flatLessons.find((l) => !l.is_locked);
    setActiveId(firstOpen ? firstOpen.id : (flatLessons[0]?.id ?? null));
  }, [data, flatLessons, activeId]);

  const activeLesson = flatLessons.find((l) => l.id === activeId) || null;

  async function toggleComplete(lesson) {
    if (!lesson || lesson.is_locked) return;
    setMarking(true);
    try {
      if (lesson.is_completed) {
        await learningApi.uncompleteLesson(lesson.id, token);
      } else {
        await learningApi.completeLesson(lesson.id, token);
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setMarking(false);
    }
  }

  function goNext() {
    const idx = flatLessons.findIndex((l) => l.id === activeId);
    for (let i = idx + 1; i < flatLessons.length; i++) {
      if (!flatLessons[i].is_locked) {
        setActiveId(flatLessons[i].id);
        return;
      }
    }
  }

  if (loading) {
    return (
      <section
        className="shell py-24 text-sm"
        style={{ color: "var(--muted)" }}
      >
        O'quv sahifasi yuklanmoqda...
      </section>
    );
  }
  if (error) {
    return (
      <section className="shell py-24">
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error}
        </div>
      </section>
    );
  }
  if (!data) return null;

  if (!data.is_enrolled) {
    return (
      <section className="shell py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Bu kursga hali yozilmagansiz
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-60)" }}>
          To'liq darslarga kirish uchun avval kursga yoziling.
        </p>
        <Link
          to={`/kurslar/${courseId}`}
          className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-bold text-white"
          style={{ background: "var(--amber)" }}
        >
          Kurs sahifasiga o'tish
        </Link>
      </section>
    );
  }

  return (
    <section className="shell py-10 sm:py-14">
      <div className="mb-6">
        <Link
          to={`/kurslar/${courseId}`}
          className="text-sm font-semibold"
          style={{ color: "var(--muted)" }}
        >
          ← {data.title}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Pleyer */}
        <div>
          <VideoPlayer
            src={activeLesson?.video_url}
            storageKey={
              activeLesson ? `designora-video-${activeLesson.id}` : undefined
            }
            onEnded={() =>
              activeLesson &&
              !activeLesson.is_completed &&
              toggleComplete(activeLesson)
            }
          />

          {activeLesson && (
            <div className="mt-6">
              <h1 className="font-serif text-2xl font-semibold text-ink">
                {activeLesson.title}
              </h1>
              {activeLesson.description && (
                <p
                  className="mt-2 text-sm leading-7"
                  style={{ color: "var(--ink-60)" }}
                >
                  {activeLesson.description}
                </p>
              )}
              {activeLesson.content && (
                <div
                  className="mt-4 whitespace-pre-wrap rounded-xl p-5 text-sm leading-7"
                  style={{
                    background: "var(--surface)",
                    color: "var(--ink-60)",
                  }}
                >
                  {activeLesson.content}
                </div>
              )}

              {(activeLesson.resources || []).length > 0 && (
                <div className="mt-4">
                  <p className="label mb-2">Materiallar</p>
                  <ul className="space-y-1 text-sm">
                    {activeLesson.resources.map((r, i) => (
                      <li key={i}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold"
                          style={{ color: "var(--amber)" }}
                        >
                          ↓ {r.title || r.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => toggleComplete(activeLesson)}
                  disabled={marking}
                  className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    background: activeLesson.is_completed
                      ? "var(--muted)"
                      : "var(--ink)",
                  }}
                >
                  {activeLesson.is_completed
                    ? "✓ Tugatilgan (bekor qilish)"
                    : "Tugatilgan deb belgilash"}
                </button>
                <button
                  onClick={goNext}
                  className="rounded-full border px-6 py-2.5 text-sm font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--ink)" }}
                >
                  Keyingi dars →
                </button>
              </div>

              {/* Eslatmalar + Savol-javob */}
              <div className="mt-10 grid gap-8 border-t border-border pt-8 lg:grid-cols-2">
                <NotesSection lessonId={activeLesson.id} />
                <QASection lessonId={activeLesson.id} />
              </div>
            </div>
          )}
        </div>

        {/* Yon panel — progress + syllabus */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="mb-4 rounded-2xl p-5"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Umumiy progress</span>
              <span style={{ color: "var(--amber)" }}>
                {data.progress_percent}%
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${data.progress_percent}%`,
                  background: "var(--amber)",
                }}
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
              {data.completed_lessons} / {data.total_lessons} dars tugatildi
            </p>
          </div>

          <div className="space-y-4">
            {(data.modules || []).map((m, mi) => (
              <div key={m.id ?? `orphan-${mi}`}>
                <p className="label mb-2">{m.title}</p>
                <ul className="space-y-1">
                  {(m.lessons || []).map((lesson) => {
                    const isActive = lesson.id === activeId;
                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() =>
                            !lesson.is_locked && setActiveId(lesson.id)
                          }
                          disabled={lesson.is_locked}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isActive ? "font-semibold" : ""
                          } ${lesson.is_locked ? "cursor-not-allowed opacity-60" : "hover:bg-surface"}`}
                          style={{
                            background: isActive
                              ? "var(--surface)"
                              : "transparent",
                            color: "var(--ink)",
                          }}
                        >
                          <span aria-hidden>
                            {lesson.is_completed
                              ? "✅"
                              : lesson.is_locked
                                ? "🔒"
                                : "▶"}
                          </span>
                          <span className="flex-1">{lesson.title}</span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--muted)" }}
                          >
                            {lesson.duration_seconds
                              ? formatSeconds(lesson.duration_seconds)
                              : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
