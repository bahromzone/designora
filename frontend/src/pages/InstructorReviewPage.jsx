import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { assignmentsApi } from "../lib/assignmentsApi";
import "./InstructorReviewPage.css";

export function normalizeTimestamp(value) {
  const parts = String(value || "0").split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function createImageAnnotation(event, note) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10,
    y: Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10,
    note: note.trim(),
    color: "#ef4444",
  };
}

export default function InstructorReviewPage() {
  const { assignmentId } = useParams();
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState("accepted");
  const [annotationNote, setAnnotationNote] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [timestamp, setTimestamp] = useState("00:00");
  const [videoNote, setVideoNote] = useState("");
  const [videoFeedback, setVideoFeedback] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    assignmentsApi.submissions(assignmentId, token).then((rows) => {
      setSubmissions(rows);
      setSelectedId(rows[0]?.id ?? null);
    });
  }, [assignmentId, token]);

  const selected = useMemo(
    () => submissions.find((item) => item.id === selectedId),
    [selectedId, submissions],
  );

  useEffect(() => {
    const review = selected?.review;
    setGrade(selected?.grade || 0);
    setFeedback(review?.feedback || selected?.feedback || "");
    setDecision(review?.decision || "accepted");
    setAnnotations(review?.annotations || []);
    setVideoFeedback(review?.video_feedback || []);
  }, [selected]);

  const addVideoFeedback = () => {
    if (!videoNote.trim()) return;
    setVideoFeedback((items) => [
      ...items,
      { seconds: normalizeTimestamp(timestamp), note: videoNote.trim() },
    ]);
    setVideoNote("");
  };

  const save = async () => {
    const result = await assignmentsApi.grade(
      selected.id,
      { grade: Number(grade), feedback, decision, annotations, video_feedback: videoFeedback },
      token,
    );
    setMessage(result.message);
  };

  return (
    <section className="review-shell">
      <header><div><p className="label">Instructor review</p><h1>Topshiriqni baholash</h1></div><Link to="/instruktor-panel">Panelga qaytish</Link></header>
      <div className="review-layout">
        <aside aria-label="Submission queue">
          {submissions.map((item) => (
            <button key={item.id} className={item.id === selectedId ? "active" : ""} onClick={() => setSelectedId(item.id)}>
              <b>Talaba #{item.user_id}</b><span>{item.status}</span>
            </button>
          ))}
        </aside>
        <main>
          {!selected ? <p>Tekshiriladigan ish yo‘q.</p> : <>
            <article className="submission-copy"><p>{selected.content || "Izoh yozilmagan"}</p><a href={selected.file_url} target="_blank" rel="noreferrer">Faylni ochish</a></article>
            {selected.file_url && <div className="annotation-stage" onClick={(event) => annotationNote.trim() && setAnnotations((items) => [...items, createImageAnnotation(event, annotationNote)])}>
              <img src={selected.file_url} alt="Talaba yuborgan loyiha" />
              {annotations.map((item, index) => <button key={`${item.x}-${item.y}-${index}`} style={{left:`${item.x}%`,top:`${item.y}%`}} title={item.note}>{index + 1}</button>)}
            </div>}
            <label>Rasm annotation izohi<input value={annotationNote} onChange={(event) => setAnnotationNote(event.target.value)} placeholder="Rasm ustiga bosishdan oldin izoh yozing" /></label>
            <ol className="review-notes">{annotations.map((item, index) => <li key={index}><b>{index + 1}.</b> {item.note}<button onClick={() => setAnnotations((rows) => rows.filter((_, i) => i !== index))}>O‘chirish</button></li>)}</ol>
            <div className="video-feedback"><label>Vaqt kodi<input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} placeholder="01:23" /></label><label>Video feedback<input value={videoNote} onChange={(event) => setVideoNote(event.target.value)} /></label><button onClick={addVideoFeedback}>Qo‘shish</button></div>
            <ol className="review-notes">{videoFeedback.map((item, index) => <li key={index}><b>{Math.floor(item.seconds / 60)}:{String(item.seconds % 60).padStart(2,"0")}</b> {item.note}</li>)}</ol>
            <div className="review-form"><label>Baho<input type="number" min="0" value={grade} onChange={(event) => setGrade(event.target.value)} /></label><label>Qaror<select value={decision} onChange={(event) => setDecision(event.target.value)}><option value="accepted">Qabul qilindi</option><option value="rework">Qayta ishlash kerak</option></select></label><label className="wide">Umumiy feedback<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} /></label></div>
            <button className="save-review" onClick={save}>Feedbackni yuborish</button>{message && <p role="status">{message}</p>}
          </>}
        </main>
      </div>
    </section>
  );
}
