import { useCallback, useEffect, useState } from "react";

import { formatSeconds, notesApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "./ui";

/**
 * Dars eslatmalari. Faqat o'z eslatmalaringiz ko'rinadi.
 *
 * Props:
 *   lessonId
 *   currentTime — (ixtiyoriy) video joriy vaqti (soniya), eslatmaga bog'lanadi
 */
export default function NotesSection({ lessonId, currentTime = 0 }) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editBody, setEditBody] = useState("");

  const load = useCallback(async () => {
    if (!lessonId || !token) return;
    setLoading(true);
    try {
      const list = await notesApi.forLesson(lessonId, token);
      setNotes(Array.isArray(list) ? list : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await notesApi.create(
        lessonId,
        { body: body.trim(), timestamp_seconds: Math.floor(currentTime) || 0 },
        token
      );
      setBody("");
      await load();
    } catch (err) {
      toast.error(err.message || "Eslatmani saqlab bo'lmadi.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id) {
    if (!editBody.trim()) return;
    try {
      await notesApi.update(id, { body: editBody.trim() }, token);
      setEditId(null);
      setEditBody("");
      await load();
    } catch (err) {
      toast.error(err.message || "Tahrirlab bo'lmadi.");
    }
  }

  async function remove(id) {
    try {
      await notesApi.remove(id, token);
      await load();
    } catch (err) {
      toast.error(err.message || "O'chirib bo'lmadi.");
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <h3 className="font-semibold text-ink">Eslatmalar</h3>

      <form onSubmit={create} className="mt-3">
        <textarea
          className="input-field"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Bu daqiqada eslatma qo'shing..."
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary mt-2 px-4 py-2 text-sm"
        >
          {saving ? "..." : "Eslatma qo'shish"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Hali eslatmalar yo'q.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-border p-3 text-sm"
            >
              {editId === n.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="input-field"
                    rows={2}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(n.id)}
                      className="btn-primary px-4 py-1.5 text-xs"
                    >
                      Saqlash
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="btn-outline px-4 py-1.5 text-xs"
                    >
                      Bekor
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-ink">{n.body}</p>
                    {n.timestamp_seconds > 0 && (
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
                        {formatSeconds(n.timestamp_seconds)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(n.id);
                        setEditBody(n.body);
                      }}
                      className="font-semibold text-violet-700 hover:underline"
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="font-semibold text-rose-600 hover:underline"
                    >
                      O'chirish
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
