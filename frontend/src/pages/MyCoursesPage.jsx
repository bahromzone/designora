import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { learningApi } from "../lib/api";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function apiGet(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Ma'lumotlarni yuklab bo'lmadi");
  return response.json();
}

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    fire: <path d="M12 22c4.4 0 8-3.4 8-7.8 0-3.1-1.7-5.8-4.3-7.2.1 2-1 3.6-2.1 4.2.2-3.9-2-7.4-5.2-9.2.2 3.1-1.8 5-3.1 7C4.5 10.2 4 12 4 14.2 4 18.6 7.6 22 12 22Z"/>,
    medal: <><circle cx="12" cy="8" r="5"/><path d="m8.5 12-1.5 10 5-3 5 3-1.5-10"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
    spark: <><path d="m12 3-1.2 4.1L7 9l3.8 1.9L12 15l1.2-4.1L17 9l-3.8-1.9Z"/><path d="m5 15-.7 2.3L2 18.5l2.3 1.2L5 22l.7-2.3L8 18.5l-2.3-1.2Z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 6-6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Dashboard yuklanmoqda" aria-busy="true">
      <div className="sk sk-title" />
      <div className="sk-grid">
        <div className="sk sk-feature" />
        <div className="sk sk-side" />
      </div>
      <div className="sk sk-row" />
      <div className="sk sk-row" />
    </div>
  );
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

