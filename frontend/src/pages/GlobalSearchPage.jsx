import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { globalSearch } from "../lib/globalSearchApi";
import "./GlobalSearchPage.css";

const TYPES = [
  ["all", "Barchasi"], ["course", "Kurslar"], ["lesson", "Darslar"],
  ["instructor", "Instruktorlar"], ["blog", "Maqolalar"], ["forum", "Forum"],
];
const LABELS = { course: "Kurs", lesson: "Dars", instructor: "Instruktor", blog: "Maqola", forum: "Forum" };
const RECENT_KEY = "designora-recent-searches";

function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

export default function GlobalSearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [activeType, setActiveType] = useState("all");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(readRecent);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResult(null); setLoading(false); return; }
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const payload = await globalSearch(trimmed, activeType === "all" ? null : [activeType]);
        setResult(payload);
        setParams({ q: trimmed }, { replace: true });
        setRecent((current) => {
          const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, 6);
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
          return next;
        });
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, activeType, setParams]);

  const items = useMemo(() => result ? Object.values(result.groups || {}).flat().sort((a, b) => b.relevance - a.relevance) : [], [result]);

  return <section className="global-search-page">
    <header className="search-hero"><p>GLOBAL SEARCH</p><h1>Nimani topmoqchisiz?</h1><form onSubmit={(event) => event.preventDefault()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kurs, dars, instruktor yoki mavzu..." aria-label="Global qidiruv"/><kbd>ESC</kbd></form></header>
    <nav className="search-types" aria-label="Natija turi">{TYPES.map(([value,label]) => <button key={value} type="button" className={activeType===value?"is-active":""} onClick={()=>setActiveType(value)}>{label}{result && value!=="all" && <span>{result.groups?.[value]?.length || 0}</span>}</button>)}</nav>

    {query.trim().length < 2 ? <div className="search-start"><div><h2>Oxirgi qidiruvlar</h2>{recent.length ? <div className="recent-searches">{recent.map((item)=><button key={item} onClick={()=>setQuery(item)}>↗ {item}</button>)}</div> : <p>Hali qidiruv tarixi yo‘q.</p>}</div><aside><span>Maslahat</span><p>Tez ochish uchun istalgan sahifada <kbd>/</kbd> tugmasini bosing.</p></aside></div> : loading ? <div className="search-skeleton"><i/><i/><i/><i/></div> : error ? <div className="search-error"><h2>Qidiruv ishlamadi</h2><p>{error}</p><button onClick={()=>setQuery(`${query} `)}>Qayta urinish</button></div> : items.length ? <div className="search-results"><div className="search-summary"><span><b>{result.total}</b> natija</span><small>“{result.query}” uchun</small></div>{items.map((item,index)=><Link to={item.url} className="search-result" key={`${item.type}-${item.id}`}><span className="result-index">{String(index+1).padStart(2,"0")}</span><div className="result-image">{item.image_url?<img src={item.image_url} alt=""/>:<b>{item.title?.[0]}</b>}</div><div className="result-copy"><small>{LABELS[item.type]}{item.meta&&` · ${item.meta}`}</small><h2>{item.title}</h2>{(item.subtitle||item.description)&&<p>{item.subtitle||item.description}</p>}</div><span className="result-arrow">↗</span></Link>)}</div> : <div className="search-empty"><span>0 natija</span><h2>Bu so‘z bilan hech narsa topilmadi.</h2><p>{result?.suggestion}</p><button onClick={()=>{setQuery("");inputRef.current?.focus();}}>Boshqa so‘z yozish</button></div>}
  </section>;
}
