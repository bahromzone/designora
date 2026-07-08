import { useCallback, useEffect, useState } from "react";

import { qaApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "./ui";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function AnswerForm({ questionId, onDone }) {
  const { token } = useAuth();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await qaApi.answer(questionId, { body: body.trim() }, token);
      setBody("");
      onDone();
    } catch (err) {
      toast.error(err.message || "Javobni yuborib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        className="input-field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Javob yozing..."
      />
      <button
        type="submit"
        disabled={busy}
        className="btn-outline shrink-0 px-4 py-2 text-sm"
      >
        {busy ? "..." : "Javob"}
      </button>
    </form>
  );
}

/**
 * Dars ostidagi savol-javob (Q&A).
 *
 * Props: lessonId
 */
export default function QASection({ lessonId }) {
  const { token, user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [asking, setAsking] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const load = useCallback(async () => {
    if (!lessonId || !token) return;
    setLoading(true);
    try {
      const list = await qaApi.list(lessonId, token);
      setQuestions(Array.isArray(list) ? list : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function ask(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setAsking(true);
    try {
      await qaApi.ask(lessonId, { body: body.trim() }, token);
      setBody("");
      toast.success("Savolingiz yuborildi.");
      await load();
    } catch (err) {
      toast.error(err.message || "Savolni yuborib bo'lmadi.");
    } finally {
      setAsking(false);
    }
  }

  async function resolve(id) {
    try {
      await qaApi.resolve(id, token);
      await load();
    } catch (err) {
      toast.error(err.message || "Bajarilmadi.");
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <h3 className="font-semibold text-ink">Savol-javob</h3>

      <form onSubmit={ask} className="mt-3 flex gap-2">
        <input
          className="input-field"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ushbu dars bo'yicha savolingiz..."
        />
        <button
          type="submit"
          disabled={asking}
          className="btn-primary shrink-0 px-4 py-2 text-sm"
        >
          {asking ? "..." : "So'rash"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : questions.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Hali savollar yo'q. Birinchi savolni bering!
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">
                  {q.author || "Foydalanuvchi"}
                  {q.is_resolved && (
                    <span className="ml-2 text-xs font-normal text-emerald-600">
                      ✓ hal qilingan
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(q.created_at)}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink">{q.body}</p>

              {(q.answers ?? []).length > 0 && (
                <div className="mt-3 space-y-2 border-l-2 border-violet-200 pl-3">
                  {q.answers.map((a) => (
                    <div key={a.id} className="text-sm">
                      <span className="font-semibold text-ink">
                        {a.author || "Foydalanuvchi"}
                        {a.is_instructor && (
                          <span className="ml-1 text-xs text-violet-700">
                            (instruktor)
                          </span>
                        )}
                      </span>
                      <span className="ml-2 text-ink-60">{a.body}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => setReplyTo(replyTo === q.id ? null : q.id)}
                  className="font-semibold text-violet-700 hover:underline"
                >
                  Javob berish
                </button>
                {!q.is_resolved && user && q.user_id === user.id && (
                  <button
                    type="button"
                    onClick={() => resolve(q.id)}
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Hal qilindi deb belgilash
                  </button>
                )}
              </div>

              {replyTo === q.id && (
                <AnswerForm
                  questionId={q.id}
                  onDone={() => {
                    setReplyTo(null);
                    load();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
