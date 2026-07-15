import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { notificationsApi } from "../lib/api";
import ReminderSettings from "./ReminderSettings";

const POLL_MS = 60000;

function timeAgo(iso) {
  if (!iso) return "";
  const min = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq oldin`;
  const hours = Math.floor(min / 60);
  return hours < 24 ? `${hours} soat oldin` : `${Math.floor(hours / 24)} kun oldin`;
}

export default function NotificationBell() {
  const { token, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const loadCount = useCallback(async () => {
    if (!token) return;
    try { setUnread((await notificationsApi.unreadCount(token)).unread || 0); } catch { /* non-critical */ }
  }, [token]);
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    loadCount();
    const id = setInterval(loadCount, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, loadCount]);
  async function toggle() {
    const next = !open;
    setOpen(next); setSettings(false);
    if (next) {
      setLoading(true);
      try { setItems(await notificationsApi.list(token)); } catch { setItems([]); }
      finally { setLoading(false); }
    }
  }
  async function readOne(item) {
    if (!item.is_read) {
      await notificationsApi.markRead(item.id, token);
      setUnread((count) => Math.max(0, count - 1));
    }
  }
  if (!isAuthenticated) return null;
  return (
    <div ref={wrapRef} className="relative">
      <button onClick={toggle} aria-label="Bildirishnomalar" className="relative p-2">🔔{unread > 0 && <b className="absolute -right-1 -top-1">{unread > 9 ? "9+" : unread}</b>}</button>
      {open && <div className="absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border bg-white shadow-xl">
        {settings ? <ReminderSettings onClose={() => setSettings(false)} /> : <div className="w-[360px] max-w-[calc(100vw-2rem)]">
          <header className="flex items-center justify-between border-b px-4 py-3"><strong>Bildirishnomalar</strong><button onClick={() => setSettings(true)} aria-label="Reminder sozlamalari">⚙ Sozlamalar</button></header>
          <div className="max-h-96 overflow-y-auto">{loading ? <p className="p-4">Yuklanmoqda...</p> : items.length === 0 ? <p className="p-4 text-slate-500">Hozircha bildirishnoma yo‘q.</p> : items.map((item) => item.link ? <Link key={item.id} to={item.link} onClick={() => { readOne(item); setOpen(false); }} className={`block border-b px-4 py-3 ${item.is_read ? "" : "bg-violet-50"}`}><b>{item.message}</b><small className="block">{timeAgo(item.created_at)}</small></Link> : <button key={item.id} onClick={() => readOne(item)} className={`block w-full border-b px-4 py-3 text-left ${item.is_read ? "" : "bg-violet-50"}`}><b>{item.message}</b><small className="block">{timeAgo(item.created_at)}</small></button>)}</div>
        </div>}
      </div>}
    </div>
  );
}
