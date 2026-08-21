import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { request } from "../lib/request";

export default function CourseAccessCodeForm({
  courseId,
  isAuthenticated,
  authLoading,
  onRedeemed,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function redeem(event) {
    event.preventDefault();
    if (busy) return;
    if (authLoading || !isAuthenticated) {
      navigate("/?modal=login", { state: { from: location.pathname } });
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await request("/api/course-access-codes/redeem", {
        method: "POST",
        body: JSON.stringify({ course_id: Number(courseId), code }),
      });
      setSuccess(result.message);
      onRedeemed?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-violet-100 pt-5">
      <p className="text-sm font-bold text-slate-900">
        Admin bergan kodingiz bormi?
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Tasdiqlangan to'lov kodini kiriting. Kod faqat siz va shu kurs uchun
        ishlaydi.
      </p>
      <form className="mt-3 flex gap-2" onSubmit={redeem}>
        <label className="sr-only" htmlFor={`course-code-${courseId}`}>
          Bir martalik kurs kodi
        </label>
        <input
          id={`course-code-${courseId}`}
          className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-3 font-mono text-sm font-bold uppercase tracking-wider text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="one-time-code"
          minLength={8}
          maxLength={32}
          required
          disabled={busy}
        />
        <button
          className="min-h-11 rounded-xl border border-violet-200 bg-white px-4 text-sm font-extrabold text-violet-700 transition hover:border-violet-400 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Tekshirilmoqda..." : "Kodni qo'llash"}
        </button>
      </form>
      {error && (
        <p
          className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          {success}
        </p>
      )}
    </div>
  );
}
