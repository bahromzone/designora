import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { portfolioApi } from "../lib/portfolioApi";
import "./Portfolio.css";

export default function PublicPortfolioPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { portfolioApi.public(userId).then(setData).catch((err) => setError(err.message)); }, [userId]);
  if (error) return <section className="public-portfolio"><div className="portfolio-error"><h1>Portfolio topilmadi</h1><p>{error}</p></div></section>;
  if (!data) return <section className="public-portfolio"><div className="portfolio-skeleton" /></section>;
  const { user, projects } = data;
  return <section className="public-portfolio">
    <header><p>DESIGNORA PORTFOLIO</p><h1>{user.name}</h1><span>{user.bio || "Dizayn orqali muammolarni aniq va chiroyli yechaman."}</span><div>{user.location && <small>{user.location}</small>}{user.website && <a href={user.website} target="_blank" rel="noreferrer">Sayt ↗</a>}</div></header>
    {!projects.length ? <div className="portfolio-empty"><h2>Public loyihalar hali yo‘q.</h2></div> : <div className="public-projects">{projects.map((project, index) => <article key={project.id}>
      <div className="public-project-cover" style={project.cover_url ? { backgroundImage: `url(${project.cover_url})` } : {}}><span>{String(index + 1).padStart(2, "0")}</span></div>
      <div className="public-project-copy"><small>{[...(project.skills || []), ...(project.tools || [])].slice(0, 4).join(" · ") || "Design project"}</small><h2>{project.title}</h2><p>{project.summary || project.story}</p>{project.project_url && <a href={project.project_url} target="_blank" rel="noreferrer">Loyihani ko‘rish ↗</a>}</div>
    </article>)}</div>}
  </section>;
}
