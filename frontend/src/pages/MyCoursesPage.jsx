import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { learningApi } from "../lib/api";
import "./StudentDashboard.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
async function apiGet(path, token) {
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Ma'lumotlarni yuklab bo'lmadi");
  return response.json();
}
function formatDueDate(value) {
  if (!value) return "Muddat belgilanmagan";
  const days = Math.ceil((new Date(value) - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)} kun kechikdi`;
  if (days === 0) return "Bugun";
  if (days === 1) return "Ertaga";
  return new Date(value).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}
function ProgressRing({ value }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = 42; const circumference = 2 * Math.PI * radius;
  return <div className="progress-ring" aria-label={`Umumiy progress ${progress}%`}><svg viewBox="0 0 100 100" role="img"><circle className="progress-ring-track" cx="50" cy="50" r={radius} /><circle className="progress-ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference} /></svg><strong>{progress}%</strong></div>;
}

export default function MyCoursesPage() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]); const [assignments, setAssignments] = useState([]); const [notifications, setNotifications] = useState([]); const [gamification, setGamification] = useState(null); const [nextLesson, setNextLesson] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const rows = await learningApi.myCourses(token); setCourses(rows);
      const active = rows.find((course) => !course.is_completed) ?? rows[0];
      const [noticeRows, game, assignmentGroups, learning] = await Promise.all([
        apiGet("/api/notifications?limit=5", token).catch(() => []),
        apiGet("/api/gamification/me", token).catch(() => null),
        Promise.all(rows.filter((course) => !course.is_completed).map((course) => apiGet(`/api/assignments/courses/${course.course_id}`, token).then((items) => items.map((item) => ({ ...item, course }))).catch(() => []))).then((groups) => groups.flat()),
        active ? learningApi.learn(active.course_id, token).catch(() => null) : Promise.resolve(null),
      ]);
      setNotifications(noticeRows); setGamification(game); setAssignments(assignmentGroups);
      if (learning) {
        const lesson = (learning.modules ?? []).flatMap((module) => module.lessons ?? []).find((item) => !item.is_completed && !item.is_locked);
        setNextLesson(lesson ? { ...lesson, course: active } : null);
      } else setNextLesson(null);
    } catch (err) { setError(err.message || "Dashboardni yuklab bo'lmadi"); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const activeCourses = useMemo(() => courses.filter((course) => !course.is_completed), [courses]);
  const completedCount = courses.length - activeCourses.length;
  const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + (course.progress_percent || 0), 0) / courses.length) : 0;
  const pendingAssignments = useMemo(() => assignments.filter((item) => item.my_submission?.status !== "graded").sort((a, b) => new Date(a.due_date || 8640000000000000) - new Date(b.due_date || 8640000000000000)).slice(0, 4), [assignments]);
  const feedbackItems = assignments.filter((item) => item.my_submission?.status === "graded");
  const continueCourse = nextLesson?.course ?? activeCourses[0] ?? courses[0];
  const firstName = (user?.name || user?.full_name || "Talaba").trim().split(" ")[0];
  if (loading) return <section className="student-dashboard"><div className="dashboard-skeleton" aria-busy="true"><div className="sk sk-title" /><div className="sk-grid"><div className="sk sk-feature" /><div className="sk sk-side" /></div></div></section>;
  if (error) return <section className="student-dashboard"><div className="dashboard-error" role="alert"><h1>Dashboard ochilmadi</h1><p>{error}</p><button type="button" onClick={loadDashboard}>Qayta urinish</button></div></section>;
  if (!courses.length) return <section className="student-dashboard"><div className="dashboard-empty"><p className="dashboard-eyebrow">Shaxsiy kabinet</p><h1>Birinchi loyihangiz shu yerdan boshlanadi.</h1><p>Yo'nalishingizga mos kursni tanlang. Progress, vazifalar va sertifikatlar shu dashboard'da jamlanadi.</p><Link to="/kurslar" className="dashboard-primary">Kurslarni ko'rish</Link></div></section>;
  return <section className="student-dashboard">
    <header className="dashboard-heading"><div><p className="dashboard-eyebrow">Shaxsiy kabinet</p><h1>Salom, {firstName}.</h1><p className="dashboard-subtitle">Bugungi eng muhim qadamni tanladik. Davom eting.</p></div><Link to="/kurslar" className="dashboard-secondary">Yangi kurs topish</Link></header>
    <div className="dashboard-lead-grid"><article className="continue-panel"><div className="continue-copy"><span className="continue-label">Davom ettirish</span><p className="continue-course">{continueCourse?.title}</p><h2>{nextLesson?.title || "Keyingi darsga o'ting"}</h2><p>{continueCourse?.progress_percent || 0}% bajarildi, {continueCourse?.lessons_count || 0} ta dars.</p><Link to={`/organish/${continueCourse?.course_id}`} className="continue-action">Darsni ochish →</Link></div><div className="continue-progress" aria-hidden="true"><span>{continueCourse?.progress_percent || 0}</span><small>%</small></div></article><aside className="momentum-panel"><div className="momentum-title"><span>🔥</span><div><small>O'qish ritmi</small><strong>{gamification?.streak_days || 0} kunlik streak</strong></div></div><div className="momentum-level"><div><span>Daraja {gamification?.level || 1}</span><b>{gamification?.points || 0} XP</b></div><div className="momentum-track"><i style={{ width: `${Math.min(100, Math.max(4, 100 - ((gamification?.points_to_next_level || 100) / 100) * 100))}%` }} /></div><p>Keyingi darajagacha {gamification?.points_to_next_level || 100} XP</p></div><div className="momentum-stats"><span><b>{activeCourses.length}</b> faol kurs</span><span><b>{completedCount}</b> yakunlangan</span></div></aside></div>
    <div className="dashboard-content-grid"><div className="dashboard-main-column"><section className="dashboard-section"><div className="section-heading"><div><p className="dashboard-eyebrow">Navbatdagi ishlar</p><h2>Rejangiz</h2></div><span>{pendingAssignments.length} ta ochiq</span></div>{pendingAssignments.length ? <div className="task-list">{pendingAssignments.map((item) => <Link key={item.id} to={`/organish/${item.course.course_id}`} className="task-row"><span className="task-copy"><strong>{item.title}</strong><small>{item.course.title}</small></span><span className="task-due">{item.my_submission?.status === "submitted" ? "Tekshiruvda" : formatDueDate(item.due_date)}</span>→</Link>)}</div> : <div className="inline-empty"><strong>Hammasi joyida</strong><p>Hozircha ochiq topshiriq yo'q.</p></div>}</section><section className="dashboard-section"><div className="section-heading"><div><p className="dashboard-eyebrow">Kurslar</p><h2>O'qish yo'lingiz</h2></div><Link to="/kurslar">Barchasini ko'rish</Link></div><div className="course-list">{courses.slice(0, 4).map((course) => <Link key={course.course_id} to={`/organish/${course.course_id}`} className="course-row"><div className="course-thumb">{course.thumbnail_url ? <img src={course.thumbnail_url} alt="" /> : <span>D</span>}</div><div className="course-row-copy"><small>{course.category || course.level || "Dizayn"}</small><strong>{course.title}</strong><span>{course.lessons_count || 0} dars</span></div><div className="course-row-progress"><b>{course.progress_percent || 0}%</b><div><i style={{ width: `${course.progress_percent || 0}%` }} /></div></div>→</Link>)}</div></section></div><aside className="dashboard-side-column"><section className="progress-panel"><div><p className="dashboard-eyebrow">Umumiy natija</p><h2>Progress</h2></div><ProgressRing value={averageProgress} /><p>{completedCount ? `${completedCount} ta kurs yakunlandi.` : "Birinchi kursni yakunlash tomon ketyapsiz."}</p>{feedbackItems.length > 0 && <Link to="/profil">{feedbackItems.length} ta feedback olindi</Link>}</section><section className="updates-panel"><div className="section-heading compact"><div><p className="dashboard-eyebrow">Yangiliklar</p><h2>So'nggi xabarlar</h2></div></div>{notifications.length ? <div className="updates-list">{notifications.slice(0, 4).map((notice) => <Link key={notice.id} to={notice.link || "/kurslarim"} className={notice.is_read ? "" : "is-unread"}><p>{notice.message}</p></Link>)}</div> : <p className="updates-empty">Yangi xabar yo'q.</p>}</section></aside></div>
  </section>;
}
