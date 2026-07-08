import { useCallback, useEffect, useState } from "react";

import { referralApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "./ui";

export default function ReferralSection() {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await referralApi.myCode(token);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function copyCode() {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      toast.success("Kod nusxa olindi!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nusxa olib bo'lmadi.");
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <h3 className="font-serif text-xl font-semibold text-ink">
        Do'stlaringizni taklif qiling
      </h3>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-60)" }}>
        Kodingizni ulashing: har bir yangi foydalanuvchi uchun ball oling.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !data ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Referral kodini yuklab bo'lmadi.
        </p>
      ) : (
        <>
          {/* Kod + nusxa */}
          <div className="mt-5 flex items-center gap-3">
            <code
              className="flex-1 rounded-xl border px-4 py-3 text-lg font-bold tracking-widest text-ink"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              {data.code}
            </code>
            <button
              onClick={copyCode}
              className="btn-primary shrink-0 px-5 py-3 text-sm"
            >
              {copied ? "Nusxa olindi ✓" : "Nusxa olish"}
            </button>
          </div>

          {/* Statistika */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: "Taklif qilingan", value: data.total_referred || 0 },
              { label: "Faollashgan", value: data.converted || 0 },
              { label: "Ball", value: data.points_earned || 0 },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-4 text-center"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="font-serif text-2xl font-semibold text-ink">
                  {s.value}
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
