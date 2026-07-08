import { useEffect, useState } from "react";

import { referralApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ReferralCard() {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    referralApi
      .myCode(token)
      .then((res) => active && setData(res))
      .catch(() => active && setData(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  if (!isAuthenticated) return null;

  const code = data?.code || "";
  const shareUrl =
    code && typeof window !== "undefined"
      ? `${window.location.origin}/royxatdan-otish?ref=${code}`
      : "";

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} nusxalandi.`);
    } catch {
      toast.error("Nusxalab bo'lmadi.");
    }
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <p className="label mb-1">Referral</p>
      <h3 className="font-serif text-xl font-semibold text-ink">
        Do'stlarni taklif qiling
      </h3>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-60)" }}>
        Kodingiz orqali ro'yxatdan o'tgan har bir do'stingiz uchun ball
        yig'asiz.
      </p>

      {loading ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Yuklanmoqda...
        </p>
      ) : !code ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Referral kodi mavjud emas.
        </p>
      ) : (
        <>
          {/* Kod */}
          <div className="mt-4 flex items-center gap-2">
            <code
              className="flex-1 rounded-xl border px-4 py-2.5 text-center text-lg font-bold tracking-widest text-ink"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {code}
            </code>
            <button
              onClick={() => copy(code, "Kod")}
              className="btn-outline px-4 py-2.5 text-sm"
            >
              Nusxa
            </button>
          </div>

          {/* Ulashish havolasi */}
          <button
            onClick={() => copy(shareUrl, "Havola")}
            className="mt-2 w-full truncate rounded-xl border px-4 py-2 text-left text-xs"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            title={shareUrl}
          >
            🔗 {shareUrl}
          </button>

          {/* Statistika */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Taklif qilingan", val: data.total_referred ?? 0 },
              { label: "Ro'yxatdan o'tgan", val: data.converted ?? 0 },
              { label: "Yig'ilgan ball", val: data.points_earned ?? 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="font-serif text-2xl font-semibold text-ink">
                  {s.val}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
