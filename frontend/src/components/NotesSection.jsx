import { useCallback, useEffect, useMemo, useState } from "react";

import { formatSeconds, notesApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { notesWorkspaceApi } from "../lib/notesWorkspaceApi";
import "./NotesSection.css";

export default function NotesSection({ lessonId, currentTime = 0 }) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [timestamp, setTimestamp] = useState(0);
  const [bookmark, setBookmark] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!lessonId || !token) return;
    try {
      const [rows, marks] = await Promise.all([
        notesApi.forLesson(lessonId, token),
        notesWorkspaceApi.bookmarks(token),
      ]);
      setNotes(Array.isArray(rows) ? rows : []);
      setBookmark(marks.some((item) => item.lesson_id === lessonId));
    } catch {
      setNotes([]);
    }
  }, [lessonId, token]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setTimestamp(Math.floor(currentTime || 0)); }, [currentTime]);

  const visible = useMemo(() => notes.filter((note) => note.body.toLowerCase().includes(query.toLowerCase())), [notes, query]);

  async function create(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      await notesApi.create(lessonId, { body: body.trim(), timestamp_seconds: timestamp }, token);
      setBody(""); await load();
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  async function saveEdit(id) {
    if (!editBody.trim()) return;
    await notesApi.update(id, { body: editBody.trim() }, token);
    setEditId(null); setEditBody(""); await load();
  }

  async function remove(id) {
    await notesApi.remove(id, token); await load();
  }

  async function toggleBookmark() {
    const next = !bookmark; setBookmark(next);
    try { await notesWorkspaceApi.setBookmark(lessonId, next, token); }
    catch (error) { setBookmark(!next); toast.error(error.message); }
  }

  if (!isAuthenticated) return null;
  return (
    <section className="notes-workspace">
      <header><div><span>Shaxsiy workspace</span><h2>Notes va bookmark</h2></div><button type="button" className={bookmark ? "is-bookmarked" : ""} onClick={toggleBookmark}>{bookmark ? "★ Bookmark qilingan" : "☆ Darsni bookmark qilish"}</button></header>
      <div className="notes-tools"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notes ichidan qidirish" /><a href={notesWorkspaceApi.exportUrl(token)} download>Export .md</a></div>
      <form onSubmit={create} className="quick-note"><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Fikrni tez yozing..." /><label>Vaqt kodi <input type="number" min="0" value={timestamp} onChange={(event) => setTimestamp(Number(event.target.value))} /></label><button disabled={saving}>{saving ? "Saqlanmoqda..." : "Note qo‘shish"}</button></form>
      <div className="note-timeline">
        {visible.map((note) => <article key={note.id}>
          <button className="note-time" type="button" title="Video vaqt kodiga qaytish">{formatSeconds(note.timestamp_seconds)}</button>
          {editId === note.id ? <div className="note-edit"><textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} /><button onClick={() => saveEdit(note.id)}>Saqlash</button><button onClick={() => setEditId(null)}>Bekor</button></div> : <><p>{note.body}</p><div><button onClick={() => { setEditId(note.id); setEditBody(note.body); }}>Tahrirlash</button><button onClick={() => remove(note.id)}>O‘chirish</button></div></>}
        </article>)}
        {!visible.length && <p className="notes-empty">Mos note topilmadi. Hozirgi vaqt kodida birinchisini yozing.</p>}
      </div>
    </section>
  );
}
