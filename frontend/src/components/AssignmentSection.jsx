import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { assignmentsApi } from "../lib/assignmentsApi";
import "./AssignmentSection.css";

const draftKey = (id) => `designora-assignment-draft-${id}`;

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function dateLabel(value) {
  if (!value) return "Muddat yo'q";
  const diff = Math.ceil((new Date(value) - new Date()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} kun kechikdi`;
  if (diff === 0) return "Bugun tugaydi";
  if (diff === 1) return "Ertaga tugaydi";
  return `${new Date(value).toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })} gacha`;
}

function SubmissionForm({ assignment, onSubmitted }) {
  const { token } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const existing = assignment.my_submission;
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState(existing?.file_url || "");
  const [fileName, setFileName] = useState(existing?.file_url?.split("/").pop() || "");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey(assignment.id)) || "null");
      setContent(draft?.content ?? existing?.content ?? "");
      setFileUrl(draft?.fileUrl ?? existing?.file_url ?? "");
      setFileName(draft?.fileName ?? existing?.file_url?.split("/").pop() ?? "");
    } catch { setContent(existing?.content || ""); }
  }, [assignment.id, existing?.content, existing?.file_url]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey(assignment.id), JSON.stringify({ content, fileUrl, fileName }));
        if (content || fileUrl) setSavedAt(new Date());
      } catch { /* private mode */ }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [assignment.id, content, fileUrl, fileName]);

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadProgress(0);
    try {
      const result = await assignmentsApi.upload(file, token, setUploadProgress);
      setFileUrl(result.file_url); setFileName(result.original_name || file.name);
      toast.success("Fayl yuklandi");
    } catch (error) { toast.error(error.message); }
    finally { setUploading(false); event.target.value = ""; }
  }

  async function submit(event) {
    event.preventDefault();
    if (!content.trim() && !fileUrl.trim()) return;
    setSaving(true);
    try {
      await assignmentsApi.submit(assignment.id, { content: content.trim() || null, file_url: fileUrl.trim() || null }, token);
      localStorage.removeItem(draftKey(assignment.id));
      toast.success(existing ? "Javob yangilandi" : "Topshiriq yuborildi");
      onSubmitted();
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  return <form className="assignment-form" onSubmit={submit}>
    <label><span>Javob va izoh</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} maxLength={5000} placeholder="Jarayon, qarorlar va mentor ko‘rishi kerak bo‘lgan nuqtalarni yozing..."/><small>{content.length}/5000 {savedAt && `• qoralama ${savedAt.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} da saqlandi`}</small></label>
    <div className="assignment-attach-row"><input ref={fileRef} type="file" hidden onChange={chooseFile} accept=".pdf,.png,.jpg,.jpeg,.webp,.zip"/><button type="button" className="assignment-upload" onClick={() => fileRef.current?.click()} disabled={uploading}><Icon name="upload"/> {uploading ? `Yuklanmoqda ${uploadProgress}%` : "Fayl yuklash"}</button><span>yoki</span><label className="assignment-url"><Icon name="link" size={17}/><input type="url" value={fileUrl.startsWith("http") ? fileUrl : ""} onChange={(event) => { setFileUrl(event.target.value); setFileName(""); }} placeholder="Figma, Behance yoki Drive havolasi"/></label></div>
    {fileName && <div className="assignment-file"><Icon name="file"/><span><strong>{fileName}</strong><small>Yuklashga tayyor</small></span><button type="button" onClick={() => { setFileUrl(""); setFileName(""); }}>Olib tashlash</button></div>}
    <div className="assignment-submit-row"><p>Mentor tekshirguncha javobni yangilash mumkin.</p><button type="submit" disabled={saving || uploading || (!content.trim() && !fileUrl.trim())}>{saving ? "Yuborilmoqda..." : existing ? "Javobni yangilash" : "Mentorga yuborish"}<Icon name="arrow"/></button></div>
  </form>;
}

export default function AssignmentSection({ courseId, activeLessonId }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const rows = await assignmentsApi.forCourse(courseId, token);
      setItems(rows);
      setActive((current) => rows.find((item) => item.id === current?.id) || rows.find((item) => item.lesson_id === activeLessonId) || rows[0] || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [courseId, token, activeLessonId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const match = items.find((item) => item.lesson_id === activeLessonId); if (match) setActive(match); }, [activeLessonId, items]);

  const counts = useMemo(() => ({ open: items.filter((item) => !item.my_submission).length, review: items.filter((item) => item.my_submission?.status === "submitted").length, graded: items.filter((item) => item.my_submission?.status === "graded").length }), [items]);
  if (loading) return <section className="assignment-workspace"><div className="assignment-loading"><i/><i/></div></section>;
  if (error) return <section className="assignment-workspace"><div className="assignment-error"><strong>Topshiriqlar ochilmadi</strong><p>{error}</p><button onClick={load}>Qayta urinish</button></div></section>;
  if (!items.length) return null;
  const submission = active?.my_submission;
  const graded = submission?.status === "graded";

  return <section className="assignment-workspace" aria-labelledby="assignments-title">
    <header className="assignment-heading"><div><p>Amaliyot</p><h2 id="assignments-title">Topshiriqlar</h2><span>Bilimni real loyiha bilan mustahkamlang.</span></div><div className="assignment-counts"><span><b>{counts.open}</b> ochiq</span><span><b>{counts.review}</b> tekshiruvda</span><span><b>{counts.graded}</b> baholangan</span></div></header>
    <div className="assignment-layout"><nav className="assignment-nav" aria-label="Kurs topshiriqlari">{items.map((item,index) => { const status=item.my_submission?.status; return <button key={item.id} type="button" className={item.id===active?.id?"is-active":""} onClick={()=>setActive(item)}><span>{status==="graded"?<Icon name="check"/>:index+1}</span><i><strong>{item.title}</strong><small>{status==="graded"?"Baholandi":status==="submitted"?"Tekshiruvda":dateLabel(item.due_date)}</small></i></button>; })}</nav>
    {active && <article className="assignment-detail"><div className="assignment-meta"><span><Icon name="clock" size={16}/>{dateLabel(active.due_date)}</span><span>{active.max_score||100} ball</span></div><h3>{active.title}</h3>{active.description&&<p className="assignment-brief">{active.description}</p>}
    {graded ? <div className="mentor-feedback"><div className="feedback-score"><strong>{submission.grade}</strong><small>/ {active.max_score||100}</small></div><div><span><Icon name="message" size={17}/> Mentor feedback’i</span><p>{submission.feedback||"Topshiriq baholandi. Mentor izoh qoldirmagan."}</p><div className="feedback-actions">{submission.file_url&&<a href={submission.file_url} target="_blank" rel="noreferrer">Yuborilgan ish ↗</a>}<Link to={`/portfolio?submission=${submission.id}`}>Portfolio’ga qo‘shish <Icon name="arrow" size={16}/></Link></div></div></div> : submission?.status==="submitted" ? <><div className="submission-status"><span><Icon name="check"/></span><div><strong>Mentorga yuborildi</strong><p>Tekshiruv kutilmoqda. Hozircha javobni yangilashingiz mumkin.</p></div></div><SubmissionForm assignment={active} onSubmitted={load}/></> : <SubmissionForm assignment={active} onSubmitted={load}/>}</article>}</div>
  </section>;
}
