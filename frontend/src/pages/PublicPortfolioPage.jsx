import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { portfolioApi } from "../lib/portfolioApi";
import "./Portfolio.css";

export default function PublicPortfolioPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { portfolioApi.public(userId).then(setData).catch((err) => setError(err.message)); }, [userId]);
  if (error) return <section className="public-portfolio-state"><h1>Portfolio topilmadi</h1><p>{error}</p><Link to="/">Designora’ga qaytish</Link></section>;
  if (!data) return <section className="public-portfolio-state"><p>Portfolio yuklanmoqda...</p></section>;
  const { owner, projects } = data;
  return <main className="public-portfolio">
    <header className="public-portfolio-head"><Link to="/" className="portfolio-wordmark">DESIGNORA</Link><span>Student portfolio</span></header>
    <section className="portfolio-intro"><div><p>Designer portfolio</p><h1>{owner.name}</h1><span>{owner.bio || "Fikrni vizual tizimga, bilimni real loyihaga aylantiraman."}</span></div><div className="portfolio-contact">{owner.location && <span>{owner.location}</span>}{owner.website && <a href={owner.website} target="_blank" rel="noreferrer">Website ↗</a>}<small>{projects.length} selected projects</small></div></section>
    {projects.length ? <section className="public-projects">{projects.map((project, index) => <article key={project.id} className={index % 2 ? "is-reverse" : ""}><div className="public-project-image">{project.cover_url ? <img src={project.cover_url} alt={`${project.title} cover`} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</div><div className="public-project-copy"><p>{[...(project.skills || []), ...(project.tools || [])].slice(0, 3).join(" · ") || "Design project"}</p><h2>{project.title}</h2><span>{project.summary}</span>{project.story && <p className="project-story">{project.story}</p>}{project.project_url && <a href={project.project_url} target="_blank" rel="noreferrer">Loyihani ko‘rish <b>↗</b></a>}</div></article>)}</section> : <section className="public-portfolio-state"><h2>Portfolio tayyorlanmoqda</h2><p>Public loyihalar tez orada shu yerda chiqadi.</p></section>}
    <footer className="public-portfolio-foot"><span>Built while learning on Designora</span><Link to="/kurslar">Dizaynni o‘rganish →</Link></footer>
  </main>;
}
