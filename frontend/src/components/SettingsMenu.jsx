import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function SettingsMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onPointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  if (!isAuthenticated) return null;

  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = isSuperadmin || user?.role === "admin";

  function signOut() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <div ref={menuRef} className="fixed right-5 top-24 z-50">
      <button type="button" aria-label="Sozlamalarni ochish" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:rotate-45 hover:border-violet-300 hover:text-violet-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8.1 3.8-1.7-.6a6.9 6.9 0 0 0-.7-1.7l.8-1.6-1.9-1.9-1.6.8a6.9 6.9 0 0 0-1.7-.7l-.6-1.7h-2.7l-.6 1.7a6.9 6.9 0 0 0-1.7.7l-1.6-.8-1.9 1.9.8 1.6a6.9 6.9 0 0 0-.7 1.7l-1.7.6v2.7l1.7.6c.2.6.4 1.2.7 1.7l-.8 1.6 1.9 1.9 1.6-.8c.5.3 1.1.5 1.7.7l.6 1.7h2.7l.6-1.7c.6-.2 1.2-.4 1.7-.7l1.6.8 1.9-1.9-.8-1.6c.3-.5.5-1.1.7-1.7l1.7-.6v-2.7Z" /></svg>
      </button>
      {open && <div role="menu" className="absolute right-0 mt-3 max-h-[min(70vh,30rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl" onClick={() => setOpen(false)}>
        <div className="border-b border-slate-100 px-3 pb-3"><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Sozlamalar</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.email}</p><p className="text-xs text-slate-500">Rol: {user?.role}</p></div>
        <div className="grid gap-1 py-2">
          <Link role="menuitem" className="rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" to="/profil">Profil</Link>
          <Link role="menuitem" className="rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" to="/kurslarim">Mening kurslarim</Link>
          <Link role="menuitem" className="rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" to="/calendar">Kalendar</Link>
          {isAdmin && <Link role="menuitem" className="rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50" to="/admin">Admin paneli</Link>}
          {isSuperadmin && <Link role="menuitem" className="rounded-xl px-3 py-2.5 text-sm hover:bg-violet-50 hover:text-violet-700" to="/superadmin">Superadmin paneli</Link>}
        </div>
        <button type="button" className="w-full rounded-xl border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={signOut}>Chiqish</button>
      </div>}
    </div>
  );
}
