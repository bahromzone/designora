import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { nextLearningStep, pathStatus } from "../lib/learningPathLogic";
import { learningPathsApi } from "../lib/learningPathsApi";
import "./LearningPathsPage.css";

export default function LearningPathDetailPage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const [path, setPath] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const request = token ? learningPathsApi.progress(slug, token) : learningPathsApi.detail(slug);
    request.then(setPath).catch((reason) => setError(reason.message));
  }, [slug, token]);
  const start = () => learningPathsApi.start(slug, token).then(setPath).catch((reason) => setError(reason.message));
  if (error) return <section className="paths-shell"><p role="alert">{error}</p></section>;
  if (!path) return <section className="paths-shell"><p>Learning path yuklanmoqda...</p></section>;
  const next = nextLearningStep(path);
  const status = pathStatus(path);
  return (
    <section className="paths-shell path-detail" style={{"--path-accent":path.accent}}>
      <header><Link to="/learning-paths">← Barcha path’lar</Link><p className="label">{status}</p><h1>{path.title}</h1><p>{path.description}</p><div className="path-progress"><i style={{width:`${path.progress_percent}%`}} /></div><small>{path.completed_steps}/{path.courses_count} bosqich · {path.progress_percent}%</small></header>
      <div className="path-steps">
        {path.steps.map((step) => (
          <article key={step.position} className={step.locked ? "locked" : step.completed ? "complete" : ""}>
            <span>{step.position}</span><div><small>{step.final_project ? "Yakuniy loyiha" : step.course.level || "Kurs"}</small><h2>{step.course.title}</h2><p>{step.course.subtitle}</p></div>
            {step.locked ? <b>🔒 Prerequisite kerak</b> : <Link to={`/kurslar/${step.course.id}`}>{step.completed ? "Qayta ko‘rish" : "Kursni ochish"}</Link>}
          </article>
        ))}
      </div>
      {!token ? <Link className="path-cta" to="/?modal=login">Boshlash uchun kiring</Link> : !path.started ? <button className="path-cta" onClick={start}>Path’ni boshlash</button> : next ? <Link className="path-cta" to={`/kurslar/${next.course.id}`}>Keyingi bosqichni davom ettirish</Link> : <strong className="path-cta">Path yakunlandi 🎉</strong>}
    </section>
  );
}
