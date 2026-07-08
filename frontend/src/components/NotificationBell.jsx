import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { notificationsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 60000; // har daqiqada o'qilmagan sonini yangilaymiz

function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const day = Math.floor(hr / 24);
  return `${day} kun oldin`;
}

export default function NotificationBell() {
  const { token, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const loadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationsApi.unreadCount(token);
      setUnread(res.unread || 0);
    } catch {
      // jim — qo'ng'iroq hisoblagichi kritik emas
    }
  }, [token]);

  // O'qilmagan sonini davriy yangilash
  useEffect(() => {
    if (!isAuthenticated) return;
    loadCount();
    const id = setInterval(loadCount, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, loadCount]);

  // Tashqariga bosilganda yopish
  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const list = await notificationsApi.list(token);
        setItems(Array.isArray(list) ? list : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function readOne(n) {
    if (n.is_read) return;
    try {
      await notificationsApi.markRead(n.id, token);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // jim
    }
  }

  async function readAll() {
    try {
      await notificationsApi.markAllRead(token);
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } catch {
      // jim
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Bildirishnomalar"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">
              Bildirishnomalar
            </span>
            {unread > 0 && (
              <button
                onClick={readAll}
                className="text-xs font-semibold text-violet-600 hover:underline"
              >
                Hammasini o'qish
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Yuklanmoqda...
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Hozircha bildirishnoma yo'q.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => {
                  const body = (
                    <div className="flex gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.is_read ? "bg-transparent" : "bg-violet-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-slate-700">
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => {
                            readOne(n);
                            setOpen(false);
                          }}
                          className={`block px-4 py-3 transition-colors hover:bg-slate-50 ${
                            n.is_read ? "" : "bg-violet-50/40"
                          }`}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          onClick={() => readOne(n)}
                          className={`block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                            n.is_read ? "" : "bg-violet-50/40"
                          }`}
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
