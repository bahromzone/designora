import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { globalSearch } from "../lib/globalSearchApi";
import "./GlobalSearchPage.css";

const TYPES = [
  ["all", "Barchasi"], ["course", "Kurslar"], ["lesson", "Darslar"],
  ["instructor", "Instruktorlar"], ["blog", "Blog"], ["forum", "Forum"],
];
const LABELS = { course: "Kurs", lesson: "Dars", instructor: "Instruktor", blog: "Blog", forum: "Forum" };
const RECENT_KEY = "designora-recent-searches";

function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}
function saveRecent(value) {
  if (!value.trim()) return;
  try {
    const next = [value.trim(), ...readRecent().filter((item) => item !== value.trim())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* private mode */ }
}
function Icon({ type }) {
  const paths = {
    course: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    lesson: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></>,
    instructor: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    blog: <><path d="M5 3h14v18H5z"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
    forum: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

export default function GlobalSearchPage() {
  const [params, setParams] = useSearchParams();
  const inputRef = useRef(null);
  const [query, setQuery] = useState(params.get("q") || "");
  const [type, setType] = useState(params.get("type") || "all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(readRecent);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setData(null); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const result = await globalSearch(trimmed, type === "all" ? [] : [type]);
        if (!controller.signal.aborted) { setData(result); setParams({ q: trimmed, ...(type !== "all" ? { type } : {}) }, { replace: true }); }
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 280);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query, type, setParams]);

  const visibleGroups = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.groups).filter(([key, items]) => (type === "all" || type === key) && items.length);
  }, [data, type]);

  function choose(value) { setQuery(value); saveRecent(value); setRecent(readRecent()); }
  function resultClick() { saveRecent(query); setRecent(readRecent()); }

  return <section className="global-search-page">
    <header><p>Global Search</p><h1>Keraklisini toping.</h1><span>Kurs, dars, instruktor, maqola va muhokamalar bir qidiruvda.</span></header>
    <div className="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Masalan: brending, Figma yoki tipografika" aria-label="Global qidiruv"/><kbd>ESC</kbd></div>
    <nav className="search-types" aria-label="Natija turlari">{TYPES.map(([value,label]) => <button key={value} onClick={() => setType(value)} className={type === value ? "is-active" : ""}>{label}{data && value !== "all" && <span>{data.counts[value] || 0}</span>}</button>)}</nav>

    {query.trim().length < 2 ? <div className="search-start"><div><h2>So‘nggi qidiruvlar</h2>{recent.length ? <div className="recent-list">{recent.map((item) => <button key={item} onClick={() => choose(item)}>↗ {item}</button>)}</div> : <p>Qidiruv tarixi hali bo‘sh.</p>}</div><div><h2>Tez boshlash</h2><div className="recent-list">{["Grafik dizayn", "UI/UX", "Moda", "Brending"].map((item) => <button key={item} onClick={() => choose(item)}>{item}</button>)}</div></div></div> : null}
    {loading && <div className="search-skeleton"><i/><i/><i/></div>}
    {error && <div className="search-error" role="alert">{error}</div>}
    {!loading && data && data.total === 0 && <div className="search-empty"><span>0 natija</span><h2>“{data.query}” topilmadi.</h2><p>Qisqaroq so‘z yoki boshqa imloni sinab ko‘ring.</p>{data.suggestions.length > 0 && <div>{data.suggestions.map((item) => <button key={item} onClick={() => choose(item)}>{item}</button>)}</div>}</div>}
    {!loading && visibleGroups.length > 0 && <div className="search-results">{visibleGroups.map(([group, items]) => <section key={group}><div className="result-heading"><h2>{LABELS[group]}</h2><span>{items.length} natija</span></div><div>{items.map((item) => <Link key={`${group}-${item.id}`} to={item.url} onClick={resultClick} className="search-result"><span className="result-icon"><Icon type={group}/></span><span className="result-copy"><small>{item.subtitle || LABELS[group]}</small><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</span><span className="result-meta">{group === "course" && item.rating_avg ? `★ ${Number(item.rating_avg).toFixed(1)}` : group === "forum" ? `${item.views || 0} ko‘rish` : "Ochish"}</span><b>→</b></Link>)}</div></section>)}</div>}
  </section>;
}
