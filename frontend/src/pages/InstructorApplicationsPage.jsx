import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  adminApproveInstructor,
  adminListInstructorApplications,
  adminRejectInstructor,
} from "../lib/authExtra";
import { EmptyState, Spinner } from "../components/ui";

export default function InstructorApplicationsPage() {
  const { token } = useAuth();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    adminListInstructorApplications(token)
      .then((res) => active && setApps(Array.isArray(res) ? res : []))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  async function handleDecision(userId, decide) {
    setBusyId(userId);
    setError("");
    try {
      if (decide === "approve") {
        await adminApproveInstructor(token, userId);
      } else {
        await adminRejectInstructor(token, userId);
      }
      // Ro'yxatdan olib tashlaymiz (qayta so'rovsiz).
      setApps((prev) => prev.filter((a) => a.id !== userId));
    } catch (e) {
      setError(e.message || "Amalni bajarib bo'lmadi.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className="shell flex justify-center py-24">
        <Spinner />
      </section>
    );
  }

  if (error) {
    return (
      <section className="shell py-24">
        <EmptyState
          title="Ochib bo'lmadi"
          description={
            error ||
            "Bu sahifa faqat admin uchun. Ruxsatingiz yo'q bo'lishi mumkin."
          }
        />
        <div className="mt-6 text-center">
          <Link to="/admin-panel" className="btn-outline">
            ← Admin panelga qaytish
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="shell py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin paneli</p>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Instruktor arizalari
          </h1>
        </div>
        <Link to="/admin-panel" className="btn-outline">
          ← Dashboard
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Yangi ariza yo'q"
            description="Hozircha ko'rib chiqiladigan instruktor arizasi mavjud emas."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {apps.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border p-5 sm:p-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {a.name || "Ism ko'rsatilmagan"}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {a.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleDecision(a.id, "approve")}
                    className="btn-dark py-2 px-4 text-sm"
                  >
                    {busyId === a.id ? "..." : "Tasdiqlash"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleDecision(a.id, "reject")}
                    className="btn-outline py-2 px-4 text-sm"
                  >
                    Rad etish
                  </button>
                </div>
              </div>

              {a.bio && (
                <p
                  className="mt-4 text-sm leading-7"
                  style={{ color: "var(--ink-60)" }}
                >
                  {a.bio}
                </p>
              )}

              {a.portfolio_url && (
                <a
                  href={a.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-[#813BFF] hover:underline"
                >
                  Portfolio ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
