import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AssignmentSection from "../components/AssignmentSection";
import LessonSidebar from "../components/LessonSidebar";
import NotesSection from "../components/NotesSection";
import QASection from "../components/QASection";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignmentsApi";
import { certificatesApi, learningApi, quizApi } from "../lib/api";
import "./LearnPage.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function Icon({ name, size = 18 }) {
  const paths = {
    "arrow-left": <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/>,
    sparkles: <><path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3Z"/><path d="m19 15-.7 2.3L16 18l2.3.7L19 21l.7-2.3L22 18l-2.3-.7L19 15Z"/></>,
    award: <><circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9"/></>,
    external: <><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function resolveCertificateUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function certificatePanelState(certificate, progress, quizzes = []) {
  if (certificate) return "issued";
  if (Number(progress) >= 100) return quizzes.length ? "quiz_required" : "ready";
  return "in_progress";
}

function CertificatePanel({ certificate, progress, quizzes, issuing, error, onIssue }) {
  const progressValue = Math.min(100, Math.max(0, Number(progress) || 0));
  const state = certificatePanelState(certificate, progressValue, quizzes);
  if (state === "in_progress") return null;
  const issued = state === "issued";
  const verifyUrl = certificate ? `/verify/${certificate.verification_code}` : null;

  return (
    <section className={`learn-certificate ${issued ? "is-issued" : "is-ready"}`} aria-live="polite">
      <div className="learn-certificate-inner">
        <div className="learn-certificate-copy">
          <span className="learn-certificate-icon" aria-hidden="true"><Icon name={issued ? "check" : "award"} size={22} /></span>
          <div>
            <p className="learn-overline">{issued ? "Sertifikat tayyor" : "Kurs yakunlandi"}</p>
            <h2>{issued ? "Natijangiz tasdiqlandi." : "Bilimingizni sertifikat bilan yakunlang."}</h2>
            <p>{issued ? `Serial: ${certificate.serial}${certificate.grade ? ` · ${certificate.grade}` : ""}` : state === "quiz_required" ? `Sertifikat olishdan oldin ${quizzes.length} ta faol testdan o'ting.` : "Barcha darslar tugadi. Sertifikatingizni hozir olishingiz mumkin."}</p>
          </div>
        </div>
        <div className="learn-certificate-actions">
          {issued ? <>
            {verifyUrl && <a className="btn-outline" href={verifyUrl} target="_blank" rel="noreferrer"><Icon name="external" size={15} />Tekshirish</a>}
            {certificate.pdf_url && <a className="btn-primary" href={resolveCertificateUrl(certificate.pdf_url)} target="_blank" rel="noreferrer"><Icon name="paperclip" size={15} />PDF yuklash</a>}
          </> : <button className="btn-primary" type="button" onClick={onIssue} disabled={issuing}><Icon name="award" size={16} />{issuing ? "Tayyorlanmoqda..." : "Sertifikatni olish"}</button>}
        </div>
      </div>
      {error && <p className="learn-certificate-error" role="alert">{error}</p>}
    </section>
  );
}

export default function LearnPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificateError, setCertificateError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [marking, setMarking] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [course, assignmentRows, quizRows, certificateRows] = await Promise.all([
        learningApi.learn(courseId, token),
        assignmentsApi.forCourse(courseId, token).catch(() => []),
        quizApi.courseQuizzes(courseId, token).catch(() => []),
        certificatesApi.mine(token).catch(() => []),
      ]);
      setData(course);
      setAssignments(assignmentRows);
      setQuizzes(quizRows);
      setCertificate(certificateRows.find((item) => String(item.course_id) === String(courseId)) || null);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const flatLessons = useMemo(() => data ? (data.modules || []).flatMap((module) => module.lessons || []) : [], [data]);
  const activeModule = useMemo(() => (data?.modules || []).find((module) => (module.lessons || []).some((lesson) => lesson.id === activeId)), [data, activeId]);

  useEffect(() => {
    if (!data || activeId !== null) return;
    const firstOpen = flatLessons.find((lesson) => !lesson.is_locked && !lesson.is_completed) || flatLessons.find((lesson) => !lesson.is_locked);
    setActiveId(firstOpen?.id ?? flatLessons[0]?.id ?? null);
  }, [data, flatLessons, activeId]);

  const activeLesson = flatLessons.find((lesson) => lesson.id === activeId) || null;
  const activeIndex = Math.max(1, flatLessons.findIndex((lesson) => lesson.id === activeId) + 1);

  async function toggleComplete(lesson) {
    if (!lesson || lesson.is_locked) return;
    setMarking(true);
    setError("");
    try {
      if (lesson.is_completed) await learningApi.uncompleteLesson(lesson.id, token);
      else await learningApi.completeLesson(lesson.id, token);
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setMarking(false);
    }
  }

  async function issueCertificate() {
    setIssuing(true);
    setCertificateError("");
    try {
      setCertificate(await certificatesApi.issue(courseId, token));
    } catch (reason) {
      setCertificateError(reason.message);
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <section className="shell learn-page learn-loading">Dars yuklanmoqda...</section>;
  if (error && !data) return <section className="shell learn-page learn-empty" role="alert"><h1>Darsni ochib bo'lmadi</h1><p>{error}</p><button className="btn-primary" onClick={load}>Qayta urinish</button></section>;
  if (!data) return null;
  if (!data.is_enrolled) return <section className="shell learn-page learn-empty"><h1>Bu kursga hali yozilmagansiz</h1><p>To'liq darslarga kirish uchun avval kursga yoziling.</p><Link to={`/kurslar/${courseId}`}>Kurs sahifasiga o'tish</Link></section>;

  const progress = Math.min(100, Math.max(0, Number(data.progress_percent) || 0));
  const completedLessons = data.completed_lessons || 0;
  const totalLessons = data.total_lessons || flatLessons.length;

  return (
    <section className="shell learn-page py-12 sm:py-16">
      <header className="learn-hero">
        <div className="learn-breadcrumb">
          <Link to="/kurslarim"><Icon name="arrow-left" size={15} /> Kurslarimga qaytish</Link>
          <span className="learn-status"><Icon name="sparkles" size={14} /> O'rganish davom etmoqda</span>
        </div>
        <div className="learn-hero-copy">
          <div className="learn-kicker"><span className="learn-kicker-dot" /> Kursni o'zlashtirish</div>
          <h1>{data.title}</h1>
          <p>Har bir darsni bosqichma-bosqich tugating, fikrlaringizni yozib boring va yakunda natijangizni sertifikat bilan tasdiqlang.</p>
        </div>
        <div className="learn-hero-progress" aria-label="Kurs progressi">
          <header><span>Kurs progressi</span><strong>{progress}%</strong></header>
          <div className="learn-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${progress}%` }} /></div>
          <small>{completedLessons} / {totalLessons} dars tugatildi</small>
        </div>
      </header>

      {error && <p className="learn-alert" role="alert">{error}</p>}

      <div className="learn-layout">
        <main className="learn-main">
          <section className="learn-lesson" aria-labelledby="active-lesson-title">
            <div className="learn-lesson-heading">
              <div><div className="learn-overline"><Icon name="book" size={14} /> Hozirgi dars</div><h2 id="active-lesson-title">{activeLesson?.title || "Dars tanlang"}</h2></div>
              {activeLesson && <span className="learn-lesson-meta"><Icon name="sparkles" size={15} /> {activeModule?.title || "Kurs darsi"} · {activeIndex}-dars</span>}
            </div>
            {activeLesson && <>
              <div className="learn-video-frame"><VideoPlayer lessonId={activeLesson.id} token={token} src={activeLesson.video_url} storageKey={`lesson-${activeLesson.id}-position`} poster={activeLesson.thumbnail_url} onEnded={() => !activeLesson.is_completed && toggleComplete(activeLesson)} /></div>
              <article className="learn-lesson-copy">
                <h3>Dars haqida</h3>
                {activeLesson.description && <p>{activeLesson.description}</p>}
                {activeLesson.content && <div>{activeLesson.content}</div>}
                {(activeLesson.resources || []).length > 0 && <div className="learn-resources"><span className="learn-overline" style={{ gridColumn: "1 / -1" }}><Icon name="paperclip" size={14} /> Qo'shimcha materiallar</span>{activeLesson.resources.map((resource, index) => <a className="learn-resource" key={index} href={resource.url} target="_blank" rel="noreferrer"><span className="learn-resource-icon"><Icon name="external" size={16} /></span><span className="learn-resource-copy"><strong>{resource.title || `Material ${index + 1}`}</strong><small>Yangi oynada ochish</small></span></a>)}</div>}
                <button className={`learn-complete-button ${activeLesson.is_completed ? "is-complete" : ""}`} onClick={() => toggleComplete(activeLesson)} disabled={marking}><Icon name="check" size={17} />{marking ? "Saqlanmoqda..." : activeLesson.is_completed ? "Dars tugatilgan" : "Darsni tugatdim"}</button>
              </article>
            </>}
          </section>

          <div className="learn-section-stack">
            <AssignmentSection courseId={Number(courseId)} activeLessonId={activeLesson?.id} />
            {activeLesson && <section className="learn-qa-wrap"><header><span><Icon name="message" size={18} /></span><div><h2>Savol-javob</h2><p>Dars bo'yicha savolingizni qoldiring yoki boshqalarga yordam bering.</p></div></header><QASection lessonId={activeLesson.id} /></section>}
            {activeLesson && <NotesSection lessonId={activeLesson.id} />}
          </div>

          <CertificatePanel certificate={certificate} progress={progress} quizzes={quizzes} issuing={issuing} error={certificateError} onIssue={issueCertificate} />
        </main>

        <LessonSidebar modules={data.modules || []} activeId={activeId} assignments={assignments} quizzes={quizzes} progressPercent={progress} completedLessons={completedLessons} totalLessons={totalLessons} onSelect={setActiveId} />
      </div>
    </section>
  );
}
