import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { accountApi } from "../lib/accountApi";

export default function SavedCourseButton({
  courseId,
  initialSaved = false,
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  async function save() {
    if (busy || saved) return;
    setError("");
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/?modal=login", { state: { from: location.pathname } });
      return;
    }

    setBusy(true);
    try {
      await accountApi.saveCourse(courseId);
      setSaved(true);
    } catch (reason) {
      setError(reason.message || "Kursni saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        className="rounded-full border px-3 py-2 text-sm font-semibold transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--ink)" }}
        onClick={save}
        disabled={authLoading || busy || saved}
        aria-busy={busy}
        aria-pressed={saved}
      >
        {busy ? "Saqlanmoqda..." : saved ? "Saqlandi" : "Saqlash"}
      </button>
      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
