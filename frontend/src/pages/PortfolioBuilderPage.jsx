import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { portfolioApi } from "../lib/portfolioApi";
import "./Portfolio.css";

const blank = { submission_id: null, title: "", summary: "", story: "", cover_url: "", project_url: "", skills: [], tools: [], is_public: false };
const splitTags = (value) => value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);

export default function PortfolioBuilderPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [mine, source] = await Promise.all([portfolioApi.mine(token), portfolioApi.eligible(token)]);
      setProjects(mine); setEligible(source);
      const requested = Number(params.get("submission"));
      const candidate = source.find((item) => item.submission_id === requested && item.available);
      if (candidate && !selected) chooseSource(candidate);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [token]);

  function chooseSource(source) {
    setSelected(null);
    setForm({ ...blank, submission_id: source.submission_id, title: source.title, summary: source.content || source.description || "", cover_url: source.file_url?.match(/\.(png|jpe?g|webp)$/i) ? source.file_url : "", project_url: source.file_url || "" });
  }
  function edit(project) { setSelected(project.id); setForm({ ...blank, ...project }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function reset() { setSelected(null); setForm(blank); }
  function field(key, value) { setForm((old) => ({ ...old, [key]: value })); }

  async function save(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = { ...form, title: form.title.trim(), skills: form.skills, tools: form.tools };
      if (selected) await portfolioApi.update(selected, body, token);
      else await portfolioApi.create(body, token);
      toast.success(selected ? "Loyiha yangilandi" : "Portfolio loyihasi yaratildi");
      reset(); await load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!window.confirm("Loyihani portfolio'dan o'chirasizmi?")) return;
    try { await portfolioApi.remove(id, token); toast.success("Loyiha o'chirildi"); await load(); }
    catch (err) { toast.error(err.message); }
  }

  const publicCount = useMemo(() => projects.filter((project) => project.is_public).length, [projects]);
  const userId = user?.id;

  if (loading) return <section className="portfolio-builder"><div className="portfolio-skeleton" /></section>;
  if (error) return <section className="portfolio-builder"><div className="portfolio-error"><h1>Portfolio ochilmadi</h1><p>{error}</p><button onClick={load}>Qayta urinish</button></div></section>;

  return <section className="portfolio-builder">
    <header className="portfolio-builder-head"><div><p>Portfolio studio</p><h1>Ishlaringiz gapirsin.</h1><span>Baholangan loyihalarni professional case study’ga aylantiring.</span></div>{userId && <Link to={`/portfolio/${userId}`} target="_blank">Public ko‘rinish <b>↗</b></Link>}</header>

    <div className="portfolio-builder-grid">
      <form className="portfolio-editor" onSubmit={save}>
        <div className="editor-top"><div><small>{selected ? "Loyihani tahrirlash" : "Yangi loyiha"}</small><h2>{selected ? form.title : "Portfolio’ga qo‘shish"}</h2></div>{(selected || form.title) && <button type="button" onClick={reset}>Tozalash</button>}</div>
        {!selected && eligible.some((item) => item.available) && <div className="portfolio-sources"><span>Baholangan ishlardan tanlang</span><div>{eligible.filter((item) => item.available).map((item) => <button type="button" key={item.submission_id} onClick={() => chooseSource(item)} className={form.submission_id === item.submission_id ? "is-active" : ""}><b>{item.grade}/{item.max_score}</b><i>{item.title}</i></button>)}</div></div>}
        <label><span>Loyiha nomi</span><input value={form.title} onChange={(event) => field("title", event.target.value)} maxLength={180} required placeholder="Masalan: Navoiy teatrining yangi vizual identifikatsiyasi" /></label>
        <label><span>Qisqa mazmun</span><textarea value={form.summary || ""} onChange={(event) => field("summary", event.target.value)} maxLength={500} rows={3} placeholder="Muammo, yondashuv va natijani 2-3 gapda ayting." /><small>{(form.summary || "").length}/500</small></label>
        <label><span>Case study hikoyasi</span><textarea value={form.story || ""} onChange={(event) => field("story", event.target.value)} maxLength={5000} rows={8} placeholder="Kontekst → jarayon → qarorlar → natija" /><small>{(form.story || "").length}/5000</small></label>
        <div className="portfolio-fields"><label><span>Cover rasm URL</span><input type="url" value={form.cover_url || ""} onChange={(event) => field("cover_url", event.target.value)} placeholder="https://..." /></label><label><span>Loyiha havolasi</span><input type="url" value={form.project_url || ""} onChange={(event) => field("project_url", event.target.value)} placeholder="Figma, Behance yoki Drive" /></label></div>
        <div className="portfolio-fields"><label><span>Ko‘nikmalar</span><input value={(form.skills || []).join(", ")} onChange={(event) => field("skills", splitTags(event.target.value))} placeholder="Branding, Art direction" /></label><label><span>Vositalar</span><input value={(form.tools || []).join(", ")} onChange={(event) => field("tools", splitTags(event.target.value))} placeholder="Figma, Illustrator" /></label></div>
        <label className="publish-switch"><span><b>Public qilish</b><small>Hamma ko‘ra oladigan portfolio sahifasida chiqadi</small></span><input type="checkbox" checked={form.is_public} onChange={(event) => field("is_public", event.target.checked)} /><i /></label>
        <div className="portfolio-editor-actions"><p>Avval draft saqlab, tayyor bo‘lganda public qiling.</p><button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : selected ? "O‘zgarishlarni saqlash" : "Loyiha yaratish"}<b>→</b></button></div>
      </form>

      <aside className="portfolio-preview"><div className="preview-label"><span>Live preview</span><small>{form.is_public ? "Public" : "Draft"}</small></div><article><div className="preview-cover">{form.cover_url ? <img src={form.cover_url} alt="" /> : <span>Cover qo‘shing</span>}</div><p>{(form.skills || [])[0] || "Design project"}</p><h2>{form.title || "Loyiha nomi"}</h2><div className="preview-tags">{[...(form.skills || []), ...(form.tools || [])].slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</div><p className="preview-summary">{form.summary || "Loyiha haqida qisqa, aniq mazmun shu yerda ko‘rinadi."}</p></article></aside>
    </div>

    <section className="portfolio-library"><header><div><p>Sizning ishlaringiz</p><h2>Portfolio kutubxonasi</h2></div><span>{projects.length} loyiha, {publicCount} public</span></header>{projects.length ? <div className="portfolio-project-list">{projects.map((project, index) => <article key={project.id}><span className="project-index">{String(index + 1).padStart(2, "0")}</span><div className="project-mini-cover">{project.cover_url ? <img src={project.cover_url} alt="" /> : <b>D</b>}</div><div><small>{project.is_public ? "Public" : "Draft"}</small><h3>{project.title}</h3><p>{project.summary || "Tavsif qo‘shilmagan"}</p></div><div className="project-actions"><button onClick={() => edit(project)}>Tahrirlash</button><button onClick={() => remove(project.id)}>O‘chirish</button></div></article>)}</div> : <div className="portfolio-empty"><h3>Eng yaxshi ishingizdan boshlang.</h3><p>Baholangan topshiriqni tanlang yoki bo‘sh loyiha yarating.</p></div>}</section>
  </section>;
}
