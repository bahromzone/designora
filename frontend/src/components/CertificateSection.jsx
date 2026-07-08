import { useCallback, useEffect, useState } from "react";

import { certificatesApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Spinner } from "./ui";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Sertifikat bloki. Kurs 100% tugatilib, testlardan o'tilgach faollashadi.
 *
 * Props: courseId, isEnrolled, progress (0..100)
 */
export default function CertificateSection({ courseId, isEnrolled, progress }) {
  const { token, isAuthenticated } = useAuth();
  const toast = useToast();

  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !isEnrolled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const mine = await certificatesApi.mine(token);
      const found = (Array.isArray(mine) ? mine : []).find(
        (c) => String(c.course_id) === String(courseId)
      );
      setCert(found ?? null);
    } catch {
      setCert(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, token, isAuthenticated, isEnrolled]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIssue() {
    setIssuing(true);
    try {
      const c = await certificatesApi.issue(courseId, token);
      setCert(c);
      toast.success("Sertifikat berildi!");
    } catch (err) {
      toast.error(err.message || "Sertifikatni olib bo'lmadi.");
    } finally {
      setIssuing(false);
    }
  }

  async function handleDownload() {
    if (!cert) return;
    try {
      const res = await certificatesApi.download(cert.id, token);
      const url = res?.pdf_url || cert.pdf_url;
      if (url) {
        const full = url.startsWith("http") ? url : `${API_URL}${url}`;
        window.open(full, "_blank", "noopener");
      } else {
        toast.info("PDF hali tayyor emas.");
      }
    } catch (err) {
      toast.error(err.message || "Yuklab bo'lmadi.");
    }
  }

  // Kursga yozilmagan bo'lsa blokni ko'rsatmaymiz.
  if (!isAuthenticated || !isEnrolled) return null;

  const verifyUrl = cert ? `/verify/${cert.verification_code}` : null;
  const complete = (progress ?? 0) >= 100;

  return (
    <div className="mt-16">
      <h2 className="font-serif text-2xl font-semibold text-ink">Sertifikat</h2>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : cert ? (
          <div
            className="card rounded-2xl p-6"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(236,72,153,0.06), rgba(79,70,229,0.06))",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-4xl">🎓</p>
                <p className="mt-2 font-serif text-xl font-semibold text-ink">
                  {cert.title || "Kurs sertifikati"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Seriya: <span className="font-mono">{cert.serial}</span>
                  {cert.grade ? ` · Baho: ${cert.grade}` : ""}
                </p>
                <p className="text-sm text-muted">
                  Berilgan sana: {formatDate(cert.issued_at)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  PDF yuklab olish
                </button>
                {verifyUrl && (
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline px-5 py-2 text-center text-sm"
                  >
                    Tekshirish sahifasi
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : complete ? (
          <div className="card rounded-2xl p-6 text-center">
            <p className="text-4xl">🏆</p>
            <p className="mt-3 font-semibold text-ink">
              Tabriklaymiz! Kursni yakunladingiz.
            </p>
            <p className="mt-1 text-sm text-muted">
              Sertifikatingizni oling (barcha testlardan o'tilgan bo'lishi
              kerak).
            </p>
            <button
              type="button"
              onClick={handleIssue}
              disabled={issuing}
              className="btn-primary mx-auto mt-5 px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {issuing ? "..." : "Sertifikat olish"}
            </button>
          </div>
        ) : (
          <div className="card rounded-2xl p-6">
            <p className="text-sm text-muted">
              Sertifikat uchun kursni 100% tugatishingiz va barcha testlardan
              o'tishingiz kerak.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {progress ?? 0}% tugatildi
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
