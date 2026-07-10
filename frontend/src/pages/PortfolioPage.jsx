import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { portfolioApi } from "../lib/portfolioApi";
import "./Portfolio.css";

function splitTags(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

export default function PortfolioPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await portfolioApi.mine(token);
      setData(result);
      setActiveId((current) => current || result.projects[0]?.id || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const submissionId = searchParams.get("submission");
    if (!submissionId || !token) return;
    portfolioApi.fromSubmission(submissionId, token)
      .then((project) => {
        setSearchParams({}, { replace: true });
        setActiveId(project.id);
        toast.success("Baholangan ish portfolio'ga qo'shildi");
        load();
      })
      .catch((err) => { setSearchParams({}, { replace: true }); toast.error(err.message); });
  }, [searchParams, setSearchParams, token, toast, load]);

  const active = useMemo(() => data?.projects.find((project) => project.id === activeId) || null, [data, activeId]);

  useEffect(() => {
    if (!active) { setDraft(null); return; }
    setDraft({
      title: active.title || "",
      summary: active.summary || "",
      story: active.story || "",
      cover_url: active.cover_url || "",
      project_url: active.project_url || "",
      skills: (active.skills || []).join(", "),
      tools: (active.tools || []).join(", "),
      is_public: Boolean(active.is_public),
    });
  }, [active]);

  async function save() {
    if (!active || !draft?.title.trim()) return;
    setSaving(true);
    try {
      await portfolioApi.update(active.id, {
        ...draft,
        title: draft.title.trim(),
        skills: splitTags(draft.skills),
        tools: splitTags(draft.tools),
      }, token);
      toast.success("Portfolio saqlandi");
      await load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!active || !window.confirm("Bu loyihani portfolio'dan o'chirasizmi?")) return;
    try {
      await portfolioApi.remove(active.id, token);
      setActiveId(null);
      toast.success("Loyiha o'chirildi");
      await load();
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return <section className="portfolio-page"><div className="portfolio-skeleton" /></section>;
  if (error) return <section className="portfolio-page"><div className="portfolio-error"><h1>Portfolio ochilmadi</h1><p>{error}</p><button onClick={load}>Qayta urinish</button></div></section>;

  const projects = data?.projects || [];
  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <div><p>Portfolio Builder</p><h1>Ishlaringiz gapirsin.</h1><span>Baholangan loyihalarni tanlang, hikoyasini yozing va ulashing.</span></div>
        {data?.user_id && <Link to={`/portfolio/u/${data.user_id}`} target="_blank">Public ko‘rinish ↗</Link>}
      </header>

      {!projects.length ? <div className="portfolio-empty"><span>01</span><h2>Hali portfolio loyihasi yo‘q.</h2><p>Baholangan topshiriq yonidagi “Portfolio’ga qo‘shish” tugmasini bosing.</p><Link to="/kurslarim">Kurslarga qaytish</Link></div> :
      <div className="portfolio-builder">
        <aside className="portfolio-list">
          <div><strong>{projects.length} loyiha</strong><small>{projects.filter((item) => item.is_public).length} tasi public</small></div>
          {projects.map((project, index) => <button key={project.id} className={project.id === activeId ? "is-active" : ""} onClick={() => setActiveId(project.id)}><span>{String(index + 1).padStart(2, "0")}</span><i><strong>{project.title}</strong><small>{project.is_public ? "Public" : "Qoralama"}</small></i></button>)}
        </aside>

        {draft && <main className="portfolio-editor">
          <div className="portfolio-cover" style={draft.cover_url ? { backgroundImage: `url(${draft.cover_url})` } : {}}><span>{draft.cover_url ? "Cover preview" : "Cover URL kiriting"}</span></div>
          <div className="portfolio-fields">
            <label className="portfolio-title"><span>Loyiha nomi</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={180} /></label>
            <label><span>Qisqa tavsif</span><textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={3} maxLength={500} placeholder="Muammo, yechim va natijani qisqa yozing" /></label>
            <label><span>Case study hikoyasi</span><textarea value={draft.story} onChange={(e) => setDraft({ ...draft, story: e.target.value })} rows={8} maxLength={8000} placeholder="Jarayon, qarorlar, sinovlar va o‘rganganlaringiz..." /></label>
            <div className="portfolio-two"><label><span>Cover URL</span><input type="url" value={draft.cover_url} onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })} placeholder="https://..." /></label><label><span>Loyiha URL</span><input type="url" value={draft.project_url} onChange={(e) => setDraft({ ...draft, project_url: e.target.value })} placeholder="Figma, Behance, Drive..." /></label></div>
            <div className="portfolio-two"><label><span>Ko‘nikmalar</span><input value={draft.skills} onChange={(e) => setDraft({ ...draft, skills: e.target.value })} placeholder="UI design, Research, Prototyping" /></label><label><span>Vositalar</span><input value={draft.tools} onChange={(e) => setDraft({ ...draft, tools: e.target.value })} placeholder="Figma, Photoshop" /></label></div>
            <label className="portfolio-publish"><span><strong>Public portfolio’da ko‘rsatish</strong><small>Havolaga ega odamlar loyihani ko‘ra oladi</small></span><input type="checkbox" checked={draft.is_public} onChange={(e) => setDraft({ ...draft, is_public: e.target.checked })} /><i /></label>
          </div>
          <footer><button className="portfolio-delete" onClick={remove}>O‘chirish</button><button className="portfolio-save" onClick={save} disabled={saving || !draft.title.trim()}>{saving ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}</button></footer>
        </main>}
      </div>}
    </section>
  );
}
