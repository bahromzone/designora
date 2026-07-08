import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { forumApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "../components/ui";

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

export default function ForumThreadPage() {
  const { threadId } = useParams();
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    forumApi
      .getThread(threadId)
      .then((data) => active && setThread(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [threadId]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  async function submitReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await forumApi.reply(threadId, { body: reply.trim() }, token);
      setReply("");
      load();
    } catch (err) {
      toast.error(err.message || "Javobni yuborib bo'lmadi.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </section>
    );
  }

  if (error || !thread) {
    return (
      <section className="shell py-24">
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error || "Mavzu topilmadi"}
        </div>
        <Link
          to="/forum"
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: "var(--amber)" }}
        >
          ← Forumga qaytish
        </Link>
      </section>
    );
  }

  const posts = thread.posts ?? [];

  return (
    <section className="shell max-w-3xl py-16 sm:py-20">
      <Link
        to="/forum"
        className="mb-6 inline-block text-sm font-semibold"
        style={{ color: "var(--muted)" }}
      >
        ← Forum
      </Link>

      {/* Mavzu boshi */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          {thread.is_pinned && <span aria-hidden>📌</span>}
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {thread.title}
          </h1>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {thread.author || "Foydalanuvchi"} · {formatDate(thread.created_at)}
        </p>
        {thread.body && (
          <p
            className="mt-4 whitespace-pre-wrap text-base leading-8"
            style={{ color: "var(--ink)" }}
          >
            {thread.body}
          </p>
        )}
      </div>

      {/* Javoblar */}
      <h2 className="mt-10 font-serif text-xl font-semibold text-ink">
        {posts.length} javob
      </h2>
      <ul className="mt-4 space-y-3">
        {posts.map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {p.author || "Foydalanuvchi"} · {formatDate(p.created_at)}
            </p>
            <p
              className="mt-2 whitespace-pre-wrap text-sm leading-7"
              style={{ color: "var(--ink)" }}
            >
              {p.body}
            </p>
          </li>
        ))}
      </ul>

      {/* Javob yozish */}
      {thread.is_locked ? (
        <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
          Bu mavzu yopilgan, yangi javob qo'shib bo'lmaydi.
        </p>
      ) : isAuthenticated ? (
        <form onSubmit={submitReply} className="mt-8 space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Javobingizni yozing..."
            rows={4}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60"
          >
            {sending ? "..." : "Javob yuborish"}
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm" style={{ color: "var(--muted)" }}>
          Javob yozish uchun{" "}
          <Link
            to="/kirish"
            className="font-semibold"
            style={{ color: "var(--amber)" }}
          >
            tizimga kiring
          </Link>
          .
        </p>
      )}
    </section>
  );
}
