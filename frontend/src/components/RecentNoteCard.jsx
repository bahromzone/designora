import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { formatSeconds } from "../lib/api";
import { notesWorkspaceApi } from "../lib/notesWorkspaceApi";

export default function RecentNoteCard() {
  const { token } = useAuth();
  const [note, setNote] = useState(null);
  useEffect(() => { notesWorkspaceApi.recent(token).then(setNote).catch(() => null); }, [token]);
  if (!note) return null;
  return (
    <aside className="mx-auto mt-8 flex max-w-[1132px] items-center justify-between gap-5 border-y py-5" style={{ borderColor: "var(--border)" }}>
      <div><p className="label">So‘nggi note</p><strong>{note.lesson_title || "Dars"} · {formatSeconds(note.timestamp_seconds)}</strong><p className="text-sm text-ink-60">{note.body}</p></div>
      <Link className="btn-outline" to={`/organish/${note.course_id}?lesson=${note.lesson_id}&t=${note.timestamp_seconds}`}>Note’ga qaytish</Link>
    </aside>
  );
}
