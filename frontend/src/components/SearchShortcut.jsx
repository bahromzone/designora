import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchShortcut.css";

export default function SearchShortcut() {
  const navigate = useNavigate();
  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/qidiruv");
      }
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        navigate("/qidiruv");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
  return <button type="button" className="global-search-shortcut" onClick={() => navigate("/qidiruv")} aria-label="Global qidiruvni ochish"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span>Qidiruv</span><kbd>⌘ K</kbd></button>;
}
