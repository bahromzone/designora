import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GlobalSearchLauncher.css";

export default function GlobalSearchLauncher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleKey(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        navigate("/qidiruv");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  if (location.pathname === "/qidiruv") return null;
  return (
    <button className="global-search-launcher" type="button" onClick={() => navigate("/qidiruv")} aria-label="Global qidiruvni ochish">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <span>Qidiruv</span><kbd>/</kbd>
    </button>
  );
}
