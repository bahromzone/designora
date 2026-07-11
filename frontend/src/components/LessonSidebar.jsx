import { useMemo, useState } from "react";

import { formatSeconds } from "../lib/api";
import {
  adjacentLessons,
  lessonFeatures,
  lessonStatus,
} from "../lib/lessonSidebarLogic";
import "./LessonSidebar.css";

function LessonList({ modules, activeId, assignments, quizzes, onSelect }) {
  return (
    <div className="lesson-outline">
      {modules.map((module, moduleIndex) => (
        <section className="lesson-module" key={module.id ?? `module-${moduleIndex}`}>
          <header>
            <span>{String(moduleIndex + 1).padStart(2, "0")}</span>
            <div>
              <h3>{module.title}</h3>
              <small>{(module.lessons || []).length} dars</small>
            </div>
          </header>
          <div className="lesson-module-items">
            {(module.lessons || []).map((lesson, lessonIndex) => {
              const status = lessonStatus(lesson, activeId);
              const features = lessonFeatures(lesson.id, assignments, quizzes);
              return (
                <button
                  type="button"
                  key={lesson.id}
                  className={`lesson-outline-item is-${status}`}
                  onClick={() => !lesson.is_locked && onSelect(lesson.id)}
                  disabled={lesson.is_locked}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  <span className="lesson-state" aria-hidden="true">
                    {status === "completed" ? "✓" : status === "locked" ? "⌁" : lessonIndex + 1}
                  </span>
                  <span className="lesson-outline-copy">
                    <strong>{lesson.title}</strong>
                    <small>
                      {lesson.duration_seconds ? formatSeconds(lesson.duration_seconds) : "Davomiylik yo‘q"}
                    </small>
                  </span>
                  <span className="lesson-feature-badges" aria-label="Dars tarkibi">
                    {features.assignment && <i title="Topshiriq">A</i>}
                    {features.quiz && <i title="Quiz">Q</i>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function LessonSidebar({
  modules,
  activeId,
  assignments = [],
  quizzes = [],
  progressPercent,
  completedLessons,
  totalLessons,
  onSelect,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const adjacent = useMemo(() => adjacentLessons(modules, activeId), [modules, activeId]);
  const choose = (id) => {
    onSelect(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <aside className="lesson-sidebar" aria-label="Darslar yon paneli">
        <div className="lesson-sidebar-summary">
          <div>
            <span>Kurs progressi</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="lesson-sidebar-progress" aria-label={`Progress ${progressPercent}%`}>
            <i style={{ width: `${progressPercent}%` }} />
          </div>
          <small>{completedLessons} / {totalLessons} dars tugatildi</small>
        </div>
        <LessonList modules={modules} activeId={activeId} assignments={assignments} quizzes={quizzes} onSelect={choose} />
        <nav className="lesson-adjacent" aria-label="Oldingi va keyingi dars">
          <button type="button" disabled={!adjacent.previous} onClick={() => adjacent.previous && choose(adjacent.previous.id)}>← Oldingi</button>
          <button type="button" disabled={!adjacent.next} onClick={() => adjacent.next && choose(adjacent.next.id)}>Keyingi →</button>
        </nav>
      </aside>

      <button className="lesson-mobile-trigger" type="button" onClick={() => setMobileOpen(true)}>
        <span>Darslar</span><b>{completedLessons}/{totalLessons}</b>
      </button>
      {mobileOpen && (
        <div className="lesson-sheet-backdrop" role="presentation" onClick={() => setMobileOpen(false)}>
          <section className="lesson-bottom-sheet" role="dialog" aria-modal="true" aria-label="Darslar ro‘yxati" onClick={(event) => event.stopPropagation()}>
            <header><div><span>Kurs tarkibi</span><b>{progressPercent}% bajarildi</b></div><button type="button" onClick={() => setMobileOpen(false)} aria-label="Yopish">×</button></header>
            <LessonList modules={modules} activeId={activeId} assignments={assignments} quizzes={quizzes} onSelect={choose} />
          </section>
        </div>
      )}
    </>
  );
}
