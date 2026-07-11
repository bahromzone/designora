import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { instructorApi } from "../lib/api";
import { courseBuilderApi } from "../lib/courseBuilderApi";
import "./InstructorCourseEditPage.css";

const EMPTY_BULK = "";

export default function InstructorCourseEditPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("saved");
  const [preview, setPreview] = useState(false);
  const [bulk, setBulk] = useState(EMPTY_BULK);
  const [drag, setDrag] = useState(null);
  const hydrated = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [builder, history] = await Promise.all([
        courseBuilderApi.get(courseId, token),
        courseBuilderApi.versions(courseId, token),
      ]);
      setData(builder);
      setForm(builder.course);
      setVersions(history);
      hydrated.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!hydrated.current || !form) return undefined;
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      try {
        const result = await courseBuilderApi.autosave(courseId, form, token);
        setSaveState(result.saved_at ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [courseId, form, token]);

  const allLessons = useMemo(() => [
    ...(data?.unassigned_lessons ?? []),
    ...(data?.modules ?? []).flatMap((module) => module.lessons ?? []),
  ], [data]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function moveModule(sourceId, targetId) {
    const modules = [...data.modules];
    const from = modules.findIndex((item) => item.id === sourceId);
    const to = modules.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [item] = modules.splice(from, 1);
    modules.splice(to, 0, item);
    setData((current) => ({ ...current, modules }));
    await courseBuilderApi.reorder(courseId, { modules: modules.map((row, order) => ({ id: row.id, order })), lessons: [] }, token);
  }

  async function uploadBulk() {
    const lessons = bulk.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, type: "video" }));
    if (!lessons.length) return;
    try {
      await courseBuilderApi.bulkLessons(courseId, lessons, token);
      setBulk(EMPTY_BULK);
      toast.success(`${lessons.length} ta dars qo'shildi`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function togglePublish() {
    if (form.status !== "published" && !data.can_publish) {
      toast.error("Publish checklist hali to'liq emas");
      return;
    }
    try {
      if (form.status === "published") await instructorApi.unpublishCourse(courseId, token);
      else await instructorApi.publishCourse(courseId, token);
      toast.success(form.status === "published" ? "Qoralamaga o'tkazildi" : "Kurs chop etildi");
      load();
    } catch (err) { toast.error(err.message); }
  }

  async function snapshot() {
    await courseBuilderApi.createVersion(courseId, "Manual snapshot", token);
    toast.success("Versiya saqlandi");
    load();
  }

  async function restore(versionId) {
    await courseBuilderApi.restore(courseId, versionId, token);
    toast.success("Versiya tiklandi");
    load();
  }

  if (loading) return <div className="builder-state"><Spinner /></div>;
  if (error || !data || !form) return <div className="builder-state"><EmptyState title="Builder ochilmadi" description={error} /><Link to="/instruktor-boshqaruv">Kurslarga qaytish</Link></div>;

  if (preview) {
    return (
      <main className="builder-preview">
        <div className="builder-preview__bar"><strong>Talaba preview</strong><button onClick={() => setPreview(false)}>Builderga qaytish</button></div>
        <section><span>{form.category || "Kurs"}</span><h1>{form.title}</h1><p>{form.description || "Tavsif hali yozilmagan."}</p></section>
        {(data.modules ?? []).map((module) => <article key={module.id}><h2>{module.title}</h2>{module.lessons.map((lesson) => <p key={lesson.id}>▶ {lesson.title} <small>{lesson.processing_status}</small></p>)}</article>)}
      </main>
    );
  }

  return (
    <main className="course-builder">
      <header className="builder-header">
        <div><Link to="/instruktor-boshqaruv">← Kurslar</Link><h1>{form.title}</h1><p className={`save-state save-state--${saveState}`}>{saveState === "saving" ? "Saqlanmoqda..." : saveState === "error" ? "Saqlash xatosi" : "Barcha o'zgarishlar saqlandi"}</p></div>
        <div className="builder-actions"><button onClick={() => setPreview(true)}>Talaba sifatida ko'rish</button><button onClick={snapshot}>Versiya saqlash</button><button className="builder-primary" onClick={togglePublish}>{form.status === "published" ? "Qoralamaga" : "Chop etish"}</button></div>
      </header>

      <div className="builder-layout">
        <section className="builder-main">
          <article className="builder-card">
            <div className="builder-card__head"><div><span>Curriculum</span><h2>Modullar va darslar</h2></div><strong>{allLessons.length} dars</strong></div>
            {(data.modules ?? []).map((module) => (
              <div className="builder-module" draggable key={module.id} onDragStart={() => setDrag(module.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { moveModule(drag, module.id); setDrag(null); }}>
                <div className="builder-module__head"><span className="drag-handle">⠿</span><strong>{module.title}</strong><small>{module.lessons.length} dars</small></div>
                <div className="builder-lessons">{module.lessons.map((lesson) => <div className="builder-lesson" key={lesson.id}><span>⋮⋮</span><div><strong>{lesson.title}</strong><small>{lesson.type} · {lesson.processing_status}</small></div><em className={`media-state media-state--${lesson.processing_status}`}>{lesson.processing_status}</em></div>)}</div>
              </div>
            ))}
            {!data.modules.length && <p className="builder-empty">Modul yo'q. Avval kurs boshqaruvidan modul yarating.</p>}
          </article>

          <article className="builder-card">
            <div className="builder-card__head"><div><span>Bulk upload</span><h2>Bir urinishda darslar</h2></div></div>
            <textarea value={bulk} onChange={(event) => setBulk(event.target.value)} placeholder={"Har qatorda bitta dars nomi\nFigma asoslari\nAuto layout"} />
            <button className="builder-primary" onClick={uploadBulk}>Darslarni yaratish</button>
          </article>
        </section>

        <aside className="builder-sidebar">
          <article className="builder-card builder-settings">
            <span>Course details</span><h2>Sozlamalar</h2>
            <label>Nomi<input value={form.title || ""} onChange={(event) => setField("title", event.target.value)} /></label>
            <label>Subtitle<input value={form.subtitle || ""} onChange={(event) => setField("subtitle", event.target.value)} /></label>
            <label>Tavsif<textarea value={form.description || ""} onChange={(event) => setField("description", event.target.value)} /></label>
            <label>Muqova URL<input value={form.thumbnail_url || ""} onChange={(event) => setField("thumbnail_url", event.target.value)} /></label>
            <label>Prerequisite course IDlar<input value={(form.prerequisite_course_ids || []).join(", ")} onChange={(event) => setField("prerequisite_course_ids", event.target.value.split(",").map(Number).filter(Boolean))} /></label>
          </article>

          <article className="builder-card">
            <div className="builder-card__head"><div><span>Publish</span><h2>Checklist</h2></div><strong>{data.checklist.filter((item) => item.complete).length}/{data.checklist.length}</strong></div>
            <div className="builder-checklist">{data.checklist.map((item) => <p className={item.complete ? "complete" : ""} key={item.key}><span>{item.complete ? "✓" : "○"}</span>{item.label}</p>)}</div>
          </article>

          <article className="builder-card">
            <div className="builder-card__head"><div><span>History</span><h2>Versiyalar</h2></div></div>
            <div className="builder-versions">{versions.slice(0, 8).map((version) => <button key={version.id} onClick={() => restore(version.id)}><strong>{version.label}</strong><small>{new Date(version.created_at).toLocaleString("uz-UZ")}</small></button>)}{!versions.length && <p>Versiya hali yo'q.</p>}</div>
          </article>
        </aside>
      </div>
    </main>
  );
}
