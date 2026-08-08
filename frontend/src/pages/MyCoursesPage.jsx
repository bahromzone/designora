import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RecentNoteCard from "../components/RecentNoteCard";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../lib/dashboardApi";
import "./StudentDashboard.css";

function formatDueDate(value) {
  if (!value) return "Muddat belgilanmagan";
  const days = Math.ceil((new Date(value) - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)} kun kechikdi`;
  if (days === 0) return "Bugun";
  if (days === 1) return "Ertaga";
  return new Date(value).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });
}
function ProgressRing({ value }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="progress-ring" aria-label={`Umumiy progress ${progress}%`}>
      <svg viewBox="0 0 100 100" role="img">
        <circle className="progress-ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="progress-ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
        />
      </svg>
      <strong>{progress}%</strong>
    </div>
  );
}

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setDashboard(await dashboardApi.get());
    } catch (err) {
      setError(err.message || "Dashboardni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const courses = dashboard?.courses ?? [];
  const assignments = dashboard?.assignments ?? [];
  const notifications = dashboard?.notifications ?? [];
  const gamification = dashboard?.gamification;
  const summary = dashboard?.summary ?? {};
  const activeCourses = useMemo(
    () => courses.filter((course) => !course.is_completed),
    [courses]
  );
  const completedCount = summary.completed_courses ?? 0;
  const averageProgress = summary.average_progress ?? 0;
  const pendingAssignments = useMemo(
    () =>
      assignments
        .filter((item) => item.my_submission?.status !== "graded")
        .slice(0, 4),
    [assignments]
  );
  const feedbackItems = assignments.filter(
    (item) => item.my_submission?.status === "graded"
  );
  const continueCourse =
    dashboard?.next_lesson?.course ?? activeCourses[0] ?? courses[0];
  const firstName = (user?.name || user?.full_name || "Talaba")
    .trim()
    .split(" ")[0];

  if (loading)
    return (
      <section className="student-dashboard">
        <div className="dashboard-skeleton" aria-busy="true">
          <div className="sk sk-title" />
          <div className="sk-grid">
            <div className="sk sk-feature" />
            <div className="sk sk-side" />
          </div>
        </div>
      </section>
    );
  if (error)
    return (
      <section className="student-dashboard">
        <div className="dashboard-error" role="alert">
          <h1>Dashboard ochilmadi</h1>
          <p>{error}</p>
          <button type="button" onClick={loadDashboard}>
            Qayta urinish
          </button>
        </div>
      </section>
    );
  if (!courses.length)
    return (
      <section className="student-dashboard">
        <div className="dashboard-empty">
          <p className="dashboard-eyebrow">Shaxsiy kabinet</p>
          <h1>Birinchi loyihangiz shu yerdan boshlanadi.</h1>
          <p>
            Yo'nalishingizga mos kursni tanlang. Progress, vazifalar va
            sertifikatlar shu dashboard'da jamlanadi.
          </p>
          <Link to="/kurslar" className="dashboard-primary">
            Kurslarni ko'rish
          </Link>
        </div>
      </section>
    );
  return (
    <section className="student-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">Shaxsiy kabinet</p>
          <h1>Salom, {firstName}.</h1>
          <p className="dashboard-subtitle">
            Bugungi eng muhim qadamni tanladik. Davom eting.
          </p>
        </div>
        <Link to="/kurslar" className="dashboard-secondary">
          Yangi kurs topish
        </Link>
      </header>
      <div className="dashboard-lead-grid">
        <article className="continue-panel">
          <div className="continue-copy">
            <span className="continue-label">Davom ettirish</span>
            <p className="continue-course">{continueCourse?.title}</p>
            <h2>{dashboard?.next_lesson?.title || "Keyingi darsga o'ting"}</h2>
            <p>
              {continueCourse?.progress_percent || 0}% bajarildi, {" "}
              {continueCourse?.lessons_count || 0} ta dars.
            </p>
            <Link
              to={`/organish/${continueCourse?.course_id}`}
              className="continue-action"
            >
              Darsni ochish →
            </Link>
          </div>
          <div className="continue-progress" aria-hidden="true">
            <span>{continueCourse?.progress_percent || 0}</span>
            <small>%</small>
          </div>
        </article>
        <aside className="momentum-panel">
          <div className="momentum-title">
            <span>🔥</span>
            <div>
              <small>O'qish ritmi</small>
              <strong>{gamification?.streak_days || 0} kunlik streak</strong>
            </div>
          </div>
          <div className="momentum-level">
            <div>
              <span>Daraja {gamification?.level || 1}</span>
              <b>{gamification?.points || 0} XP</b>
            </div>
            <div className="momentum-track">
              <i
                style={{
                  width: `${Math.min(100, Math.max(4, 100 - ((gamification?.points_to_next_level || 100) / 100) * 100))}%`,
                }}
              />
            </div>
            <p>
              Keyingi darajagacha {gamification?.points_to_next_level || 100} XP
            </p>
          </div>
          <div className="momentum-stats">
            <span>
              <b>{activeCourses.length}</b> faol kurs
            </span>
            <span>
              <b>{completedCount}</b> yakunlangan
            </span>
          </div>
        </aside>
      </div>
      <div className="dashboard-content-grid">
        <div className="dashboard-main-column">
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Navbatdagi ishlar</p>
                <h2>Rejangiz</h2>
              </div>
              <span>
                {summary.open_assignments ?? pendingAssignments.length} ta ochiq
              </span>
            </div>
            {pendingAssignments.length ? (
              <div className="task-list">
                {pendingAssignments.map((item) => (
                  <Link
                    key={item.id}
                    to={`/organish/${item.course.course_id}`}
                    className="task-row"
                  >
                    <span className="task-copy">
                      <strong>{item.title}</strong>
                      <small>{item.course.title}</small>
                    </span>
                    <span className="task-due">
                      {item.my_submission?.status === "submitted"
                        ? "Tekshiruvda"
                        : formatDueDate(item.due_date)}
                    </span>
                    →
                  </Link>
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <strong>Hammasi joyida</strong>
                <p>Hozircha ochiq topshiriq yo'q.</p>
              </div>
            )}
          </section>
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Kurslar</p>
                <h2>O'qish yo'lingiz</h2>
              </div>
              <Link to="/kurslar">Barchasini ko'rish</Link>
            </div>
            <div className="course-list">
              {courses.slice(0, 4).map((course) => (
                <Link
                  key={course.course_id}
                  to={`/organish/${course.course_id}`}
                  className="course-row"
                >
                  <div className="course-thumb">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" />
                    ) : (
                      <span>D</span>
                    )}
                  </div>
                  <div className="course-row-copy">
                    <small>{course.category || course.level || "Dizayn"}</small>
                    <strong>{course.title}</strong>
                    <span>{course.lessons_count || 0} dars</span>
                  </div>
                  <div className="course-row-progress">
                    <b>{course.progress_percent || 0}%</b>
                    <div>
                      <i
                        style={{ width: `${course.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>
                  →
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-side-column">
          <section className="progress-panel">
            <div>
              <p className="dashboard-eyebrow">Umumiy natija</p>
              <h2>Progress</h2>
            </div>
            <ProgressRing value={averageProgress} />
            <p>
              {completedCount
                ? `${completedCount} ta kurs yakunlandi.`
                : "Birinchi kursni yakunlash tomon ketyapsiz."}
            </p>
            {feedbackItems.length > 0 && (
              <Link to="/profil">
                {feedbackItems.length} ta feedback olindi
              </Link>
            )}
          </section>
          <section className="updates-panel">
            <div className="section-heading compact">
              <div>
                <p className="dashboard-eyebrow">Yangiliklar</p>
                <h2>So'nggi xabarlar</h2>
              </div>
            </div>
            {notifications.length ? (
              <div className="updates-list">
                {notifications.slice(0, 4).map((notice) => (
                  <Link
                    key={notice.id}
                    to={notice.link || "/kurslarim"}
                    className={notice.is_read ? "" : "is-unread"}
                  >
                    <p>{notice.message}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="updates-empty">Yangi xabar yo'q.</p>
            )}
          </section>
        </aside>
      </div>
      <RecentNoteCard note={dashboard?.recent_note} />
    </section>
  );
}
