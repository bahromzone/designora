import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { instructorAnalyticsApi } from "../lib/instructorAnalyticsApi";
import "./InstructorAnalyticsPage.css";

function Bars({ rows, labelKey, valueKey, suffix = "%" }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return <div className="ia-bars">{rows.map((row) => <div className="ia-bar" key={row[labelKey]}><div><strong>{row[labelKey]}</strong><span>{row[valueKey]}{suffix}</span></div><i><b style={{ width: `${((Number(row[valueKey]) || 0) / max) * 100}%` }} /></i></div>)}</div>;
}

export default function InstructorAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    instructorAnalyticsApi.get(token, courseId).then(setData).catch((err) => setError(err.message));
  }, [token, courseId]);

  if (error) return <main className="ia-shell"><p>{error}</p></main>;
  if (!data) return <main className="ia-shell"><p>Analytics yuklanmoqda...</p></main>;

  return <main className="ia-shell">
    <header className="ia-header"><div><Link to="/instruktor-panel">← Instructor Home</Link><p>Roadmap 3.21</p><h1>Instructor analytics</h1></div><div><select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">Barcha kurslar</option>{data.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><a className="ia-export" href={instructorAnalyticsApi.exportUrl(courseId)}>CSV export</a></div></header>
    <section className="ia-kpis"><article><span>Assignment</span><strong>{data.assignments.submitted}</strong><small>{data.assignments.graded} graded</small></article><article><span>Average grade</span><strong>{data.assignments.average_grade}%</strong><small>{data.assignments.returned} returned</small></article><article><span>Average rating</span><strong>{data.sentiment.average_rating}</strong><small>{data.sentiment.positive} positive</small></article><article><span>Completion</span><strong>{data.funnel.at(-1)?.conversion || 0}%</strong><small>course funnel</small></article></section>
    <div className="ia-grid"><section className="ia-card"><h2>Enrollment funnel</h2><Bars rows={data.funnel} labelKey="step" valueKey="conversion" /></section><section className="ia-card"><h2>Video drop-off</h2><Bars rows={data.video_dropoff} labelKey="percent" valueKey="viewers" suffix=" viewers" /></section><section className="ia-card"><h2>Lesson completion</h2><Bars rows={data.lessons} labelKey="title" valueKey="completion_rate" /></section><section className="ia-card"><h2>Quiz difficulty</h2><div className="ia-table">{data.quizzes.map((quiz) => <p key={quiz.quiz_id}><strong>{quiz.title}</strong><span>{quiz.average_score}% · {quiz.difficulty}</span></p>)}{!data.quizzes.length && <p>Quiz data yo‘q.</p>}</div></section></div>
  </main>;
}
