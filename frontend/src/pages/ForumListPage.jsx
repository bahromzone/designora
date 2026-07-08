import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { forumApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EmptyState, Pagination, Spinner } from "../components/ui";

const PER_PAGE = 20;

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  return `${Math.floor(hr / 24)} kun oldin`;
}

function NewThreadForm({ onCreated }) {
  const { token } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error("Mavzu sarlavhasi kamida 3 belgi bo'lsin.");
      return;
    }
    setBusy(true);
    try {
      const res = await forumApi.createThread(
        { title: title.trim(), body: body.trim() },
        token
      );
      toast.success("Mavzu yaratildi.");
      setTitle("");
      setBody("");
      setOpen(false);
      onCreated(res?.id);
    } catch (err) {
      toast.error(err.message || "Mavzu yaratib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary px-6 py-2.5 text-sm"
      >
        + Yangi mavzu
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mavzu sarlavhasi"
        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: "var(--border)" }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Mavzu matni (ixtiyoriy)..."
        rows={4}
        className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
        style={{ borderColor: "var(--border)" }}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary px-5 py-2 text-sm disabled:opacity-60"
        >
          {busy ? "..." : "Yaratish"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-outline px-5 py-2 text-sm"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

export default function ForumListPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setPage = useCallback(
    (p) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(p));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    forumApi
      .listThreads({ page, per_page: PER_PAGE })
      .then((res) => active && setData(res))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const results = data?.results ?? [];

  return (
    <section className="shell py-16 sm:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label mb-3">Forum</p>
          <h1
            className="font-serif font-semibold text-ink leading-tight"
            style={{ fontSize: "clamp(2rem,4.5vw,3rem)" }}
          >
            Hamjamiyat forumi
          </h1>
          <p
            className="mt-3 text-lg leading-8"
            style={{ color: "var(--ink-60)" }}
          >
            Savol bering, tajriba ulashing, bir-biringizga yordam bering.
          </p>
        </div>
        {isAuthenticated && <NewThreadForm onCreated={() => load()} />}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div
          className="rounded-2xl px-6 py-5 text-sm"
          style={{ background: "#fff0ef", color: "#c0392b" }}
        >
          {error}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Hozircha mavzu yo'q"
          description="Birinchi bo'lib mavzu oching!"
        />
      ) : (
        <>
          <ul
            className="divide-y overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border)" }}
          >
            {results.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/forum/${t.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {t.is_pinned && <span aria-hidden>📌</span>}
                      <span className="truncate font-semibold text-ink">
                        {t.title}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      {t.author || "Foydalanuvchi"} · {timeAgo(t.created_at)}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs"
                    style={{ color: "var(--muted)" }}
                  >
                    {t.replies || 0} javob
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Pagination
              page={page}
              pages={data?.pages ?? 1}
              onChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}
