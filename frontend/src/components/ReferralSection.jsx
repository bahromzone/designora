import { useCallback, useEffect, useState } from "react";

import { referralApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ReferralSection() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await referralApi.myCode();
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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

  async function applyCode(event) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setApplying(true);
    try {
      await referralApi.apply(normalized);
      setCode("");
      toast.success("Referral kodi muvaffaqiyatli qo'llandi!");
      await load();
    } catch (error) {
      toast.error(error.message || "Referral kodini qo'llab bo'lmadi.");
    } finally {
      setApplying(false);
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
        <p
          role="status"
          className="mt-5 text-sm"
          style={{ color: "var(--muted)" }}
        >
          Taklif kodingiz yuklanmoqda...
        </p>
      ) : !data ? (
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Referral kodini yuklab bo'lmadi.
        </p>
      ) : (
        <>
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
              type="button"
              onClick={copyCode}
              className="btn-primary shrink-0 px-5 py-3 text-sm"
            >
              {copied ? "Nusxa olindi ✓" : "Nusxa olish"}
            </button>
          </div>

          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={applyCode}
          >
            <label className="sr-only" htmlFor="referral-code">
              Do'stingizning referral kodi
            </label>
            <input
              id="referral-code"
              className="input-field flex-1 uppercase"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Do'stingiz kodini kiriting"
              minLength={4}
              maxLength={32}
              autoComplete="off"
              disabled={applying}
            />
            <button
              type="submit"
              className="btn-outline shrink-0 px-5 py-3 text-sm"
              disabled={applying || code.trim().length < 4}
            >
              {applying ? "Qo'llanmoqda..." : "Kodni qo'llash"}
            </button>
          </form>

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
