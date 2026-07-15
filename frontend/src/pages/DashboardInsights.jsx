import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { learningApi } from "../lib/api";
import { assignmentsApi } from "../lib/assignmentsApi";
import "./DashboardInsights.css";

export function buildDashboardMetrics(courses, assignments, now = new Date()) {
  const open = assignments.filter((item) => item.my_submission?.status !== "graded");
  const overdue = open.filter(
    (item) => item.due_date && new Date(item.due_date).getTime() < now.getTime(),
  );
  const dueSoon = open.filter((item) => {
    if (!item.due_date) return false;
    const distance = new Date(item.due_date).getTime() - now.getTime();
    return distance >= 0 && distance <= 3 * 86400000;
  });
  const feedback = assignments.filter((item) => item.my_submission?.status === "graded");
  const average = courses.length
    ? Math.round(
        courses.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) /
          courses.length,
      )
    : 0;
  return { open, overdue, dueSoon, feedback, average };
}

export default function DashboardInsights() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    learningApi
      .myCourses(token)
      .then(async (rows) => {
        const groups = await Promise.all(
          rows.map((course) =>
            assignmentsApi
              .forCourse(course.course_id, token)
              .then((items) => items.map((item) => ({ ...item, course })))
              .catch(() => []),
          ),
        );
        if (active) {
          setCourses(rows);
          setAssignments(groups.flat());
        }
      })
      .catch((reason) => active && setError(reason.message));
    return () => {
      active = false;
    };
  }, [token]);

  const metrics = useMemo(
    () => buildDashboardMetrics(courses, assignments),
    [courses, assignments],
  );

  return (
    <section className="dashboard-insights" aria-labelledby="today-plan-title">
      <div className="insights-heading">
        <div>
          <p className="dashboard-eyebrow">Bugungi reja</p>
          <h2 id="today-plan-title">Deadline va natijalar</h2>
        </div>
        {error && <span role="alert">{error}</span>}
      </div>
      <div className="insights-kpis">
        <article><strong>{metrics.open.length}</strong><span>ochiq vazifa</span></article>
        <article className={metrics.overdue.length ? "danger" : ""}><strong>{metrics.overdue.length}</strong><span>kechikkan</span></article>
        <article><strong>{metrics.dueSoon.length}</strong><span>3 kunda tugaydi</span></article>
        <article><strong>{metrics.feedback.length}</strong><span>yangi feedback</span></article>
        <article><strong>{metrics.average}%</strong><span>o‘rtacha progress</span></article>
      </div>
      <div className="today-list">
        {metrics.open.slice(0, 5).map((item) => (
          <a key={item.id} href={`/organish/${item.course.course_id}`}>
            <span><b>{item.title}</b><small>{item.course.title}</small></span>
            <time dateTime={item.due_date || undefined}>
              {item.due_date ? new Date(item.due_date).toLocaleDateString("uz-UZ") : "Muddat yo‘q"}
            </time>
          </a>
        ))}
        {!metrics.open.length && <p className="insights-empty">Bugungi ochiq vazifalar tugadi.</p>}
      </div>
    </section>
  );
}
