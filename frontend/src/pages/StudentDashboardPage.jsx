import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../lib/dashboardApi";
import { discoveryApi } from "../lib/api";
import "./StudentDashboard.css";

const premiumEasing = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEasing, delay: i * 0.06 },
  }),
};

function Skeleton() {
  return (
    <div className="student-dashboard">
      <div className="dashboard-skeleton">
        <div className="sk sk-title" />
        <div className="sk-grid">
          <div className="sk sk-feature" />
          <div className="sk sk-side" />
        </div>
        <div className="sk sk-row" />
        <div className="sk sk-row" />
        <div className="sk sk-row" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="student-dashboard">
      <div className="dashboard-error">
        <span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <h1>Xatolik yuz berdi</h1>
        <p>{message || "Dashboard ma'lumotlarini yuklashda xato. Iltimos, qayta urinib ko'ring."}</p>
        <button onClick={onRetry}>Qayta urinish</button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="student-dashboard">
      <div className="dashboard-empty">
        <div className="empty-mark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <p className="dashboard-eyebrow">Boshlash vaqti keldi</p>
        <h1>Birinchi kursga yoziling!</h1>
        <p>
          Siz hali hech qanday kursga yozilmagansiz. Katalogdan o'zingizga mos
          kursni tanlang va dizayn sayohatingizni bugundan boshlang.
        </p>
        <Link to="/kurslar" className="dashboard-primary">
          Katalogni ko'rish
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function formatDueDate(dateStr) {
  if (!dateStr) return "";
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return "Muddati o'tgan";
  if (diffHours < 24) return `Bugun, ${due.getHours().toString().padStart(2, "0")}:${due.getMinutes().toString().padStart(2, "0")}`;
  if (diffDays === 1) return `Ertaga, ${due.getHours().toString().padStart(2, "0")}:${due.getMinutes().toString().padStart(2, "0")}`;
  return `${due.getDate()}-${["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"][due.getMonth()]}`;
}

function getDeadlineUrgency(dateStr) {
  if (!dateStr) return "normal";
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffMs < 0 || diffHours < 12) return "urgent";
  if (diffHours < 48) return "soon";
  return "normal";
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardApi.get();
      setData(result);
      try {
        const recs = await discoveryApi.bestselling(5);
        setRecommendations(recs?.courses || recs || []);
      } catch {
        /* recommendations are non-critical */
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data || !data.courses || data.courses.length === 0) return <EmptyState />;

  const { courses, assignments, notifications, gamification, next_lesson, summary } = data;
  const activeCourses = courses.filter((c) => !c.is_completed);
  const firstName = user?.full_name?.split(" ")[0] || user?.username || "";

  // Today's plan: assignments due soon + next lessons
  const openAssignments = assignments.filter(
    (a) => !a.my_submission || a.my_submission.status !== "graded"
  );
  const dueSoon = openAssignments
    .filter((a) => a.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  // Notifications that are unread feedback
  const feedbackNotifs = notifications.filter((n) => !n.is_read).slice(0, 3);

  return (
    <div className="student-dashboard">
      {/* Header */}
      <motion.header
        className="dashboard-heading"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <p className="dashboard-eyebrow">Dashboard</p>
          <h1>Salom, {firstName} \ud83d\udc4b</h1>
          <p className="dashboard-subtitle">
            Bugun dizayn mahoratingizni oshirish uchun ajoyib kun!
          </p>
        </div>
        <div className="dashboard-badges">
          {gamification.streak_days > 0 && (
            <span className="dash-badge streak">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
              {gamification.streak_days} kun
            </span>
          )}
          <span className="dash-badge xp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {gamification.points?.toLocaleString()} XP
          </span>
        </div>
      </motion.header>

      {/* Continue Learning Hero */}
      {next_lesson && (
        <motion.section
          className="continue-panel"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          <div className="continue-copy">
            <span className="continue-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Davom ettirish
            </span>
            <p className="continue-course">{next_lesson.course?.title}</p>
            <h2>{next_lesson.title}</h2>
            <p>
              {next_lesson.duration_seconds
                ? `~${Math.ceil(next_lesson.duration_seconds / 60)} daqiqa`
                : ""}
              {next_lesson.order ? ` \u00b7 ${next_lesson.order}-dars` : ""}
            </p>
            <Link
              to={`/organish/${next_lesson.course?.course_id}`}
              className="continue-action"
            >
              Darsni davom ettirish
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
          <div className="continue-progress">
            <span>{next_lesson.course?.progress_percent || 0}</span>
            <small>%</small>
          </div>
        </motion.section>
      )}

      {/* Main Grid */}
      <div className="dashboard-content-grid">
        <div className="dashboard-main-column">
          {/* Today's Plan / Assignments Due */}
          {dueSoon.length > 0 && (
            <motion.section
              className="dashboard-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              <div className="section-heading">
                <div>
                  <p className="dashboard-eyebrow">Yaqinlashayotgan</p>
                  <h2>Topshiriqlar</h2>
                </div>
                <Link to="/calendar" className="section-heading-link">Kalendar</Link>
              </div>
              <div className="task-list">
                {dueSoon.map((item) => {
                  const urgency = getDeadlineUrgency(item.due_date);
                  const isSubmitted = item.my_submission && item.my_submission.status !== "graded";
                  return (
                    <Link
                      key={item.id}
                      to={`/organish/${item.course_id}`}
                      className="task-row"
                    >
                      <span className={`task-status ${isSubmitted ? "is-submitted" : ""}`}>
                        {isSubmitted ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        )}
                      </span>
                      <span className="task-copy">
                        <strong>{item.title}</strong>
                        <small>{item.course?.title}</small>
                      </span>
                      <span className={`task-due ${urgency === "urgent" ? "is-urgent" : ""}`}>
                        {formatDueDate(item.due_date)}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="task-arrow"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Active Courses */}
          <motion.section
            className="dashboard-section"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <div className="section-heading">
              <div>
                <p className="dashboard-eyebrow">Faol</p>
                <h2>Kurslarim</h2>
              </div>
              <span>{activeCourses.length} ta kurs</span>
            </div>
            <div className="course-list">
              {activeCourses.slice(0, 5).map((course) => (
                <Link
                  key={course.course_id}
                  to={`/organish/${course.course_id}`}
                  className="course-row"
                >
                  <span className="course-thumb">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" />
                    ) : (
                      <span>{course.category?.[0]?.toUpperCase() || "\ud83c\udfa8"}</span>
                    )}
                  </span>
                  <span className="course-row-copy">
                    <small>{course.category || "Kurs"}</small>
                    <strong>{course.title}</strong>
                    <span>{course.lessons_count} ta dars</span>
                  </span>
                  <span className="course-row-progress">
                    <b>{course.progress_percent}%</b>
                    <div>
                      <i style={{ width: `${course.progress_percent}%` }} />
                    </div>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="task-arrow"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              ))}
            </div>
          </motion.section>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <motion.section
              className="dashboard-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
            >
              <div className="section-heading">
                <div>
                  <p className="dashboard-eyebrow">Tavsiya</p>
                  <h2>Sizga mos kurslar</h2>
                </div>
                <Link to="/kurslar" className="section-heading-link">Barchasi</Link>
              </div>
              <div className="rec-scroll">
                {recommendations.slice(0, 5).map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/kurslar/${rec.id}`}
                    className="rec-card"
                  >
                    <span className="rec-card-img">
                      {rec.thumbnail_url ? (
                        <img src={rec.thumbnail_url} alt="" />
                      ) : (
                        <span>{rec.category?.[0]?.toUpperCase() || "\ud83c\udfa8"}</span>
                      )}
                    </span>
                    <span className="rec-card-body">
                      <strong>{rec.title}</strong>
                      <span className="rec-card-meta">
                        {rec.level || ""}
                        {rec.average_rating ? ` \u2605 ${rec.average_rating.toFixed(1)}` : ""}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        {/* Sidebar */}
        <div className="dashboard-side-column">
          {/* Progress Ring */}
          <motion.div
            className="progress-panel"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            <div className="section-heading compact">
              <div>
                <p className="dashboard-eyebrow">Umumiy</p>
                <h2>Progress</h2>
              </div>
            </div>
            <div className="progress-ring">
              <svg viewBox="0 0 120 120">
                <circle className="progress-ring-track" cx="60" cy="60" r="52" />
                <circle
                  className="progress-ring-value"
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={
                    2 * Math.PI * 52 * (1 - (summary.average_progress || 0) / 100)
                  }
                />
              </svg>
              <strong>{summary.average_progress}%</strong>
            </div>
            <p>
              {summary.active_courses} ta faol kurs, {summary.completed_courses} ta yakunlangan
            </p>
            {summary.active_courses > 0 && (
              <Link to={`/organish/${activeCourses[0]?.course_id}`}>
                O'qishni davom ettirish
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
            )}
          </motion.div>

          {/* Notifications / Feedback */}
          <motion.div
            className="updates-panel"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <div className="section-heading compact">
              <div>
                <p className="dashboard-eyebrow">Yangiliklar</p>
                <h2>Xabarlar</h2>
              </div>
            </div>
            {feedbackNotifs.length === 0 ? (
              <p className="updates-empty">
                Hozircha yangi xabar yo'q. Darslarni davom ettiring, instructor feedback'i shu yerda paydo bo'ladi.
              </p>
            ) : (
              <div className="updates-list">
                {feedbackNotifs.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.link || "#"}
                    className={notif.is_read ? "" : "is-unread"}
                  >
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <p>{notif.message}</p>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Gamification / Level */}
          <motion.div
            className="momentum-panel"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            <div className="momentum-title">
              <span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </span>
              <div>
                <small>Daraja</small>
                <strong>Level {gamification.level}</strong>
              </div>
            </div>
            <div className="momentum-level">
              <div>
                <span>Keyingi darajagacha</span>
                <b>{gamification.points_to_next_level} XP</b>
              </div>
              <div className="momentum-track">
                <i
                  style={{
                    width: `${Math.max(5, 100 - (gamification.points_to_next_level / 500) * 100)}%`,
                  }}
                />
              </div>
              <p>Har dars +10 XP, topshiriq +25 XP, quiz +15 XP</p>
            </div>
            <div className="momentum-stats">
              <div>
                <b>{gamification.streak_days}</b>
                <span>Streak (kun)</span>
              </div>
              <div>
                <b>{summary.open_assignments}</b>
                <span>Ochiq topshiriq</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
