import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, formatPrice } from "../lib/api";
import "./InstructorDashboardPage.css";

function KpiCard({ label, value, hint, tone = "purple" }) {
  return (
    <article className={`instructor-kpi instructor-kpi--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function QueueSection({ title, count, empty, children }) {
  return (
    <section className="instructor-panel">
      <div className="instructor-panel__head">
        <h2>{title}</h2>
        <span className="instructor-count" aria-label={`${count} ta`}>{count}</span>
      </div>
      {count ? <div className="instructor-queue">{children}</div> : <p className="instructor-empty">{empty}</p>}
    </section>
  );
}

export default function InstructorDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    analyticsApi
      .instructor(token)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (loading) {
    return <div className="instructor-state"><Spinner /></div>;
  }

  if (error || !data) {
    return (
      <div className="instructor-state">
        <EmptyState title="Dashboard yuklanmadi" description={error || "Qayta urinib ko'ring."} />
        <button className="instructor-button" type="button" onClick={load}>Qayta urinish</button>
      </div>
    );
  }

  const queues = data.queues ?? {};
  const submissions = queues.submissions ?? [];
  const questions = queues.questions ?? [];
  const alerts = queues.content_alerts ?? [];
  const courses = data.per_course ?? [];

  return (
    <main className="instructor-home">
      <header className="instructor-hero">
        <div>
          <p className="instructor-eyebrow">Instructor Home</p>
          <h1>Bugun nimaga e'tibor beramiz?</h1>
          <p>Tekshiruvlar, savollar va kurs salomatligi bitta operatsion markazda.</p>
        </div>
        <div className="instructor-actions">
          <Link className="instructor-button instructor-button--ghost" to="/instructor/manage">Kurslar</Link>
          <Link className="instructor-button" to="/instructor/manage">+ Yangi kurs</Link>
        </div>
      </header>

      <section className="instructor-kpis" aria-label="Asosiy ko'rsatkichlar">
        <KpiCard label="Tekshiriladigan ishlar" value={data.pending_submissions ?? 0} hint="eng eski ish birinchi" tone="orange" />
        <KpiCard label="Javobsiz savollar" value={data.unanswered_questions ?? 0} hint="talabalar kutmoqda" tone="blue" />
        <KpiCard label="Faol talabalar" value={data.active_students ?? 0} hint={`${data.courses_count ?? 0} kurs bo'yicha`} tone="green" />
        <KpiCard label="Daromad" value={formatPrice(data.revenue?.net_revenue ?? 0)} hint={`${data.revenue?.paid_orders ?? 0} muvaffaqiyatli to'lov`} />
      </section>

      {courses.length === 0 ? (
        <section className="instructor-panel">
          <EmptyState title="Hali kurs yo'q" description="Birinchi kursni yarating, dashboard shu yerda jonlanadi." />
          <Link className="instructor-button" to="/instructor/manage">Kurs yaratish</Link>
        </section>
      ) : (
        <>
          <div className="instructor-grid">
            <QueueSection title="Tekshiruv navbati" count={submissions.length} empty="Zo'r, tekshiriladigan ish qolmadi.">
              {submissions.map((item) => (
                <article className="instructor-queue__item" key={item.submission_id}>
                  <div>
                    <strong>{item.assignment_title}</strong>
                    <p>{item.student_name} · {item.course_title}</p>
                    <small>{formatDate(item.submitted_at)}</small>
                  </div>
                  <Link to={item.review_url}>Tekshirish</Link>
                </article>
              ))}
            </QueueSection>

            <QueueSection title="Javobsiz Q&A" count={questions.length} empty="Barcha savollarga javob berilgan.">
              {questions.map((item) => (
                <article className="instructor-queue__item" key={item.question_id}>
                  <div>
                    <strong>{item.body}</strong>
                    <p>{item.student_name} · {item.lesson_title}</p>
                    <small>{formatDate(item.created_at)}</small>
                  </div>
                  <Link to={item.answer_url}>Javob berish</Link>
                </article>
              ))}
            </QueueSection>
          </div>

          <section className="instructor-panel">
            <div className="instructor-panel__head">
              <div>
                <h2>Kurslar salomatligi</h2>
                <p>Faollik, tugatish, dropout va daromad bir qarashda.</p>
              </div>
              <span className="instructor-count">{courses.length}</span>
            </div>
            <div className="instructor-course-grid">
              {courses.map((course) => (
                <article className="instructor-course" key={course.course_id}>
                  <div className="instructor-course__title">
                    <div>
                      <span className={`instructor-status instructor-status--${course.status}`}>{course.status === "published" ? "Chop etilgan" : "Qoralama"}</span>
                      <h3>{course.title}</h3>
                    </div>
                    <Link to={`/instructor/courses/${course.course_id}/edit`}>Boshqarish</Link>
                  </div>
                  <div className="instructor-course__stats">
                    <span><strong>{course.active_students}</strong> faol</span>
                    <span><strong>{course.completion_rate}%</strong> tugatish</span>
                    <span><strong>{course.dropout_rate}%</strong> dropout</span>
                    <span><strong>{formatPrice(course.net_revenue)}</strong> daromad</span>
                  </div>
                  <div className="instructor-progress" aria-label={`Tugatish ${course.completion_rate}%`}>
                    <span style={{ width: `${Math.min(100, course.completion_rate || 0)}%` }} />
                  </div>
                  {course.alerts_count > 0 && <p className="instructor-warning">{course.alerts_count} ta kontent ogohlantirishi</p>}
                </article>
              ))}
            </div>
          </section>

          <QueueSection title="Kontent sifati" count={alerts.length} empty="Kurslarda kritik kontent muammosi yo'q.">
            {alerts.map((alert, index) => (
              <article className="instructor-queue__item" key={`${alert.course_id}-${alert.code}-${index}`}>
                <div>
                  <span className={`instructor-severity instructor-severity--${alert.severity}`}>{alert.severity}</span>
                  <strong>{alert.message}</strong>
                  <p>{alert.course_title}</p>
                </div>
                <Link to={alert.edit_url}>Tuzatish</Link>
              </article>
            ))}
          </QueueSection>
        </>
      )}
    </main>
  );
}
