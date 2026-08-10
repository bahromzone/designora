import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";

const items = [
  {
    label: "Profil",
    description: "Shaxsiy ma'lumotlar, avatar, bio",
    to: "/profil",
  },
  {
    label: "Kurslarim",
    description: "Sotib olingan va ro'yxatdan o'tilgan kurslar",
    to: "/kurslarim",
  },
  {
    label: "Sertifikatlarim",
    description: "Olingan sertifikatlar",
    to: "/profil#certificates",
  },
  {
    label: "Saqlangan",
    description: "Keyinroq ko'rish uchun belgilangan kurslar",
    to: "/profil#saved",
  },
  {
    label: "To'lovlar tarixi",
    description: "Buyurtmalar va to'lovlar",
    to: "/profil#payments",
  },
  {
    label: "Sozlamalar",
    description: "Parol va email sozlamalari",
    to: "/profil#settings",
  },
];

function initials(user) {
  const value = user?.name || user?.full_name || user?.email || "U";
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function UserAccountMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  if (!isAuthenticated) return null;

  function signOut() {
    setOpen(false);
    logout();
    navigate("/");
  }

  return (
    <motion.div
      ref={ref}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-end px-6">
        <div className="pointer-events-auto relative mr-[6.75rem] shrink-0 md:mr-[7.75rem]">
          <button
            type="button"
            aria-label="Foydalanuvchi menyusi"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-md ring-1 ring-slate-200 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials(user)
            )}
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-3 pb-3 pt-2">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-100 font-bold text-violet-700">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(user)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user?.name || user?.full_name || "Designora user"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <nav className="py-2">
                {items.map((item) => (
                  <Link
                    key={item.to}
                    role="menuitem"
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-violet-50"
                  >
                    <span className="block text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={signOut}
                className="w-full border-t border-slate-100 px-3 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
              >
                Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
