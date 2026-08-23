import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState, Spinner } from "../components/ui";
import QuizBuilder from "../components/QuizBuilder";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { instructorApi } from "../lib/api";
import { courseBuilderApi } from "../lib/courseBuilderApi";
import "./InstructorCourseEditPage.css";

const OUTCOMES_SEPARATOR = "\n";

export default function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [preview, setPreview] = useState(false);
  const [uploadingLesson, setUploadingLesson] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const hydrated = useRef(false);
  const detailsRef = useRef(null);
  const descriptionRef = useRef(null);
  const thumbnailRef = useRef(null);
  const outcomesRef = useRef(null);
  const curriculumRef = useRef(null);
  const quizRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError(""); hydrated.current = false;
    try { const builder = await courseBuilderApi.get(courseId, token); setData(builder); setForm(builder.course); setError(""); window.setTimeout(() => { hydrated.current = true; }, 0); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [courseId, token]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (loading || !form) return;
    const focus = searchParams.get("focus");
    const targets = { description: descriptionRef, thumbnail: thumbnailRef, outcomes: outcomesRef, curriculum: curriculumRef, details: detailsRef, quizzes: quizRef };
    const target = targets[focus]?.current; if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = target.matches?.("input, textarea") ? target : target.querySelector?.("input, textarea"); input?.focus({ preventScroll: true });
  }, [form, loading, searchParams]);
  useEffect(() => {
    if (!hydrated.current || !form) return;
    setSaveState("saving"); const timer = window.setTimeout(async () => { try { await courseBuilderApi.autosave(courseId, form, token); setSaveState("saved"); } catch (e) { setSaveState("error"); toast.error(e.message || "O'zgarishlarni saqlab bo'lmadi"); } }, 900);
    return () => window.clearTimeout(timer);
  }, [courseId, form, token, toast]);
  const allLessons = useMemo(() => data?.modules?.flatMap((module) => module.lessons || []) || [], [data]);
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function uploadVideo(lesson, file) { if (!file) return; if (file.size > 3 * 1024 * 1024 * 1024) { toast.error("Video hajmi 3 GB dan oshmasligi kerak"); return; } setUploadingLesson(lesson.id); setVideoProgress(0); try { await courseBuilderApi.uploadVideo(courseId, lesson.id, file, token, setVideoProgress); toast.success("Video yuklandi"); await load(); } catch (e) { toast.error(e.message); } finally { setUploadingLesson(null); setVideoProgress(0); } }
  async function createModule() { const title = window.prompt("Yangi modul nomi"); if (!title?.trim()) return; try { await instructorApi.createModule(courseId, { title: title.trim(), order: data.modules.length }, token); await load(); } catch (e) { toast.error(e.message); } }
  async function createLesson(moduleId) { const title = window.prompt("Yangi dars nomi"); if (!title?.trim()) return; try { await instructorApi.createLesson(courseId, { title: title.trim(), module_id: moduleId, type: "video" }, token); await load(); } catch (e) { toast.error(e.message); } }
  if (loading) return <div className="builder-state"><Spinner /></div>;
  if (error || !data || !form) return <div className="builder-state"><EmptyState title="Builder ochilmadi" description={error} /><button onClick={load}>Qayta urinish</button><Link to="/instruktor-boshqaruv">Kurslarga qaytish</Link></div>;
  if (preview) return <main className="builder-preview"><div className="builder-preview__bar"><strong>Talaba preview</strong><button onClick={() => setPreview(false)}>Builderga qaytish</button></div><section><span>{form.category || "Kurs"}</span><h1>{form.title}</h1><p>{form.description || "Tavsif hali yozilmagan."}</p>{form.thumbnail_url && <img src={form.thumbnail_url} alt={`${form.title} kursi muqovasi`} style={{ width: "min(100%, 720px)", borderRadius: 16 }} />}{form.learning_outcomes?.length > 0 && <><h2>O'quv natijalari</h2><ul>{form.learning_outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></>}
  </section>{data.modules.map((module) => <article key={module.id}><h2>{module.title}</h2>{module.lessons.map((lesson) => <div className="builder-preview__lesson" key={lesson.id}>{lesson.video_url ? <video src={lesson.video_url} controls /> : <p>{lesson.title}: video yuklanmagan</p>}</div>)}</article>)}</main>;
  const outcomesText = (form.learning_outcomes || []).join(OUTCOMES_SEPARATOR);
  return <main className="course-builder"><header className="builder-header"><div><Link to="/instruktor-boshqaruv">← Kurslar</Link><h1>{form.title}</h1><p className={`save-state save-state--${saveState}`} role="status">{saveState === "saving" ? "Saqlanmoqda..." : saveState === "error" ? "Saqlashda xato. Maydonni tekshirib qayta urinib ko'ring." : "Barcha o'zgarishlar saqlandi"}</p></div><div className="builder-actions"><button onClick={() => setPreview(true)}>Talaba preview</button></div></header><div className="builder-layout"><section className="builder-main"><article className="builder-card builder-settings" ref={detailsRef}><div className="builder-card__head"><div><span>Course details</span><h2>Kurs ma'lumotlari</h2></div><strong>Avtomatik saqlanadi</strong></div><label>Kurs nomi<input value={form.title || ""} minLength={3} maxLength={200} onChange={(event) => setField("title", event.target.value)} /></label><label>Qism sarlavha<input value={form.subtitle || ""} maxLength={300} onChange={(event) => setField("subtitle", event.target.value)} /></label><label>Kurs tavsifi<textarea ref={descriptionRef} value={form.description || ""} minLength={20} onChange={(event) => setField("description", event.target.value)} placeholder="Kurs kim uchun, nimalarni o'rgatadi va natijasi qanday bo'lishini yozing." /><small>{(form.description || "").trim().length}/20 belgi minimum</small></label><label>Muqova rasmi URL<input ref={thumbnailRef} type="url" value={form.thumbnail_url || ""} onChange={(event) => setField("thumbnail_url", event.target.value)} placeholder="https://example.com/course-cover.jpg" /></label>{form.thumbnail_url && <img key={form.thumbnail_url} src={form.thumbnail_url} alt="Kurs muqovasi preview" onError={(event) => { event.currentTarget.style.display = "none"; }} style={{ width: "100%", maxHeight: 260, marginTop: 12, borderRadius: 12, objectFit: "cover" }} />}<label ref={outcomesRef}>O'quv natijalari<textarea value={outcomesText} minLength={1} onChange={(event) => setField("learning_outcomes", event.target.value.split(OUTCOMES_SEPARATOR).map((item) => item.trim()).filter(Boolean))} placeholder={"Har qatorda bitta natija\nMasalan: Portfolio yaratish"} /><small>Har qatorda bitta o'quv natijasi yozing.</small></label></article><article className="builder-card" ref={curriculumRef}><div className="builder-card__head"><div><span>Curriculum</span><h2>Modullar va darslar</h2></div><div className="builder-actions"><strong>{allLessons.length} dars</strong><button onClick={createModule}>+ Modul</button></div></div>{data.modules.map((module) => <div className="builder-module" key={module.id}><div className="builder-module__head"><strong>{module.title}</strong><small>{module.lessons.length} dars</small><button onClick={() => createLesson(module.id)}>+ Dars</button></div><div className="builder-lessons">{module.lessons.map((lesson) => <div className="builder-lesson" key={lesson.id}><div><strong>{lesson.title}</strong><small>{lesson.processing_status || "ready"}</small></div><label className="video-upload"><input type="file" accept="video/mp4,video/webm,video/quicktime,.m4v" disabled={uploadingLesson === lesson.id} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; uploadVideo(lesson, file); }} /><span>{uploadingLesson === lesson.id ? `Yuklanmoqda ${videoProgress}%` : lesson.video_url ? "Videoni almashtirish" : "Video yuklash"}</span></label>{uploadingLesson === lesson.id && <progress className="video-progress" max="100" value={videoProgress} />}{lesson.video_url && <a className="video-preview-link" href={lesson.video_url} target="_blank" rel="noreferrer">Ko'rish</a>}</div>)}</div></div>)}{!data.modules.length && <p className="builder-empty">Modul yo'q. Birinchi modulni shu yerdan yarating.</p>}</article><div ref={quizRef}><QuizBuilder courseId={courseId} /></div></section><aside className="builder-sidebar"><article className="builder-card"><div className="builder-card__head"><div><span>Publish</span><h2>Checklist</h2></div><strong>{data.checklist.filter((item) => item.complete).length}/{data.checklist.length}</strong></div><div className="builder-checklist">{data.checklist.map((item) => <p className={item.complete ? "complete" : ""} key={item.key}><span>{item.complete ? "✓" : "○"}</span>{item.label}</p>)}</div></article></aside></div></main>;
}
