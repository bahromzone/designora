import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { learningPathsApi } from "../lib/learningPathsApi";
import "./LearningPathsPage.css";

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    learningPathsApi.list().then(setPaths).catch((reason) => setError(reason.message));
  }, []);
  return (
    <section className="paths-shell">
      <header><p className="label">Learning paths</p><h1>Maqsaddan natijagacha aniq yo‘l</h1><p>Prerequisite, progress va yakuniy loyiha bilan tuzilgan 4 ta professional yo‘nalish.</p></header>
      {error && <p role="alert">{error}</p>}
      <div className="paths-grid">
        {paths.map((path) => (
          <Link key={path.slug} to={`/learning-paths/${path.slug}`} className="path-card" style={{"--path-accent":path.accent}}>
            <span>{path.courses_count} kurs · {Math.round(path.duration_minutes / 60)} soat</span>
            <h2>{path.title}</h2><p>{path.description}</p><b>Path’ni ko‘rish →</b>
          </Link>
        ))}
      </div>
    </section>
  );
}
