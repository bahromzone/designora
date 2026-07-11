import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import "./SearchShortcut.css";

export default function SearchShortcut() {
  const navigate = useNavigate();
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    const forumLink = document.querySelector('header nav a[href="/forum"]');
    if (!forumLink) return undefined;

    const target = document.createElement("span");
    target.className = "navbar-search-slot";
    forumLink.insertAdjacentElement("afterend", target);
    setSlot(target);

    return () => {
      setSlot(null);
      target.remove();
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/qidiruv");
      }
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        event.preventDefault();
        navigate("/qidiruv");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (!slot) return null;

  return createPortal(
    <button
      type="button"
      className="global-search-shortcut"
      onClick={() => navigate("/qidiruv")}
      aria-label="Global qidiruvni ochish"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>Qidiruv</span>
      <kbd>⌘ K</kbd>
    </button>,
    slot,
  );
}
