import { useCallback, useEffect, useState } from "react";

import { gamificationApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

// Backend bilan mos: har 100 ball = 1 daraja (POINTS_PER_LEVEL).
const POINTS_PER_LEVEL = 100;

export default function GamificationSection() {
  const { token, user, isAuthenticated } = useAuth();

  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [meRes, badgesRes, boardRes] = await Promise.all([
        gamificationApi.me(token),
        gamificationApi.badges(token),
        gamificationApi.leaderboard(10),
      ]);
      setMe(meRes);
      setCatalog(Array.isArray(badgesRes) ? badgesRes : []);
      setBoard(Array.isArray(boardRes) ? boardRes : []);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div
        className="flex justify-center rounded-2xl border p-10"
        style={{ borderColor: "var(--border)" }}
      >
        <Spinner />
      </div>
    );
  }

  if (!me) {
    return (
      <div
        className="rounded-2xl border p-6 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        Gamifikatsiya ma'lumotlarini yuklab bo'lmadi.
      </div>
    );
  }

  const toNext = me.points_to_next_level ?? 0;
  const inLevel = Math.max(0, POINTS_PER_LEVEL - toNext);
  const progress = Math.min(100, Math.round((inLevel / POINTS_PER_LEVEL) * 100));
  const earnedCount = catalog.filter((b) => b.earned).length;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="label mb-2">Yutuqlar</p>
      <h2 className="font-serif text-lg font-semibold text-ink">
        Ball, daraja va nishonlar
      </h2>

      {/* Ball / daraja / streak */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Ball", value: me.points ?? 0, icon: "✨" },
          { label: "Daraja", value: me.level ?? 1, icon: "🚀" },
          { label: "Streak (kun)", value: me.streak_days ?? 0, icon: "🔥" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="text-2xl">{s.icon}</div>
            <p className="mt-1 font-serif text-2xl font-semibold text-ink">
              {s.value}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Keyingi darajagacha progress */}
      <div className="mt-5">
        <div
          className="mb-1.5 flex justify-between text-xs"
          style={{ color: "var(--muted)" }}
        >
          <span>Keyingi darajagacha</span>
          <span>{toNext} ball qoldi</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--surface)" }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundImage: "var(--gradient)",
            }}
          />
        </div>
      </div>

      {/* Nishonlar katalogi */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Nishonlar</h3>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {earnedCount}/{catalog.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {catalog.map((b) => (
            <div
              key={b.code}
              title={b.description}
              className="rounded-xl border p-3 text-center"
              style={{
                borderColor: "var(--border)",
                opacity: b.earned ? 1 : 0.4,
                background: b.earned ? "var(--amber-10)" : "transparent",
              }}
            >
              <div className="text-2xl">{b.icon}</div>
              <p className="mt-1 text-xs font-semibold text-ink">{b.title}</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                {b.earned ? "Qo'lga kiritildi" : `+${b.points} ball`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reyting jadvali (leaderboard) */}
      {board.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-ink">
            Reyting jadvali
          </h3>
          <ul className="space-y-1.5">
            {board.map((row) => {
              const isMe = user?.id === row.user_id;
              return (
                <li
                  key={row.user_id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: isMe ? "var(--amber-10)" : "transparent",
                  }}
                >
                  <span
                    className="w-6 text-center font-semibold"
                    style={{ color: "var(--brand)" }}
                  >
                    {row.rank}
                  </span>
                  <span className="flex-1 truncate font-medium text-ink">
                    {row.name || "Foydalanuvchi"}
                    {isMe && (
                      <span
                        className="ml-2 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        (siz)
                      </span>
                    )}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {row.level}-daraja
                  </span>
                  <span className="w-16 text-right font-semibold text-ink">
                    {row.points} ball
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