function formatDueDate(value) {
  if (!value) return "Muddat belgilanmagan";
  const date = new Date(value);
  const today = new Date();
  const days = Math.ceil((date - today) / 86400000);
  if (days < 0) return `${Math.abs(days)} kun kechikdi`;
  if (days === 0) return "Bugun";
  if (days === 1) return "Ertaga";
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

export default function MyCoursesPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [nextLesson, setNextLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const courseRows = await learningApi.myCourses(token);
      setCourses(courseRows);

      const active = courseRows.find((course) => !course.is_completed) ?? courseRows[0];
      const requests = [
        apiGet("/api/notifications?limit=5", token).catch(() => []),
        apiGet("/api/gamification/me", token).catch(() => null),
        Promise.all(
          courseRows
            .filter((course) => !course.is_completed)
            .map((course) =>
              apiGet(`/api/assignments/courses/${course.course_id}`, token)
                .then((items) => items.map((item) => ({ ...item, course })))
                .catch(() => [])
            )
        ).then((groups) => groups.flat()),
        active
          ? learningApi.learn(active.course_id, token).catch(() => null)
          : Promise.resolve(null),
      ];

      const [noticeRows, game, assignmentRows, learning] = await Promise.all(requests);
      setNotifications(noticeRows);
      setGamification(game);
      setAssignments(assignmentRows);

      if (learning) {
        const lessons = (learning.modules ?? []).flatMap((module) => module.lessons ?? []);
        const next = lessons.find((lesson) => !lesson.is_completed && !lesson.is_locked);
        setNextLesson(next ? { ...next, course: active } : null);
      } else {
        setNextLesson(null);
      }
    } catch (err) {
      setError(err.message || "Dashboardni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeCourses = useMemo(() => courses.filter((course) => !course.is_completed), [courses]);
  const completedCount = courses.length - activeCourses.length;
  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + (course.progress_percent || 0), 0) / courses.length)
    : 0;
  const continueCourse = nextLesson?.course ?? activeCourses[0] ?? courses[0];
  const pendingAssignments = useMemo(
    () => assignments
      .filter((item) => item.my_submission?.status !== "graded")
      .sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      })
      .slice(0, 4),
    [assignments]
  );
  const feedbackItems = assignments.filter((item) => item.my_submission?.status === "graded");
  const firstName = (user?.full_name || user?.username || "Talaba").trim().split(" ")[0];

  if (loading) return <section className="student-dashboard"><DashboardSkeleton /></section>;

  if (error) {
    return (
      <section className="student-dashboard">
        <div className="dashboard-error" role="alert">
          <span><Icon name="target" size={24} /></span>
          <h1>Dashboard ochilmadi</h1>
          <p>{error}</p>
          <button type="button" onClick={loadDashboard}>Qayta urinish</button>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className="student-dashboard">
        <div className="dashboard-empty">
          <span className="empty-mark"><Icon name="spark" size={30} /></span>
          <p className="dashboard-eyebrow">Shaxsiy kabinet</p>
          <h1>Birinchi loyihangiz shu yerdan boshlanadi.</h1>
          <p>Yo‘nalishingizga mos kursni tanlang. Progress, vazifalar va sertifikatlar shu dashboard’da jamlanadi.</p>
          <Link to="/kurslar" className="dashboard-primary">Kurslarni ko‘rish <Icon name="arrow" /></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="student-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">Shaxsiy kabinet</p>
          <h1>Salom, {firstName}.</h1>
          <p className="dashboard-subtitle">Bugungi eng muhim qadamni tanladik. Davom eting.</p>
        </div>
        <Link to="/kurslar" className="dashboard-secondary">Yangi kurs topish</Link>
      </header>

      <div className="dashboard-lead-grid">
        <article className="continue-panel">
          <div className="continue-copy">
            <span className="continue-label"><Icon name="book" size={16} /> Davom ettirish</span>
            <p className="continue-course">{continueCourse?.title}</p>
            <h2>{nextLesson?.title || "Keyingi darsga o'ting"}</h2>
            <p>{continueCourse?.progress_percent || 0}% bajarildi, {continueCourse?.lessons_count || 0} ta dars.</p>
            <Link to={`/organish/${continueCourse?.course_id}`} className="continue-action">
              Darsni ochish <Icon name="arrow" />
            </Link>
          </div>
          <div className="continue-progress" aria-hidden="true">
            <span>{continueCourse?.progress_percent || 0}</span>
            <small>%</small>
          </div>
        </article>

        <aside className="momentum-panel">
          <div className="momentum-title">
            <span><Icon name="fire" /></span>
            <div><small>O‘qish ritmi</small><strong>{gamification?.streak_days || 0} kunlik streak</strong></div>
          </div>
          <div className="momentum-level">
            <div><span>Daraja {gamification?.level || 1}</span><b>{gamification?.points || 0} XP</b></div>
            <div className="momentum-track"><i style={{ width: `${Math.min(100, Math.max(4, 100 - ((gamification?.points_to_next_level || 100) / 100) * 100))}%` }} /></div>
            <p>Keyingi darajagacha {gamification?.points_to_next_level || 100} XP</p>
          </div>
          <div className="momentum-stats">
            <span><b>{activeCourses.length}</b> faol kurs</span>
            <span><b>{completedCount}</b> yakunlangan</span>
          </div>
        </aside>
      </div>

      <div className="dashboard-content-grid">
        <div className="dashboard-main-column">
          <section className="dashboard-section" aria-labelledby="tasks-title">
            <div className="section-heading">
              <div><p className="dashboard-eyebrow">Navbatdagi ishlar</p><h2 id="tasks-title">Rejangiz</h2></div>
              <span>{pendingAssignments.length} ta ochiq</span>
            </div>
            {pendingAssignments.length ? (
              <div className="task-list">
                {pendingAssignments.map((item) => {
                  const submitted = item.my_submission?.status === "submitted";
                  return (
                    <Link key={item.id} to={`/organish/${item.course.course_id}`} className="task-row">
                      <span className={`task-status ${submitted ? "is-submitted" : ""}`}><Icon name={submitted ? "check" : "clock"} size={18} /></span>
                      <span className="task-copy"><strong>{item.title}</strong><small>{item.course.title}</small></span>
                      <span className="task-due">{submitted ? "Tekshiruvda" : formatDueDate(item.due_date)}</span>
                      <Icon name="arrow" size={18} />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="inline-empty"><Icon name="check" /><div><strong>Hammasi joyida</strong><p>Hozircha ochiq topshiriq yo‘q. Keyingi darsni davom ettiring.</p></div></div>
            )}
          </section>

          <section className="dashboard-section" aria-labelledby="courses-title">
            <div className="section-heading">
              <div><p className="dashboard-eyebrow">Kurslar</p><h2 id="courses-title">O‘qish yo‘lingiz</h2></div>
              <Link to="/kurslar">Barchasini ko‘rish</Link>
            </div>
            <div className="course-list">
              {courses.slice(0, 4).map((course) => (
                <Link key={course.course_id} to={`/organish/${course.course_id}`} className="course-row">
                  <div className="course-thumb">
                    {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" /> : <span>D</span>}
                  </div>
                  <div className="course-row-copy"><small>{course.category || course.level || "Dizayn"}</small><strong>{course.title}</strong><span>{course.lessons_count} dars</span></div>
                  <div className="course-row-progress"><b>{course.progress_percent}%</b><div><i style={{ width: `${course.progress_percent}%` }} /></div></div>
                  <Icon name="arrow" size={18} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <section className="progress-panel" aria-labelledby="progress-title">
            <div><p className="dashboard-eyebrow">Umumiy natija</p><h2 id="progress-title">Progress</h2></div>
            <ProgressRing value={averageProgress} />
            <p>{completedCount ? `${completedCount} ta kurs yakunlandi.` : "Birinchi kursni yakunlash tomon ketyapsiz."}</p>
            {feedbackItems.length > 0 && <Link to="/profil"><Icon name="message" size={18} /> {feedbackItems.length} ta feedback olindi</Link>}
          </section>

          <section className="updates-panel" aria-labelledby="updates-title">
            <div className="section-heading compact"><div><p className="dashboard-eyebrow">Yangiliklar</p><h2 id="updates-title">So‘nggi xabarlar</h2></div></div>
            {notifications.length ? (
              <div className="updates-list">
                {notifications.slice(0, 4).map((notice) => (
                  <Link key={notice.id} to={notice.link || "#"} className={notice.is_read ? "" : "is-unread"}>
                    <span><Icon name={notice.type === "feedback" ? "message" : "spark"} size={16} /></span>
                    <p>{notice.message}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="updates-empty">Yangi xabar yo‘q. Muhim yangiliklar shu yerda chiqadi.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
